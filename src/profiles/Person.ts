import inspector from 'schema-inspector';

import { Profile } from './Profile';
import { extractProfile } from './utils';
import { getPersonFromLegacyFormat } from './utils/personLegacy';
import {
	getName,
	getFamilyName,
	getGivenName,
	getAvatarUrl,
	getDescription,
	getVerifiedAccounts,
	getAddress,
	getBirthDate,
	getConnections,
	getOrganizations
} from './utils/person';

const schemaDefinition = {};

export class Person extends Profile {
	constructor(profile = {}) {
		super(profile);
		this._profile = Object.assign(
			{},
			{
				'@type': 'Person'
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
		return new Person(profile);
	}

	static fromLegacyFormat(legacyProfile) {
		const profile = getPersonFromLegacyFormat(legacyProfile);
		return new Person(profile);
	}

	toJSON() {
		return {
			profile: this.profile(),
			name: this.name(),
			givenName: this.givenName(),
			familyName: this.familyName(),
			description: this.description(),
			avatarUrl: this.avatarUrl(),
			verifiedAccounts: this.verifiedAccounts(),
			address: this.address(),
			birthDate: this.birthDate(),
			connections: this.connections(),
			organizations: this.organizations()
		};
	}

	profile() {
		return Object.assign({}, this._profile);
	}

	name() {
		return getName(this.profile());
	}

	givenName() {
		return getGivenName(this.profile());
	}

	familyName() {
		return getFamilyName(this.profile());
	}

	description() {
		return getDescription(this.profile());
	}

	avatarUrl() {
		return getAvatarUrl(this.profile());
	}

	verifiedAccounts(verifications) {
		return getVerifiedAccounts(this.profile(), verifications);
	}

	address() {
		return getAddress(this.profile());
	}

	birthDate() {
		return getBirthDate(this.profile());
	}

	connections() {
		return getConnections(this.profile());
	}

	organizations() {
		return getOrganizations(this.profile());
	}
}
