import { Profile } from './Profile';
import { Organization as OrganizationJson } from './schema/Organization.json';

export class Organization extends Profile implements OrganizationJson {
	public static fromJSON(organizationJson: OrganizationJson): Profile {
		return new Organization(organizationJson['@id']);
	}

	constructor(id: string) {
		super(id, 'Organization');
	}

	public toJSON(): OrganizationJson {
		return { ...(this as OrganizationJson) };
	}
}
