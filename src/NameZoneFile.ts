import { BlockstackCoreClient } from 'blockstack-core-client.ts';
import { URL } from 'url';
import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { config } from './config';
import { InvalidParameterError } from './error';

/**
 * Class for a zone file that is used to store (routing) information about a Blockstack name
 * (currently only able to store profile token URLs)
 */
export class NameZoneFile {
	// @TODO: fromJSON() and fromString() don't necessarily pick up all information of the zone file
	//        (everything other than $origin, $ttl and the first URI entry gets dropped)
	//        Idea: Introduce an attribute that holds the original data the zone file is based on

	/**
	 * Creates a new [[NameZoneFile]] from JSON
	 *
	 * @param json The JSON to create from
	 * @throws [[InvalidParameterError]] when the given JSON has no `$origin` attribute
	 * @throws [[InvalidParameterError]] when the given JSON has no `uri` attribute
	 * @throws [[InvalidParameterError]] when the given JSON has an empty `uri` attribute
	 */
	public static fromJSON(json: JsonZoneFile): NameZoneFile {
		if (json.$origin === undefined) {
			throw new InvalidParameterError('json', 'Attribute `$origin` does not exist', json);
		}

		if (json.uri === undefined) {
			throw new InvalidParameterError('json', 'Attribute `uri` does not exist', json);
		}

		if (json.uri.length === 0) {
			throw new InvalidParameterError('json', 'Attribute `uri` has no elements', json);
		}

		return new NameZoneFile(json.$origin, json.uri[0].target);
	}

	/**
	 * Creates a new [[NameZoneFile]] from an RFC1035-compliant zone file
	 *
	 * @param str The string to create from (should be RFC1035-compliant)
	 */
	public static fromString(str: string): NameZoneFile {
		return NameZoneFile.fromJSON(parseZoneFile(str));
	}

	/**
	 * Looks up the current zone file for a given Blockstack name (please note that this method blindly trusts the connected Blockstack Core node, so make sure it's a trusted one)
	 *
	 * @param name The Blockstack name to lookup the zone file for
	 * @param coreClient The [`BlockstackCoreClient`](https://github.com/ntzwrk/blockstack-core-client.ts) to use, defaults to the one set in ./config
	 * @returns A promise that resolves to the name's zone file on success and otherwise rejects with an [[Error]] when the profile token has no elements
	 *
	 * Please note that this function uses `BlockstackCoreClient.getZoneFile` and [[fromString]], and therefore can also reject with errors from there.
	 */
	public static async lookupByName(
		name: string,
		coreClient: BlockstackCoreClient = config.coreClient
	): Promise<NameZoneFile> {
		const response = await coreClient.getZoneFile(name);

		// TODO: `blockstack-core-client.ts` should handle this (throw an error)
		//       Needs proper error responses from Blockstack Core first
		if (response.zonefile === undefined) {
			throw new Error('Could not find a zone file in response');
		}

		return NameZoneFile.fromString(response.zonefile);
	}

	/**
	 * The Blockstack name this zone file was created for
	 */
	public readonly name: string;

	/**
	 * The profile token URL this zone file was created with
	 */
	public readonly profileTokenUrl: string;

	/**
	 * Creates a new [[NameZoneFile]] from a Blockstack name and a profile token URL
	 *
	 * @param name The Blockstack name to create this zone file for (will be the zone file's `$origin`)
	 * @param profileTokenUrl The profile token URL to create this zone file with (will be the `target` of a `uri` element)
	 * @throws [[InvalidParameterError]] when the given name seems to be invalid (does not include a ".")
	 * @throws [[InvalidParameterError]] when the given token file URL is invalid
	 */
	constructor(name: string, profileTokenUrl: string) {
		// TODO: This should be able to take multiple profile token URLs

		if (!name.includes('.')) {
			throw new InvalidParameterError(
				'name',
				'The given name is no valid Blockstack name (does not include a ".")',
				name
			);
		}

		/*
		 * This small check is for zone files that have a profile token url without scheme.
		 * There was a small time period where `blockstack.js` created these zone files, so
		 * this check might be necessary until they are all revised.
		 * It probably doesn't work with checking for '://', since it's maybe allowed to use
		 * it in GET parameters(?).
		 */
		if (!profileTokenUrl.includes('://')) {
			profileTokenUrl = `https://${profileTokenUrl}`;
		}

		try {
			const url = new URL(profileTokenUrl);
			if (!url.hostname.includes('.')) {
				throw new Error();
			}
		} catch (error) {
			throw new InvalidParameterError(
				'profileTokenUrl',
				'The given profile token URL is no valid URL (says the `url` package)',
				profileTokenUrl
			);
		}

		this.name = name;
		this.profileTokenUrl = profileTokenUrl;
	}

	/**
	 * Returns a JSON object representing the zone file
	 */
	public toJSON(): JsonZoneFile {
		return {
			$origin: this.name,
			$ttl: 3600,
			uri: [
				{
					name: '_http._tcp',
					priority: 10,
					target: this.profileTokenUrl,
					weight: 1
				}
			]
		};
	}

	/**
	 * Returns a RFC1035-compliant zone file
	 */
	public toString(): string {
		const zoneFileTemplate = '{$origin}\n{$ttl}\n{uri}\n';
		return makeZoneFile(this.toJSON(), zoneFileTemplate);
	}
}
