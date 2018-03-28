import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { DebugType, Logger } from './debug';
import { InvalidTokenFileUrlError, MissingOriginError } from './error';
import { extractProfile } from './profile/jwt';
import { Person } from './profile/Person';
import { PersonJson } from './profile/schema/Person.json';
import { ProfileJson } from './profile/schema/Profile.json';

export function makeProfileZoneFile(origin: string, tokenFileUrl: string) {
	if (tokenFileUrl.indexOf('://') < 0) {
		throw new InvalidTokenFileUrlError(tokenFileUrl);
	}

	const urlScheme = tokenFileUrl.split('://')[0];
	const urlParts = tokenFileUrl.split('://')[1].split('/');
	const domain = urlParts[0];
	const pathname = `/${urlParts.slice(1).join('/')}`;

	const zoneFile: JsonZoneFile = {
		$origin: origin,
		$ttl: 3600,
		uri: [
			{
				name: '_http._tcp',
				priority: 10,
				target: `${urlScheme}://${domain}${pathname}`,
				weight: 1
			}
		]
	};

	const zoneFileTemplate = '{$origin}\n{$ttl}\n{uri}\n';

	return makeZoneFile(zoneFile, zoneFileTemplate);
}

export function getTokenFileUrl(zoneFileJson: JsonZoneFile): string | undefined {
	if (!zoneFileJson.hasOwnProperty('uri')) {
		return undefined;
	}
	if (!Array.isArray(zoneFileJson.uri)) {
		return undefined;
	}
	if (zoneFileJson.uri.length < 1) {
		return undefined;
	}
	const firstUriRecord = zoneFileJson.uri[0];

	if (!firstUriRecord.hasOwnProperty('target')) {
		return undefined;
	}
	let tokenFileUrl = firstUriRecord.target;

	if (tokenFileUrl.startsWith('https')) {
		// pass
	} else if (tokenFileUrl.startsWith('http')) {
		// pass
	} else {
		tokenFileUrl = `https://${tokenFileUrl}`;
	}

	return tokenFileUrl;
}

// TODO: Should this return ProfileJson or PersonJson?
export function resolveZoneFileToProfile(zoneFile: string, publicKeyOrAddress: string): Promise<PersonJson | null> {
	return new Promise((resolve, reject) => {
		let zoneFileJson = null;
		try {
			zoneFileJson = parseZoneFile(zoneFile);
			if (!zoneFileJson.hasOwnProperty('$origin')) {
				zoneFileJson = null;
			}
		} catch (e) {
			reject(e);
		}

		let tokenFileUrl: string | undefined;
		if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
			tokenFileUrl = getTokenFileUrl(zoneFileJson);
		} else {
			let profile = null;
			try {
				profile = JSON.parse(zoneFile);
				profile = Person.fromLegacyFormat(profile).toJSON();
			} catch (error) {
				reject(error);
			}
			resolve(profile);
			return;
		}

		if (tokenFileUrl) {
			fetch(tokenFileUrl)
				.then(response => response.text())
				.then(responseText => JSON.parse(responseText))
				.then(responseJson => {
					const tokenRecords = responseJson;
					const profile = extractProfile(tokenRecords[0].token, publicKeyOrAddress);
					resolve(profile);
					return;
				})
				.catch(error => {
					Logger.log(DebugType.error, `resolveZoneFileToProfile: error fetching token file ${tokenFileUrl}`, error);
					reject(error);
				});
		} else {
			Logger.log(DebugType.error, 'Token file url not found. Resolving to blank profile.');
			resolve(null);
			return;
		}
	});
}

export function resolveZoneFileToPerson(
	zoneFile: string,
	publicKeyOrAddress: string,
	callback: (profile: PersonJson | null) => any
) {
	let zoneFileJson = null;
	try {
		zoneFileJson = parseZoneFile(zoneFile);
		if (!zoneFileJson.hasOwnProperty('$origin')) {
			// TODO: This probably couldn't happen anymore with typed zone files
			throw new MissingOriginError(zoneFileJson);
		}
	} catch (e) {
		zoneFileJson = null;
		Logger.log(DebugType.error, 'Could not parse zone file', e);
	}

	let tokenFileUrl = null;
	if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
		tokenFileUrl = getTokenFileUrl(zoneFileJson);
	} else {
		let profile = null;
		try {
			// TODO: What's this and why?
			profile = JSON.parse(zoneFile);
			const person = Person.fromLegacyFormat(profile);
			profile = person.toJSON();
		} catch (error) {
			Logger.log(DebugType.error, 'Could not parse legacy zone file', error);
		}
		callback(profile);
		return;
	}

	if (tokenFileUrl) {
		fetch(tokenFileUrl)
			.then(response => response.text())
			.then(responseText => JSON.parse(responseText))
			.then(responseJson => {
				const tokenRecords = responseJson;
				const token = tokenRecords[0].token;
				const profile = extractProfile(token, publicKeyOrAddress);

				callback(profile);
				return;
			})
			.catch(error => {
				Logger.log(DebugType.error, 'Could not extract profile', error);
			});
	} else {
		Logger.log(DebugType.warn, 'Token file url not found');
		callback(null);
		return;
	}
}
