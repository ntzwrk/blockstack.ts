import * as fetch from 'isomorphic-fetch';

import { DebugType, log } from '../../debug';

export interface IProof {
	identifier: string;
	service: string;
	proof_url: string;
	valid: boolean;
}

export class Service {
	public static validateProof(proof: IProof, ownerAddress: string, name?: string): Promise<IProof> {
		return new Promise(resolve => {
			try {
				const proofUrl = this.getProofUrl(proof);
				fetch(proofUrl)
					.then(res => {
						if (res.status === 200) {
							res.text().then(text => {
								// Validate identity in provided proof body/tags if required
								if (this.shouldValidateIdentityInBody() && proof.identifier !== this.getProofIdentity(text)) {
									return resolve(proof);
								}
								const proofText = this.getProofStatement(text);
								proof.valid =
									this.containsValidProofStatement(proofText, name) ||
									this.containsValidAddressProofStatement(proofText, ownerAddress);
								return resolve(proof);
							});
						} else {
							log(
								DebugType.warn,
								`Proof url ${proofUrl} returned unexpected http status ${res.status}. Unable to validate proof.`
							);
							proof.valid = false;
							resolve(proof);
						}
					})
					.catch(err => {
						log(DebugType.warn, 'Error while requesting proof url', err);
						proof.valid = false;
						resolve(proof);
					});
			} catch (e) {
				log(DebugType.warn, 'Error while requesting proof url', e);
				proof.valid = false;
				resolve(proof);
			}
		});
	}

	public static getBaseUrls(): string[] {
		return [];
	}

	public static getProofIdentity(searchText: string) {
		return searchText;
	}

	public static getProofStatement(searchText: string) {
		return searchText;
	}

	public static shouldValidateIdentityInBody() {
		return false;
	}

	public static prefixScheme(proofUrl: string) {
		if (!proofUrl.startsWith('https://') && !proofUrl.startsWith('http://')) {
			return `https://${proofUrl}`;
		} else if (proofUrl.startsWith('http://')) {
			return proofUrl.replace('http://', 'https://');
		} else {
			return proofUrl;
		}
	}

	public static getProofUrl(proof: IProof) {
		const baseUrls = this.getBaseUrls();

		let proofUrl = proof.proof_url.toLowerCase();
		proofUrl = this.prefixScheme(proofUrl);

		for (const baseUrl of baseUrls) {
			const requiredPrefix = `${baseUrl}${proof.identifier}`.toLowerCase();
			if (proofUrl.startsWith(requiredPrefix)) {
				return proofUrl;
			}
		}
		throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`);
	}

	public static containsValidProofStatement(searchText: string, name?: string) {
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

	public static containsValidAddressProofStatement(proofStatement: string, address: string) {
		proofStatement = proofStatement.split(address)[0].toLowerCase() + address;

		const verificationStyles = [`verifying my blockstack id is secured with the address ${address}`];

		for (const verificationStyle of verificationStyles) {
			if (proofStatement.includes(verificationStyle)) {
				return true;
			}
		}

		return false;
	}
}
