import { AccountJson } from '../schema/components/Account.json';
import { ProfileJson } from '../schema/Profile.json';
import { profileServices } from '../service';
import { Service } from '../service/service';
import { IProof } from '../service/service';

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

export function containsValidProofStatement(searchText: string, name?: string) {
	if (!name) {
		return false;
	}

	searchText = searchText.toLowerCase();

	if (name.split('.').length !== 2) {
		throw new Error('Please provide the fully qualified Blockstack name.');
	}

	let username = null;

	// support legacy Blockstack ID proofs
	if (name.endsWith('.id')) {
		username = name.split('.id')[0];
	}

	const verificationStyles =
		username != null
			? [
					`verifying myself: my bitcoin username is +${username}`,
					`verifying myself: my bitcoin username is ${username}`,
					`verifying myself: my openname is ${username}`,
					`verifying that +${username} is my bitcoin username`,
					`verifying that ${username} is my bitcoin username`,
					`verifying that ${username} is my openname`,
					`verifying that +${username} is my openname`,
					`verifying i am +${username} on my passcard`,
					`verifying that +${username} is my blockchain id`,
					`verifying that "${name}" is my blockstack id`, // id
					`verifying that ${name} is my blockstack id`,
					`verifying that &quot;${name}&quot; is my blockstack id`
			]
			: [
					// only these formats are valid for non-.id tlds
					`verifying that "${name}" is my blockstack id`, // id
					`verifying that ${name} is my blockstack id`,
					`verifying that &quot;${name}&quot; is my blockstack id`
			];

	for (const verificationStyle of verificationStyles) {
		if (searchText.includes(verificationStyle)) {
			return true;
		}
	}

	if (username != null && searchText.includes('verifymyonename') && searchText.includes(`+${username}`)) {
		return true;
	}

	return false;
}

export function containsValidAddressProofStatement(proofStatement: string, address: string) {
	proofStatement = proofStatement.split(address)[0].toLowerCase() + address;

	const verificationStyles = [`verifying my blockstack id is secured with the address ${address}`];

	for (const verificationStyle of verificationStyles) {
		if (proofStatement.includes(verificationStyle)) {
			return true;
		}
	}

	return false;
}
