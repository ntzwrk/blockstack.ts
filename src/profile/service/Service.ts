import * as fetch from 'isomorphic-fetch';

import { DebugType, Logger } from '../../debug';
import { InvalidProofUrlError } from '../../error';
import { containsValidAddressProofStatement, containsValidProofStatement, IProof } from '../proof';

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
									containsValidProofStatement(proofText, name) ||
									containsValidAddressProofStatement(proofText, ownerAddress);
								return resolve(proof);
							});
						} else {
							Logger.log(
								DebugType.warn,
								`Proof url ${proofUrl} returned unexpected http status ${res.status}. Unable to validate proof.`
							);
							proof.valid = false;
							resolve(proof);
						}
					})
					.catch(err => {
						Logger.log(DebugType.warn, 'Error while requesting proof url', err);
						proof.valid = false;
						resolve(proof);
					});
			} catch (e) {
				Logger.log(DebugType.warn, 'Error while requesting proof url', e);
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
		throw new InvalidProofUrlError(proof.proof_url, proof.service);
	}
}
