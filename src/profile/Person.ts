import { Profile } from './Profile';
import { AccountJson } from './schema/components/Account.json';
import { BasicJson } from './schema/components/Basic.json';
import { ImageJson } from './schema/components/Image.json';
import { PostalAddressJson } from './schema/components/PostalAddress.json';
import { WebSiteJson } from './schema/components/WebSite.json';
import { PersonJson } from './schema/Person.json';
import { PersonLegacyJson } from './schema/PersonLegacy.json';

export interface IVerification {
	identifier: string;
	proofUrl: string;
	service: string;
	valid: boolean;
}

export class Person extends Profile implements PersonJson {
	public static fromLegacyFormat(legacyProfileJson: PersonLegacyJson) {
		const profileJson = Person.getPersonFromLegacyFormat(legacyProfileJson);
		return Person.fromJSON(profileJson);
	}

	public static fromJSON(personJson: PersonJson): Person {
		return new Person(personJson['@id']);
	}

	private static formatAccount(
		serviceName: string,
		data: {
			username?: string | undefined;
			proof?: { url?: string | undefined } | undefined;
		}
	) {
		let proofUrl;
		if (data.proof !== undefined && data.proof.url !== undefined) {
			proofUrl = data.proof.url;
		}
		return {
			'@type': 'Account',
			identifier: data.username,
			proofType: 'http',
			proofUrl,
			service: serviceName
		};
	}

	private static getPersonFromLegacyFormat(personLegacyJson: PersonLegacyJson): PersonJson {
		const personJson: PersonJson = {
			'@context': 'http://schema.org/',
			'@id': '', // TODO: What should @id be? Name?
			'@type': 'Person'
		};

		if (personLegacyJson.name !== undefined) {
			personJson.name = personLegacyJson.name.formatted;
		}

		personJson.description = personLegacyJson.bio;

		if (personLegacyJson.location !== undefined) {
			personJson.address = {
				'@type': 'PostalAddress',
				addressLocality: personLegacyJson.location.formatted
			};
		}

		const images: ImageJson[] = [];
		if (personLegacyJson.avatar !== undefined && personLegacyJson.avatar.url !== undefined) {
			images.push({
				'@type': 'ImageObject',
				contentUrl: personLegacyJson.avatar.url,
				name: 'avatar'
			});
		}
		if (personLegacyJson.cover !== undefined && personLegacyJson.cover.url !== undefined) {
			images.push({
				'@type': 'ImageObject',
				contentUrl: personLegacyJson.cover.url,
				name: 'cover'
			});
		}
		if (images !== []) {
			personJson.image = images;
		}

		if (personLegacyJson.website !== undefined) {
			personJson.website = [
				{
					'@type': 'WebSite',
					url: personLegacyJson.website
				}
			];
		}

		const accounts: AccountJson[] = [];
		if (personLegacyJson.bitcoin !== undefined && personLegacyJson.bitcoin.address !== undefined) {
			accounts.push({
				'@type': 'Account',
				identifier: personLegacyJson.bitcoin.address,
				role: 'payment',
				service: 'bitcoin'
			});
		}
		if (personLegacyJson.twitter !== undefined && personLegacyJson.twitter.username !== undefined) {
			accounts.push(Person.formatAccount('twitter', personLegacyJson.twitter));
		}
		if (personLegacyJson.facebook !== undefined && personLegacyJson.facebook.username !== undefined) {
			accounts.push(Person.formatAccount('facebook', personLegacyJson.facebook));
		}
		if (personLegacyJson.github !== undefined && personLegacyJson.github.username !== undefined) {
			accounts.push(Person.formatAccount('github', personLegacyJson.github));
		}
		if (personLegacyJson.auth !== undefined) {
			if (personLegacyJson.auth.length > 0) {
				if (personLegacyJson.auth[0].publicKeychain !== undefined) {
					accounts.push({
						'@type': 'Account',
						identifier: personLegacyJson.auth[0].publicKeychain,
						role: 'key',
						service: 'bip32'
					});
				}
			}
		}
		if (
			personLegacyJson.pgp !== undefined &&
			personLegacyJson.pgp.fingerprint !== undefined &&
			personLegacyJson.pgp.url !== undefined
		) {
			accounts.push({
				'@type': 'Account',
				contentUrl: personLegacyJson.pgp.url,
				identifier: personLegacyJson.pgp.fingerprint,
				role: 'key',
				service: 'pgp'
			});
		}

		personJson.account = accounts;

		return personJson;
	}

	constructor(
		id: string,
		public name?: string,
		public givenName?: string,
		public familyName?: string,
		public description?: string,
		public image?: ImageJson[],
		public website?: WebSiteJson[],
		public account?: AccountJson[],
		public worksFor?: BasicJson[],
		public knows?: BasicJson[],
		public address?: PostalAddressJson,
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

		const avatarImage = this.image.find(image => image.name === 'avatar');
		if(avatarImage !== undefined) {
			return avatarImage.contentUrl;
		}
	}

	public getVerifiedAccounts(verifications: IVerification[]) {
		if (this.account === undefined) {
			return undefined;
		}

		const filteredAccounts: AccountJson = [];
		for (const account of this.account) {
			let accountIsValid = false;
			let proofUrl;

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
