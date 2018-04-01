import { URL } from 'url';
import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { DebugType, Logger } from './debug';
import { DidNotSatisfyJsonSchemaError, InvalidParameterError, InvalidProfileTokenError } from './error';
import { extractProfile } from './profile/jwt';
import { Person } from './profile/Person';
import { PersonJson } from './profile/schema/Person.json';
import { PersonLegacyJson } from './profile/schema/PersonLegacy.json';
import { ProfileJson } from './profile/schema/Profile.json';
import { ProfileTokenJson } from './profile/schema/ProfileToken.json';

/**
 * Creates an RFC1035-compliant zone file for a profile
 *
 * @param origin The zone file's origin, usually a Blockstack name
 * @param tokenFileUrl The zone file's token file URL, usually pointing to a profile
 * @returns An RFC1035-compliant zone file
 * @throws InvalidParameterError When the given token file URL is invalid
 */
export function makeProfileZoneFile(origin: string, tokenFileUrl: string): string {
	// TODO: Validate origin
	// TODO: Implement passing multiple URLs

	try {
		const url = new URL(tokenFileUrl);
	} catch (error) {
		throw new InvalidParameterError(
			'tokenFileUrl',
			'The given token file URL is no valid URL (due the `url` package)',
			tokenFileUrl
		);
	}

	const zoneFile: JsonZoneFile = {
		$origin: origin,
		$ttl: 3600,
		uri: [
			{
				name: '_http._tcp',
				priority: 10,
				target: tokenFileUrl,
				weight: 1
			}
		]
	};

	const zoneFileTemplate = '{$origin}\n{$ttl}\n{uri}\n';

	return makeZoneFile(zoneFile, zoneFileTemplate);
}

/**
 * Extracts a token file URL from a given zone file
 *
 * @param zoneFileJson The zone file to extract the URL from
 * @returns The token file URL from the zone file
 * @throws InvalidParameterError When the zone file has no attribute `uri`
 * @throws InvalidParameterError When the zone file's `uri` attribute is empty
 */
export function getTokenFileUrl(zoneFileJson: JsonZoneFile): string {
	if (zoneFileJson.uri === undefined) {
		throw new InvalidParameterError('zoneFileJson', 'Attribute "uri" does not exist', zoneFileJson);
	}
	if (zoneFileJson.uri.length === 0) {
		throw new InvalidParameterError('zoneFileJson', 'Attribute "uri" has no elements', zoneFileJson);
	}

	let tokenFileUrl = zoneFileJson.uri[0].target;

	// TODO: This probably still works incorrectly with '://' in GET parameters
	// (if it's allowed in the specification to pass these unencoded)
	if (!tokenFileUrl.includes('://')) {
		tokenFileUrl = `https://${tokenFileUrl}`;
	}

	return tokenFileUrl;
}

/**
 * Resolves a zone file to a profile JSON object
 *
 * @param zoneFile The zone file to resolve
 * @param publicKeyOrAddress The public key or address who owns it
 * @returns A promise containing `ProfileJson`.
 *          Resolves to a profile JSON object on success.
 *          Rejects with an `DidNotSatisfyJsonSchemaError`:
 *          1) When the retrieved JSON seems to be a [[Person]] but does not satisfy the corresponding JSON schema.
 *          2) When the retrieved JSON seems to be a [[PersonLegacy]] but does not satisfy the corresponding JSON schema.
 *          Rejects with an `InvalidProfileTokenError`:
 *          1) When the profile token has no elements,
 *          2) When the first element of the profile token has no "token" attribute.
 *
 * Please note that this function uses `fetch` and therefore can also reject with errors from there.
 */
export async function resolveZoneFileToProfile(zoneFile: string, publicKeyOrAddress: string): Promise<ProfileJson> {
	const zoneFileJson: JsonZoneFile = parseZoneFile(zoneFile);

	if (zoneFileJson.$origin === undefined) {
		let legacyProfileJson: PersonLegacyJson;
		try {
			legacyProfileJson = JSON.parse(zoneFile) as PersonLegacyJson;
		} catch (error) {
			throw new DidNotSatisfyJsonSchemaError('PersonLegacy.json', zoneFile);
		}
		return Person.fromLegacyFormat(legacyProfileJson).toJSON();
	}

	const tokenFileUrl = getTokenFileUrl(zoneFileJson);
	const response = await (await fetch(tokenFileUrl)).text();

	let profileTokenJson: ProfileTokenJson;
	try {
		profileTokenJson = JSON.parse(response) as ProfileTokenJson;
	} catch (error) {
		throw new InvalidProfileTokenError(response);
	}

	if (profileTokenJson.length === 0) {
		throw new InvalidProfileTokenError(profileTokenJson, 'The profile token has no elements');
	}
	if (profileTokenJson[0].token === undefined) {
		throw new InvalidProfileTokenError(
			profileTokenJson,
			'The first element of the profile token has no "token" attrbute'
		);
	}

	return extractProfile(profileTokenJson[0].token, publicKeyOrAddress);
}

/**
 * Resolves a zone file to a person JSON object
 *
 * @param zoneFile The zone file to resolve
 * @param publicKeyOrAddress The public key or address who owns it
 * @returns A promise containing `PersonJson`
 *
 * Please note that this function uses [[resolveZoneFileToProfile]] and therefore rejects with the same errors.
 */
export async function resolveZoneFileToPerson(zoneFile: string, publicKeyOrAddress: string): Promise<PersonJson> {
	return (await resolveZoneFileToProfile(zoneFile, publicKeyOrAddress)) as PersonJson;
}
