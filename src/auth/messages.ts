import { SECP256K1Client, TokenSigner } from 'jsontokens';

import { DEFAULT_SCOPE } from '../constants';
import { decryptECIES, encryptECIES, publicKeyToAddress } from '../crypto';
import { DebugType, Logger } from '../debug';
import { DecentralizedID } from '../dids';
import { ProfileJson } from '../profile/schema/Profile.json';
import { makeUUID4, nextHour, nextMonth } from '../utils';
import { generateAndStoreTransitKey } from './app';
import { AuthRequestJson } from './schema/AuthRequest.json';
import { AuthResponseJson } from './schema/AuthResponse.json';

const VERSION = '1.1.0';

export interface IAuthMetadata {
	email?: string;
	profileUrl?: string;
}

/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in. This authentication request can
 * then be used for sign in by passing it to the `redirectToSignInWithAuthRequest`
 * method.
 *
 * *Note: This method should only be used if you want to roll your own authentication
 * flow. Typically you'd use `redirectToSignIn` which takes care of this
 * under the hood.*
 *
 * @param  {String} [transitPrivateKey=generateAndStoreTransitKey()] - hex encoded transit
 *   private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @return {String} the authentication request
 */
export function makeAuthRequest(
	transitPrivateKey: string = generateAndStoreTransitKey(),
	redirectURI: string = `${window.location.origin}/`,
	manifestURI: string = `${window.location.origin}/manifest.json`,
	scopes: string[] = DEFAULT_SCOPE,
	appDomain: string = window.location.origin,
	expiresAt: number = nextHour().getTime()
): string {
	/* Create the payload */
	const payload: AuthRequestJson = {
		do_not_include_profile: true,
		domain_name: appDomain,
		exp: Math.floor(expiresAt / 1000), // JWT times are in seconds
		iat: Math.floor(new Date().getTime() / 1000), // JWT times are in seconds
		iss: null,
		jti: makeUUID4(),
		manifest_uri: manifestURI,
		public_keys: [],
		redirect_uri: redirectURI,
		scopes,
		supports_hub_url: true,
		version: VERSION
	};

	Logger.log(DebugType.info, `Generating a "v${VERSION}" auth request`);

	/* Convert the private key to a public key to an issuer */
	const publicKey = SECP256K1Client.derivePublicKey(transitPrivateKey);
	payload.public_keys = [publicKey];
	const address = publicKeyToAddress(publicKey);
	payload.iss = DecentralizedID.fromAddress(address).toString();

	/* Sign and return the token */
	const tokenSigner = new TokenSigner('ES256k', transitPrivateKey);
	return tokenSigner.sign(payload, false) as string;
}

/**
 * Encrypts the private key for decryption by the given
 * public key.
 * @param  {String} publicKey  [description]
 * @param  {String} privateKey [description]
 * @return {String} hex encoded ciphertext
 * @private
 */
export function encryptPrivateKey(publicKey: string, privateKey: string): string | null {
	const encryptedObj = encryptECIES(publicKey, privateKey);
	const encryptedJSON = JSON.stringify(encryptedObj);
	return new Buffer(encryptedJSON).toString('hex');
}

/**
 * Decrypts the hex encrypted private key
 * @param  {String} privateKey  the private key corresponding to the public
 * key for which the ciphertext was encrypted
 * @param  {String} hexedEncrypted the ciphertext
 * @return {String}  the decrypted private key
 * @throws {Error} if unable to decrypt
 */
export function decryptPrivateKey(privateKey: string, hexedEncrypted: string): string | Buffer {
	const unhexedString = new Buffer(hexedEncrypted, 'hex').toString();
	const encryptedObj = JSON.parse(unhexedString);
	return decryptECIES(privateKey, encryptedObj);
}

/**
 * Generates a signed authentication response token for an app. This
 * token is sent back to apps which use contents to access the
 * resources and data requested by the app.
 *
 * @param  {String} privateKey the identity key of the Blockstack ID generating
 * the authentication response
 * @param  {Object} profile the profile object for the Blockstack ID
 * @param  {String} username the username of the Blockstack ID if any, otherwise `null`
 * @param  {IAuthMetadata} metadata an object containing metadata sent as part of the authentication
 * response including `email` if requested and available and a URL to the profile
 * @param  {String} coreToken core session token when responding to a legacy auth request
 * or `null` for current direct to gaia authentication requests
 * @param  {String} appPrivateKey the application private key. This private key is
 * unique and specific for every Blockstack ID and application combination.
 * @param  {Number} expiresAt an integer in the same format as
 * `new Date().getTime()`, milliseconds since the Unix epoch
 * @param {String} transitPublicKey the public key provide by the app
 * in its authentication request with which secrets will be encrypted
 * @param {String} hubUrl URL to the write path of the user's Gaia hub
 * @return {String} signed and encoded authentication response token
 */
export function makeAuthResponse(
	privateKey: string,
	profile: ProfileJson,
	username: string | null = null,
	metadata: IAuthMetadata,
	coreToken: string | null,
	appPrivateKey: string | null,
	expiresAt: number = nextMonth().getTime(),
	transitPublicKey?: string,
	hubUrl: string | null = null
): string {
	/* Convert the private key to a public key to an issuer */
	const publicKey = SECP256K1Client.derivePublicKey(privateKey);
	const address = publicKeyToAddress(publicKey);

	/* See if we should encrypt with the transit key */
	let privateKeyPayload = appPrivateKey;
	let coreTokenPayload = coreToken;
	let additionalProperties = {};
	if (appPrivateKey !== undefined && appPrivateKey !== null) {
		Logger.log(DebugType.info, `Generating a "v${VERSION}" auth response`);
		if (transitPublicKey !== undefined && transitPublicKey !== null) {
			privateKeyPayload = encryptPrivateKey(transitPublicKey, appPrivateKey);
			if (coreToken !== undefined && coreToken !== null) {
				coreTokenPayload = encryptPrivateKey(transitPublicKey, coreToken);
			}
		}
		additionalProperties = {
			email: metadata.email ? metadata.email : null,
			hubUrl,
			profile_url: metadata.profileUrl ? metadata.profileUrl : null,
			version: VERSION
		};
	} else {
		Logger.log(DebugType.warn, 'Generating a _legacy_ auth response');
	}

	const properties: AuthResponseJson = {
		core_token: coreTokenPayload,
		exp: Math.floor(expiresAt / 1000), // JWT times are in seconds
		iat: Math.floor(new Date().getTime() / 1000), // JWT times are in seconds
		iss: DecentralizedID.fromAddress(address).toString(),
		jti: makeUUID4(),
		private_key: privateKeyPayload,
		profile,
		public_keys: [publicKey],
		username
	};

	/* Create the payload */
	const payload: AuthResponseJson = {
		...properties,
		...additionalProperties
	};

	/* Sign and return the token */
	const tokenSigner = new TokenSigner('ES256k', privateKey);
	return tokenSigner.sign(payload, false) as string;
}
