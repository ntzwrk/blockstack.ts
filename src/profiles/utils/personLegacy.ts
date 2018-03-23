import { IAccount, IImage } from '../Person';
import { Person as PersonJson } from '../schemas/Person.json';
import { PersonLegacy as PersonLegacyJson } from '../schemas/PersonLegacy.json';

function formatAccount(
	serviceName: string,
	data: {
		username?: string | undefined;
		proof?:
			| {
					url?: string | undefined;
			  }
			| undefined;
	}
) {
	let proofUrl;
	if (data.proof !== undefined && data.proof.url !== undefined) {
		proofUrl = data.proof.url;
	}
	return {
		'@type': 'Account',
		service: serviceName,
		identifier: data.username,
		proofType: 'http',
		proofUrl: proofUrl
	};
}

export function getPersonFromLegacyFormat(personLegacyJson: PersonLegacyJson): PersonJson {
	const personJson: PersonJson = {
		'@context': 'http://schema.org/',
		'@type': 'Person',
		'@id': '' // TODO: What should @id be? Name?
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

	const images: IImage[] = [];
	if (personLegacyJson.avatar !== undefined && personLegacyJson.avatar.url !== undefined) {
		images.push({
			'@type': 'ImageObject',
			name: 'avatar',
			contentUrl: personLegacyJson.avatar.url
		});
	}
	if (personLegacyJson.cover !== undefined && personLegacyJson.cover.url !== undefined) {
		images.push({
			'@type': 'ImageObject',
			name: 'cover',
			contentUrl: personLegacyJson.cover.url
		});
	}
	if (images != []) {
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

	const accounts: IAccount[] = [];
	if (personLegacyJson.bitcoin !== undefined && personLegacyJson.bitcoin.address !== undefined) {
		accounts.push({
			'@type': 'Account',
			role: 'payment',
			service: 'bitcoin',
			identifier: personLegacyJson.bitcoin.address
		});
	}
	if (personLegacyJson.twitter !== undefined && personLegacyJson.twitter.username !== undefined) {
		accounts.push(formatAccount('twitter', personLegacyJson.twitter));
	}
	if (personLegacyJson.facebook !== undefined && personLegacyJson.facebook.username !== undefined) {
		accounts.push(formatAccount('facebook', personLegacyJson.facebook));
	}
	if (personLegacyJson.github !== undefined && personLegacyJson.github.username !== undefined) {
		accounts.push(formatAccount('github', personLegacyJson.github));
	}
	if (personLegacyJson.auth !== undefined) {
		if (personLegacyJson.auth.length > 0) {
			if (personLegacyJson.auth[0].publicKeychain !== undefined) {
				accounts.push({
					'@type': 'Account',
					role: 'key',
					service: 'bip32',
					identifier: personLegacyJson.auth[0].publicKeychain
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
			role: 'key',
			service: 'pgp',
			identifier: personLegacyJson.pgp.fingerprint,
			contentUrl: personLegacyJson.pgp.url
		});
	}

	personJson.account = accounts;

	return personJson;
}
