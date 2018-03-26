import * as cheerio from 'cheerio';

import { IProof, Service } from './service';

export class LinkedIn extends Service {
	public static getBaseUrls() {
		return [
			'https://www.linkedin.com/feed/update/',
			'http://www.linkedin.com/feed/update/',
			'www.linkedin.com/feed/update/'
		];
	}

	public static getProofUrl(proof: IProof) {
		const baseUrls = this.getBaseUrls();

		let proofUrl = proof.proof_url.toLowerCase();
		proofUrl = super.prefixScheme(proofUrl);

		for (const baseUrl of baseUrls) {
			if (proofUrl.startsWith(`${baseUrl}`)) {
				return proofUrl;
			}
		}
		throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`);
	}

	public static shouldValidateIdentityInBody() {
		return true;
	}

	public static getProofIdentity(searchText: string) {
		const $ = cheerio.load(searchText);
		const profileLink = $('article').find('.post-meta__profile-link');

		if (profileLink !== undefined) {
			if (profileLink.attr('href') !== undefined) {
				return profileLink.attr('href').split('/')[0];
			}
		}

		return '';
	}

	public static getProofStatement(searchText: string) {
		const $ = cheerio.load(searchText);
		const postContent = $('article').find('.commentary');
		let statement = '';

		if (postContent !== undefined) {
			statement = postContent.text();
		}

		return statement;
	}
}
