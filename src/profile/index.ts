export { Profile } from './Profile';

export { Person } from './Person';
export { Organization } from './Organization';
export { CreativeWork } from './CreativeWork';

export { signProfileToken, wrapProfileToken, verifyProfileToken, extractProfile } from './jwt';

export { validateProofs, containsValidProofStatement, containsValidAddressProofStatement } from './proof';

export { Service, profileServices } from './service';

import { resolveZoneFileToProfile } from '../zoneFile';
import { PersonJson } from './schema/Person.json';

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=https://core.blockstack.org/v1/names/] The URL
 * to use for zonefile lookup
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(
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
						resolve(resolveZoneFileToProfile(responseJSON.zonefile, responseJSON.address));
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
}
