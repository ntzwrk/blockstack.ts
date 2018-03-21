import * as cheerio from 'cheerio';

import { Service } from './service';

export class Twitter extends Service {
	public static getBaseUrls() {
		return ['https://twitter.com/', 'http://twitter.com/', 'twitter.com/'];
	}

	public static getProofStatement(searchText: string) {
		const $ = cheerio.load(searchText);
		const statement = $('meta[property="og:description"]').attr('content');
		if (statement !== undefined) {
			return statement
				.trim()
				.replace('“', '')
				.replace('”', '');
		} else {
			return '';
		}
	}
}
