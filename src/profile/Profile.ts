import { BlockstackCoreClient } from 'blockstack-core-client.ts';

import { config } from '../config';
import { extractProfile, signProfileToken } from './jwt';
import { IProof, validateProofs } from './proof';
import { ProfileJson } from './schema/Profile.json';
import { NameZoneFile } from '../NameZoneFile';
import { ProfileTokenJson } from './schema/ProfileToken.json';
import { InvalidProfileTokenError } from '../error';

export class Profile implements ProfileJson {
	public static fromJSON(profileJson: ProfileJson): Profile {
		return new Profile(profileJson['@id'], profileJson['@type']);
	}

	public static fromToken(token: string, publicKeyOrAddress?: string): Profile {
		const profile: ProfileJson = extractProfile(token, publicKeyOrAddress);
		return Profile.fromJSON(profile);
	}

	/**
	 * Creates a [[Profile]] from a given zone file, verified against the address looked up with the given [`BlockstackCoreClient`](https://github.com/ntzwrk/blockstack-core-client.ts)
	 *
	 * @param zoneFile The zone file to create the [[Profile]] from
	 * @param coreClient The [`BlockstackCoreClient`](https://github.com/ntzwrk/blockstack-core-client.ts) to use, defaults to the one set in ../config
	 * @returns A promise that resolves to the [[Profile]] on success and otherwise rejects with an error (see [[fetchProfileToken]] for these errors)
	 */
	public static async fromZoneFile(zoneFile: NameZoneFile, coreClient?: BlockstackCoreClient): Promise<Profile>;

	/**
	 * Creates a [[Profile]] from a given zone file, verified against the provided public key or address
	 *
	 * @param zoneFile The zone file to create the [[Profile]] from
	 * @param publicKeyOrAddress The public key or address who owns this name / zone file
	 * @returns A promise that resolves to the [[Profile]] on success and otherwise rejects with an error (see [[fetchProfileToken]] for these errors)
	 */
	public static async fromZoneFile(zoneFile: NameZoneFile, publicKeyOrAddress: string): Promise<Profile>;

	public static async fromZoneFile(zoneFile: NameZoneFile, parameter: BlockstackCoreClient | string): Promise<Profile> {
		let publicKeyOrAddress: string;

		if (typeof parameter === 'string') {
			publicKeyOrAddress = parameter;
		} else {
			let coreClient: BlockstackCoreClient;

			if (parameter instanceof BlockstackCoreClient) {
				coreClient = parameter;
			} else {
				coreClient = config.coreClient;
			}

			const response = await coreClient.getNameInfo(this.name);
			publicKeyOrAddress = response.address;
		}

		const profileToken = await Profile.fetchProfileToken(zoneFile);
		return Profile.fromToken(profileToken, publicKeyOrAddress);
	}

	/**
	 * Fetches the profile token from a given zone file's profile token URL
	 *
	 * @param zoneFile The zone file to use
	 * @returns A promise that resolves to the profile token on success and otherwise rejects with:
	 *          1) an [[InvalidProfileTokenError]] when the profile token has no elements;
	 *          2) an [[InvalidProfileTokenError]] when the first element of the profile token has no `token` attribute.
	 *
	 * Please note that this function uses `fetch` and therefore can also reject with errors from there.
	 */
	private static async fetchProfileToken(zoneFile: NameZoneFile): Promise<string> {
		// TODO: This should be able to fallback on the next URI entry

		const response = await (await fetch(zoneFile.profileTokenUrl)).text();

		let profileTokenJson: ProfileTokenJson;
		try {
			profileTokenJson = JSON.parse(response) as ProfileTokenJson;
		} catch (error) {
			throw new InvalidProfileTokenError(response);
		}

		if (profileTokenJson.length === 0) {
			throw new InvalidProfileTokenError(profileTokenJson, 'The profile token has no elements');
		}
		if (profileTokenJson[0].token === undefined) {
			throw new InvalidProfileTokenError(
				profileTokenJson,
				'The first element of the profile token has no `token` attribute'
			);
		}

		return profileTokenJson[0].token as string;
	}

	public readonly '@context': string = 'http://schema.org';
	public readonly '@type': string;
	public readonly '@id': string;

	constructor(id: string, type: string) {
		this['@id'] = id;
		this['@type'] = type;
	}

	public toJSON(): ProfileJson {
		return { ...(this as ProfileJson) };
	}

	public toToken(privateKey: string): string {
		return signProfileToken(this.toJSON(), privateKey);
	}

	public validateProofs(domainName: string): Promise<IProof[]> {
		return validateProofs(this.toJSON(), domainName);
	}
}
