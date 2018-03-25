import { Account } from '../schemas/components/Account.json';
import { Image } from '../schemas/components/Image.json';
import { Person as PersonJson } from '../schemas/Person.json';
import { PersonLegacy as PersonLegacyJson } from '../schemas/PersonLegacy.json';

function formatAccount(
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
		proofUrl: proofUrl,
		service: serviceName
	};
}

export function getPersonFromLegacyFormat(personLegacyJson: PersonLegacyJson): PersonJson {
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

	const images: Image[] = [];
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

	const accounts: Account[] = [];
	if (personLegacyJson.bitcoin !== undefined && personLegacyJson.bitcoin.address !== undefined) {
		accounts.push({
			'@type': 'Account',
			identifier: personLegacyJson.bitcoin.address,
			role: 'payment',
			service: 'bitcoin'
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
