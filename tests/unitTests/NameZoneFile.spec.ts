import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import { createUnsecuredToken, TokenSigner, JWT } from 'jsontokens';
import * as nock from 'nock';
import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { correct, incorrect } from '../fun';

import { DidNotSatisfyJsonSchemaError, InvalidParameterError, InvalidProfileTokenError } from '../../src/error';
import { signProfileToken } from '../../src/profile/jwt';
import { Person } from '../../src/profile/Person';
import { PersonJson } from '../../src/profile/schema/Person.json';
import { ProfileJson } from '../../src/profile/schema/Profile.json';
import { NameZoneFile } from '../../src/NameZoneFile';
import { Profile } from '../../src/profile/Profile';

chai.use(chaiAsPromised);

// TODO: Add this.slow() to all tests
// TODO: Rename "token file" consistently to "profile token"
// TODO: Combine all re-used variables on a higher layer

describe('NameZoneFile', () => {
	afterEach(() => {
		if (!nock.isDone()) {
			console.warn(
				'\x1b[1m\x1b[2m%s\x1b[0m\x1b[0m',
				"        nock hasn't fully consumed all mocked responses, clearing them now"
			);
			nock.cleanAll();
		}
	});

	describe('fromJSON', () => {
		it(`creates ${correct()} zone file objects from JSON`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileJson: JsonZoneFile = {
				$origin: name,
				$ttl: 3600,
				uri: [
					{
						name: '_http._tcp',
						target: tokenFileUrl,
						priority: 10,
						weight: 1
					}
				]
			};

			const zoneFile = new NameZoneFile(name, tokenFileUrl);

			chai.expect(NameZoneFile.fromJSON(zoneFileJson)).to.deep.equal(zoneFile);
		});

		it(`fails on ${incorrect()} inputs`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileJsonWithoutOrigin: JsonZoneFile = {
				$ttl: 3600,
				uri: [
					{
						name: '_http._tcp',
						target: tokenFileUrl,
						priority: 10,
						weight: 1
					}
				]
			};
			const zoneFileJsonWithoutUri: JsonZoneFile = {
				$origin: name,
				$ttl: 3600
			};
			const zoneFileJsonWithEmptyUri: JsonZoneFile = {
				$origin: name,
				$ttl: 3600,
				uri: []
			};

			chai.expect(() => NameZoneFile.fromJSON({})).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromJSON(zoneFileJsonWithoutOrigin)).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromJSON(zoneFileJsonWithoutUri)).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromJSON(zoneFileJsonWithEmptyUri)).to.throw(InvalidParameterError);
		});
	});

	describe('fromString', () => {
		it(`creates ${correct()} zone file objects from strings`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileString = `$ORIGIN ${name}\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"${tokenFileUrl}"\n\n`;

			const zoneFile = new NameZoneFile(name, tokenFileUrl);

			chai.expect(NameZoneFile.fromString(zoneFileString)).to.deep.equal(zoneFile);
		});

		it(`fails on ${incorrect()} strings`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileStringWithoutOrigin = `$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"${tokenFileUrl}"\n\n`;
			const zoneFileStringWithoutUri = `$ORIGIN ${name}\n$TTL 3600\n\n`;
			const zoneFileStringWithEmptyUri = `$ORIGIN ${name}\n$TTL 3600\n\n`;

			chai.expect(() => NameZoneFile.fromString('')).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromString(zoneFileStringWithoutOrigin)).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromString(zoneFileStringWithoutUri)).to.throw(InvalidParameterError);
			chai.expect(() => NameZoneFile.fromString(zoneFileStringWithEmptyUri)).to.throw(InvalidParameterError);
		});
	});

	describe('lookupByName', () => {
		it(`resolves names to ${correct()} zone file objects`, async function() {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFile = new NameZoneFile(name, tokenFileUrl);

			nock('https://core.blockstack.org')
				.get(`/v1/names/${name}/zonefile`)
				.reply(200, { zonefile: zoneFile.toString() });

			chai.expect(await NameZoneFile.lookupByName(name)).to.deep.equal(zoneFile);
		});

		it(`fails on ${incorrect()} names`, async function() {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFile = new NameZoneFile(name, tokenFileUrl);
			nock('https://core.blockstack.org')
				.get(`/v1/names/${name}/zonefile`)
				.reply(200, {});
			nock('https://core.blockstack.org')
				.get(`/v1/names/${name}/zonefile`)
				.reply(200, { zonefile: '' });
			nock('https://core.blockstack.org')
				.get(`/v1/names/${name}/zonefile`)
				.reply(200, { zonefile: 'some gibberish' + zoneFile.toString() });

			chai.expect(NameZoneFile.lookupByName(name)).to.eventually.be.rejectedWith(Error); // TODO: `blockstack-core-client.ts` should throw an error this
			chai.expect(NameZoneFile.lookupByName(name)).to.eventually.be.rejectedWith(InvalidParameterError);
			chai.expect(NameZoneFile.lookupByName(name)).to.eventually.be.rejectedWith(InvalidParameterError);
		});
	});

	describe('constructor', () => {
		it(`creates ${correct()} zone file objects`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';
			const tokenFileUrlWithoutProtocol = 'gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFile = new NameZoneFile(name, tokenFileUrl);
			const zoneFileWithoutProtocol = new NameZoneFile(name, tokenFileUrlWithoutProtocol);

			const zoneFileJson: JsonZoneFile = {
				$origin: name,
				$ttl: 3600,
				uri: [
					{
						name: '_http._tcp',
						target: tokenFileUrl,
						priority: 10,
						weight: 1
					}
				]
			};
			const zoneFileFromJson = NameZoneFile.fromJSON(zoneFileJson);

			chai.expect(zoneFile).to.deep.equal(zoneFileWithoutProtocol);
			chai.expect(zoneFile).to.deep.equal(zoneFileFromJson);
		});

		it(`fails on ${incorrect()} inputs`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';
			const invalidName = 'some-name-without-namespace';
			const invalidTokenFileUrl = 'this-is-an-invalid-url';

			chai.expect(() => new NameZoneFile(invalidName, tokenFileUrl)).to.throw(InvalidParameterError);
			chai.expect(() => new NameZoneFile(name, invalidTokenFileUrl)).to.throw(InvalidParameterError);
			chai.expect(() => new NameZoneFile(invalidName, invalidTokenFileUrl)).to.throw(InvalidParameterError);
		});
	});

	describe('toJSON', () => {
		it(`creates ${correct()} JSON objects from zone file objects`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileJson: JsonZoneFile = {
				$origin: name,
				$ttl: 3600,
				uri: [
					{
						name: '_http._tcp',
						target: tokenFileUrl,
						priority: 10,
						weight: 1
					}
				]
			};

			const zoneFile = new NameZoneFile(name, tokenFileUrl);

			chai.expect(zoneFile.toJSON()).to.deep.equal(zoneFileJson);
		});
	});

	describe('toString', () => {
		it(`creates ${correct()} zone file strings from zone file objects`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const zoneFileString = `$ORIGIN ${name}\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"${tokenFileUrl}"\n\n`;

			const zoneFile = new NameZoneFile(name, tokenFileUrl);

			chai.expect(zoneFile.toString()).to.equal(zoneFileString);
		});
	});
});
