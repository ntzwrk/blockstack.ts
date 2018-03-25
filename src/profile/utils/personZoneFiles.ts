import { parseZoneFile } from 'zone-file';

import { DebugType, log } from '../../debug';
import { Person } from '../Person';
import { Person as PersonJson } from '../schema/Person.json';
import { extractProfile } from './profileTokens';
import { getTokenFileUrl } from './profileZoneFiles';

export function resolveZoneFileToPerson(
	zoneFile: string,
	publicKeyOrAddress: string,
	callback: (profile: PersonJson | null) => any
) {
	let zoneFileJson = null;
	try {
		zoneFileJson = parseZoneFile(zoneFile);
		if (!zoneFileJson.hasOwnProperty('$origin')) {
			zoneFileJson = null;
			throw new Error('zone file is missing an origin');
		}
	} catch (e) {
		log(DebugType.error, 'Could not parse zone file', e);
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
			log(DebugType.error, 'Could not parse legacy zone file', error);
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
				log(DebugType.error, 'Could not extract profile', error);
			});
	} else {
		log(DebugType.warn, 'Token file url not found');
		callback(null);
		return;
	}
}
