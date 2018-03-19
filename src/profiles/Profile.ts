import { JWT } from 'jsontokens';
import inspector from 'schema-inspector';

import { signProfileToken, extractProfile } from './utils';
import { validateProofs } from './utils';
import { makeProfileZoneFile } from './utils';

const schemaDefinition = {};

export class Profile {
	constructor(profile = {}) {
		this._profile = Object.assign(
			{},
			{
				'@context': 'http://schema.org/'
			},
			profile
		);
	}

	toJSON() {
		return Object.assign({}, this._profile);
	}

	toToken(privateKey): JWT {
		return signProfileToken(this.toJSON(), privateKey);
	}

	static validateSchema(profile, strict = false) {
		schemaDefinition.strict = strict;
		return inspector.validate(schemaDefinition, profile);
	}

	static fromToken(token, publicKeyOrAddress = null) {
		const profile = extractProfile(token, publicKeyOrAddress);
		return new Profile(profile);
	}

	static makeZoneFile(domainName, tokenFileURL) {
		return makeProfileZoneFile(domainName, tokenFileURL);
	}

	static validateProofs(domainName) {
		return validateProofs(this.toJSON(), domainName);
	}
}
