import { BlockstackCoreClient } from 'blockstack-core-client.ts';

import { config } from '../config';
import { NameZoneFile } from '../NameZoneFile';
import { Profile } from './Profile';
import { ProfileJson } from './schema/Person.json';

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=https://core.blockstack.org/v1/names/] The URL
 * to use for zonefile lookup
 * @returns {Promise} that resolves to a profile object
 */
/*export function lookupProfile(
	username: string,
	zoneFileLookupURL: string = 'https://core.blockstack.org/v1/names/'
): Promise<PersonJson | null> {
	return new Promise((resolve, reject) => {
		const url = `${zoneFileLookupURL.replace(/\/$/, '')}/${username}`;
		try {
			fetch(url)
				.then(response => response.text())
				.then(responseText => JSON.parse(responseText))
				.then(responseJSON => {
					if (responseJSON.hasOwnProperty('zonefile') && responseJSON.hasOwnProperty('address')) {
						resolve(NameZoneFile.fromString(responseJSON.zonefile).resolveToProfile(responseJSON.address));
					} else {
						reject();
					}
				})
				.catch(e => {
					reject(e);
				});
		} catch (e) {
			reject(e);
		}
	});
}*/

export async function lookupProfile(
	name: string,
	zoneFileLookupURL: string = 'https://core.blockstack.org/v1/names/'
): Promise<ProfileJson> {
	let coreClient: BlockstackCoreClient;
	if (zoneFileLookupURL !== undefined) {
		const url = new URL(zoneFileLookupURL);
		coreClient = new BlockstackCoreClient(url.hostname, parseInt(url.port), url.protocol);
	} else {
		coreClient = config.coreClient;
	}

	const zoneFile = await NameZoneFile.lookupByName(name, coreClient);
	return Profile.fromZoneFile(zoneFile);
}
