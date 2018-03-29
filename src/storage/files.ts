import { loadUserData } from '../auth';
import { DebugType, Logger } from '../debug';
import { decryptECIES, encryptECIES, getPublicKeyFromPrivate, ICipherObject } from '../encryption';
import { NotImplementedError, RemoteServiceError } from '../error';
import { lookupProfile } from '../profile';
import { getBucketUrl, getFullReadUrl, getOrSetLocalGaiaHubConnection, uploadToGaiaHub } from './hub';

/**
 * Fetch the public read URL of a user file for the specified app.
 * @param {String} path - the path to the file to read
 * @param {String} username - The Blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {string} [zoneFileLookupURL=http://localhost:6270/v1/names/] The URL
 * to use for zonefile lookup
 * @return {Promise} that resolves to the public read URL of the file
 * or rejects with an error
 */
export function getUserAppFileUrl(
	path: string,
	username: string,
	appOrigin: string,
	zoneFileLookupURL: string = 'http://localhost:6270/v1/names/'
) {
	return lookupProfile(username, zoneFileLookupURL)
		.then(profile => {
			if (profile === null) {
				return null;
			}
			if (profile.apps !== undefined) {
				if (profile.apps[appOrigin] !== undefined) {
					return profile.apps[appOrigin];
				} else {
					return null;
				}
			} else {
				return null;
			}
		})
		.then(bucketUrl => {
			if (bucketUrl) {
				const bucket = bucketUrl.replace(/\/?(\?|#|$)/, '/$1');
				return `${bucket}${path}`;
			} else {
				return null;
			}
		});
}

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.decrypt=false] - try to decrypt the data with the app private key
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 * @param {String} [options.zoneFileLookupURL=http://localhost:6270/v1/names/] - the Blockstack
 * core endpoint URL to use for zonefile lookup
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(
	path: string,
	options?: {
		decrypt?: boolean;
		username?: string;
		app?: string;
		zoneFileLookupURL?: string;
	}
) {
	const defaults = {
		app: window.location.origin,
		decrypt: false,
		username: null,
		zoneFileLookupURL: 'http://localhost:6270/v1/names/'
	};

	const opt = { ...defaults, ...options };

	return getOrSetLocalGaiaHubConnection()
		.then(gaiaHubConfig => {
			if (opt.username) {
				return getUserAppFileUrl(path, opt.username, opt.app, opt.zoneFileLookupURL);
			} else {
				return getFullReadUrl(path, gaiaHubConfig);
			}
		})
		.then(
			readUrl =>
				new Promise<string>((resolve, reject) => {
					if (!readUrl) {
						reject(null);
					} else {
						resolve(readUrl);
					}
				})
		)
		.then(readUrl => fetch(readUrl))
		.then<null | string | ArrayBuffer>(response => {
			if (response.status !== 200) {
				if (response.status === 404) {
					Logger.log(DebugType.info, `getFile ${path} returned 404, returning null`);
					return null; // TODO: resolve(null) vs reject(null)?
				} else {
					throw new RemoteServiceError(response, `getFile ${path} failed with HTTP status ${response.status}`);
				}
			}
			const contentType = response.headers.get('Content-Type');
			if (contentType === null || opt.decrypt || contentType.startsWith('text') || contentType === 'application/json') {
				return response.text();
			} else {
				return response.arrayBuffer();
			}
		})
		.then(storedContents => {
			if (opt.decrypt && storedContents !== null) {
				const privateKey = loadUserData().appPrivateKey;
				if (typeof storedContents === 'string') {
					const cipherObject = JSON.parse(storedContents) as ICipherObject;
					return decryptECIES(privateKey, cipherObject);
				} else {
					// TODO: What to do with a ArrayBuffer in here?
				}
			} else {
				return storedContents;
			}
		});
}

/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Object} [options=null]- options object
 * @param {Boolean} [options.encrypt=false] - encrypt the data with the app private key
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, options?: { encrypt?: boolean }) {
	const defaults = {
		encrypt: false
	};

	const opt = { ...defaults, ...options };

	let contentType = 'text/plain';
	if (typeof content !== 'string') {
		contentType = 'application/octet-stream';
	}
	if (opt.encrypt) {
		const privateKey = loadUserData().appPrivateKey;
		const publicKey = getPublicKeyFromPrivate(privateKey);
		const cipherObject = encryptECIES(publicKey, content);
		content = JSON.stringify(cipherObject);
		contentType = 'application/json';
	}
	return getOrSetLocalGaiaHubConnection().then(gaiaHubConfig =>
		uploadToGaiaHub(path, content, gaiaHubConfig, contentType)
	);
}

/**
 * Get the app storage bucket URL
 * @param {String} gaiaHubUrl - the gaia hub URL
 * @param {String} appPrivateKey - the app private key used to generate the app address
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
export function getAppBucketUrl(gaiaHubUrl: string, appPrivateKey: string) {
	return getBucketUrl(gaiaHubUrl, appPrivateKey);
}

/**
 * Deletes the specified file from the app's data store.
 * @param {String} path - the path to the file to delete
 * @returns {Promise} that resolves when the file has been removed
 * or rejects with an error
 */
export function deleteFile(path: string) {
	throw new NotImplementedError('deleteFile', `Delete of "${path}" not supported by gaia hubs`);
}
