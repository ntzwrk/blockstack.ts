import { AccountJson } from '../schema/components/Account.json';
import { ProfileJson } from '../schema/Profile.json';
import { profileServices } from '../service';
import { Service } from '../service/service';
import { IProof } from '../service/serviceUtils';

/**
 * Validates the social proofs in a user's profile. Currently supports validation of
 * Facebook, Twitter, GitHub, Instagram, LinkedIn and HackerNews accounts.
 *
 * @param {Object} profile The JSON of the profile to be validated
 * @param {string} ownerAddress The owner bitcoin address to be validated
 * @param {string} [name=null] The Blockstack name to be validated
 * @returns {Promise} that resolves to an array of validated proof objects
 */
export function validateProofs(profile: ProfileJson, ownerAddress: string, name?: string): Promise<IProof[]> {
	if (!profile) {
		throw new Error('Profile must not be null');
	}

	let accounts: AccountJson[];
	let proofsToValidate: Array<Promise<IProof>> = [];

	if (profile.account !== undefined) {
		accounts = profile.account;
	} else {
		return new Promise(resolve => {
			resolve([]);
		});
	}

	accounts.forEach(account => {
		// TODO: Log errors

		// skip if proof service is not supported
		if (account.service === undefined || !profileServices.has(account.service)) {
			return;
		}

		if (
			account.identifier === undefined ||
			account.proofType === undefined ||
			account.proofUrl === undefined ||
			account.proofType !== 'http'
		) {
			return;
		}

		const proof: IProof = {
			identifier: account.identifier,
			proof_url: account.proofUrl,
			service: account.service,
			valid: false
		};

		const service: Service | undefined = profileServices.get(account.service);
		if (service !== undefined) {
			// FIXME: Seems to work, but gets shown as error
			// @ts-ignore
			const validatedProof = service.validateProof(proof, ownerAddress, name);
			proofsToValidate.push(validatedProof);
		}
	});

	return Promise.all(proofsToValidate);
}
