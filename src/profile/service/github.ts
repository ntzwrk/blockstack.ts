import { IProof, Service } from './service';

export class Github extends Service {
	public static getBaseUrls() {
		return ['https://gist.github.com/', 'http://gist.github.com', 'gist.github.com'];
	}

	public static getProofUrl(proof: IProof) {
		const baseUrls = this.getBaseUrls();
		let proofUrl = proof.proof_url.toLowerCase();

		proofUrl = super.prefixScheme(proofUrl);

		for (const baseUrl of baseUrls) {
			const requiredPrefix = `${baseUrl}${proof.identifier}`.toLowerCase();
			if (proofUrl.startsWith(requiredPrefix)) {
				const raw = proofUrl.endsWith('/') ? 'raw' : '/raw';
				return `${proofUrl}${raw}`;
			}
		}
		throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`);
	}
}
