import { extractProfile } from './utils';
import inspector from 'schema-inspector';
import { Profile } from './Profile';

const schemaDefinition = {};

export class CreativeWork extends Profile {
	constructor(profile = {}) {
		super(profile);
		this._profile = Object.assign(
			{},
			{
				'@type': 'CreativeWork'
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
		return new CreativeWork(profile);
	}
}
