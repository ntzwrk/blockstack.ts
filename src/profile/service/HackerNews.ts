import * as cheerio from 'cheerio';

import { IProof, Service } from './Service';

export class HackerNews extends Service {
	public static getBaseUrls() {
		return [
			'https://news.ycombinator.com/user?id=',
			'http://news.ycombinator.com/user?id=',
			'news.ycombinator.com/user?id='
		];
	}

	public static getProofUrl(proof: IProof) {
		const baseUrls = this.getBaseUrls();

		let proofUrl = proof.proof_url.toLowerCase();
		proofUrl = super.prefixScheme(proofUrl);

		for (const baseUrl of baseUrls) {
			if (proofUrl === `${baseUrl}${proof.identifier}`) {
				return proofUrl;
			}
		}
		throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`);
	}

	public static getProofStatement(searchText: string) {
		const $ = cheerio.load(searchText);
		const tables = $('#hnmain')
			.children()
			.find('table');
		let statement = '';

		if (tables.length > 0) {
			tables.each((tableIndex, table) => {
				const rows = $(table).find('tr');

				if (rows.length > 0) {
					rows.each((idx, row) => {
						const heading = $(row)
							.find('td')
							.first()
							.text()
							.trim();

						if (heading === 'about:') {
							statement = $(row)
								.find('td')
								.last()
								.text()
								.trim();
						}
					});
				}
			});
		}

		return statement;
	}
}
