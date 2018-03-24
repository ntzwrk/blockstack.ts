import { Organization } from './Organization';
import { Profile } from './Profile';
import { Person as PersonJson } from './schemas/Person.json';
import { PersonLegacy as PersonLegacyJson } from './schemas/PersonLegacy.json';
import { getPersonFromLegacyFormat } from './utils/personLegacy';

// TODO: Move these schema.org interfaces in an own file

export interface IImage {
	'@type'?: string;
	name?: string;
	contentUrl?: string;
	[k: string]: any;
}

export interface IWebSite {
	'@type'?: string;
	url?: string;
	[k: string]: any;
}

export interface IAccount {
	'@type'?: string;
	role?: string;
	service?: string;
	identifier?: string;
	proofType?: string;
	proofUrl?: string;
	proofMessage?: string;
	proofSignature?: string;
	[k: string]: any;
}

export interface IPostalAddress {
	'@type'?: string;
	streetAddress?: string;
	addressLocality?: string;
	postalCode?: string;
	addressCountry?: string;
	[k: string]: any;
}

export interface IVerification {
	identifier: string;
	proofUrl: string;
	service: string;
	valid: boolean;
}

export class Person extends Profile implements PersonJson {
	public static fromLegacyFormat(legacyProfileJson: PersonLegacyJson) {
		const profileJson = getPersonFromLegacyFormat(legacyProfileJson);
		return Person.fromJSON(profileJson);
	}

	public static fromJSON(personJson: PersonJson): Person {
		return new Person(personJson['@id']);
	}

	constructor(
		id: string,
		public name?: string,
		public givenName?: string,
		public familyName?: string,
		public description?: string,
		public image?: IImage[],
		public website?: IWebSite[],
		public account?: IAccount[],
		public worksFor?: Organization[],
		public knows?: Person[],
		public address?: IPostalAddress,
		public birthDate?: string,
		public taxID?: string
	) {
		super(id, 'Person');
	}

	public toJSON(): PersonJson {
		return { ...(this as PersonJson) };
	}

	public getName() {
		if (this.name !== undefined) {
			return this.name;
		}

		if (this.givenName !== undefined || this.familyName !== undefined) {
			let name = '';
			if (this.givenName) {
				name = this.givenName;
			}
			if (this.familyName) {
				name += ` ${this.familyName}`;
			}
			return name;
		}

		return undefined;
	}

	public getGivenName() {
		if (this.givenName) {
			return this.givenName;
		} else if (this.name) {
			const nameParts = this.name.split(' ');
			return nameParts.slice(0, -1).join(' ');
		}

		return undefined;
	}

	public getFamilyName() {
		if (this.familyName !== undefined) {
			return this.familyName;
		} else if (this.name !== undefined) {
			const nameParts = this.name.split(' ');
			return nameParts.pop();
		}

		return undefined;
	}

	public getDescription() {
		return this.description;
	}

	public getAvatarUrl() {
		if (this.image === undefined) {
			return undefined;
		}

		return this.image.find(image => image.name === 'avatar');
	}

	public getVerifiedAccounts(verifications: IVerification[]) {
		if (this.account === undefined) {
			return undefined;
		}

		const filteredAccounts: IAccount = [];
		for (const account of this.account) {
			let accountIsValid = false;
			let proofUrl = undefined;

			verifications.map(verification => {
				if (
					verification.valid &&
					verification.service === account.service &&
					verification.identifier === account.identifier &&
					verification.proofUrl === account.proofUrl
				) {
					accountIsValid = true;
					proofUrl = verification.proofUrl;
					return true;
				} else {
					return false;
				}
			});

			if (accountIsValid) {
				account.proofUrl = proofUrl;
				filteredAccounts.push(account);
				return account;
			} else {
				return undefined;
			}
		}
	}

	public getAddress() {
		if (this.address === undefined) {
			return undefined;
		}

		const addressParts = [];

		if (this.address.streetAddress !== undefined) {
			addressParts.push(this.address.streetAddress);
		}
		if (this.address.addressLocality) {
			addressParts.push(this.address.addressLocality);
		}
		if (this.address.postalCode) {
			addressParts.push(this.address.postalCode);
		}
		if (this.address.addressCountry) {
			addressParts.push(this.address.addressCountry);
		}

		if (addressParts !== []) {
			return addressParts.join(', ');
		}

		return undefined;
	}

	public getFormattedBirthDate(): string | undefined {
		if (this.birthDate === undefined) {
			return undefined;
		}

		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];

		const date = new Date(this.birthDate);
		return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
	}

	public getConnections() {
		return this.knows;
	}

	public getOrganizations() {
		return this.worksFor;
	}
}
