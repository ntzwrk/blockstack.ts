import inspector from 'schema-inspector';

import { extractProfile } from './utils';
import { Profile } from './Profile';

const schemaDefinition = {};

export class Organization extends Profile {
	constructor(profile = {}) {
		super(profile);
		this._profile = Object.assign(
			{},
			{
				'@type': 'Organization'
			},
			this._profile
		);
	}

	static validateSchema(profile, strict = false) {
		schemaDefinition.strict = strict;
		return inspector.validate(schemaDefinition, profile);
	}

	static fromToken(token: string, publicKeyOrAddress?: string) {
		const profile = extractProfile(token, publicKeyOrAddress);
		return new Organization(profile);
	}
}
