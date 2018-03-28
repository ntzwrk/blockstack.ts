import * as cheerio from 'cheerio';

import { DebugType, Logger } from '../../debug';
import { InvalidProofUrlError } from '../../error';
import { IProof, Service } from './Service';

export class Instagram extends Service {
	public static getBaseUrls() {
		return ['https://www.instagram.com/', 'https://instagram.com/'];
	}

	public static getProofUrl(proof: IProof) {
		const baseUrls = this.getBaseUrls();
		const normalizedProofUrl = this.normalizeInstagramUrl(proof);

		for (const baseUrl of baseUrls) {
			if (normalizedProofUrl.startsWith(`${baseUrl}`)) {
				return normalizedProofUrl;
			}
		}
		throw new InvalidProofUrlError(proof.proof_url, proof.service);
	}

	public static normalizeInstagramUrl(proof: IProof) {
		let proofUrl = proof.proof_url;
		proofUrl = super.prefixScheme(proofUrl);

		if (proofUrl.startsWith('https://instagram.com')) {
			const tokens = proofUrl.split('https://instagram.com');
			proofUrl = `https://www.instagram.com${tokens[1]}`;
		}
		return proofUrl;
	}

	public static shouldValidateIdentityInBody() {
		return true;
	}

	public static getProofIdentity(searchText: string) {
		const $ = cheerio.load(searchText);
		const description = $('meta[property="og:description"]').attr('content');

		// if description exists...
		if (description !== undefined) {
			// ...split description on each ':'
			const descriptionParts = description.split(':');

			// select the first part and match the @username
			const usernameCandidateMatches = descriptionParts[0].match(/\(([^)]+)\)/);

			// if there's a match...
			if (usernameCandidateMatches !== null) {
				// ...take it, trim first char (@) and return the rest (username)
				return usernameCandidateMatches[1].substr(1);
			} else {
				Logger.log(DebugType.warn, 'Could not match a username', descriptionParts[0]);
			}
		} else {
			Logger.log(DebugType.warn, 'Could not find the Instagram description', searchText);
		}

		return '';
	}

	public static getProofStatement(searchText: string) {
		const $ = cheerio.load(searchText);
		const statement = $('meta[property="og:description"]').attr('content');

		if (statement !== undefined && statement.split(':').length > 1) {
			return statement
				.split(':')[1]
				.trim()
				.replace('“', '')
				.replace('”', '');
		} else {
			return '';
		}
	}
}
