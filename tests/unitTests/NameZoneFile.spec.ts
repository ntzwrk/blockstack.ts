import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import { createUnsecuredToken, TokenSigner, JWT } from 'jsontokens';
import * as nock from 'nock';
import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { correct, incorrect } from '../fun';

import { DidNotSatisfyJsonSchemaError, InvalidParameterError, InvalidProfileTokenError } from '../../src/error';
import { signProfileToken } from '../../src/profile/jwt';
import { PersonJson } from '../../src/profile/schema/Person.json';
import { ProfileJson } from '../../src/profile/schema/Profile.json';
import {
	getTokenFileUrl,
	makeProfileZoneFile,
	resolveZoneFileToPerson,
	resolveZoneFileToProfile
} from '../../src/ProfileZoneFile';

chai.use(chaiAsPromised);

describe('zoneFile.ts', () => {
	describe('getTokenFileUrl', () => {
		it(`delivers ${correct()} token file URLs`, () => {
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const jsonZoneFile: JsonZoneFile = {
				uri: [
					{
						name: 'some-name.id',
						target: tokenFileUrl,
						priority: 0,
						weight: 0
					}
				]
			};
			const jsonZoneFileWithoutProtocol: JsonZoneFile = {
				uri: [
					{
						name: 'some irrelevant name',
						target: 'example.org',
						priority: 0,
						weight: 0
					}
				]
			};

			chai.expect(getTokenFileUrl(jsonZoneFile)).to.equal(tokenFileUrl);
			chai.expect(getTokenFileUrl(jsonZoneFileWithoutProtocol)).to.equal('https://example.org');
		});

		it(`fails on ${incorrect()} inputs`, () => {
			const jsonZoneFileEmpty: JsonZoneFile = {};
			const jsonZoneFileWithoutUri: JsonZoneFile = {
				txt: [
					{
						name: 'record',
						txt: 'some text'
					}
				]
			};
			const jsonZoneFileWithEmptyUri: JsonZoneFile = {
				uri: []
			};

			chai.expect(() => getTokenFileUrl(jsonZoneFileEmpty)).to.throw(InvalidParameterError);
			chai.expect(() => getTokenFileUrl(jsonZoneFileWithoutUri)).to.throw(InvalidParameterError);
			chai.expect(() => getTokenFileUrl(jsonZoneFileWithEmptyUri)).to.throw(InvalidParameterError);
		});
	});

	describe('makeProfileZoneFile', () => {
		it(`generates ${correct()} zone files`, () => {
			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const jsonZoneFile: JsonZoneFile = {
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
			const zoneFile = makeZoneFile(jsonZoneFile, '{$origin}\n{$ttl}\n{uri}\n');
			const staticZoneFile =
				'$ORIGIN some-name.id\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json"\n\n';

			chai.expect(makeProfileZoneFile(name, tokenFileUrl)).to.equal(zoneFile);
			chai.expect(makeProfileZoneFile(name, tokenFileUrl)).to.equal(staticZoneFile);
		});

		it(`fails on ${incorrect()} inputs`, () => {
			chai.expect(() => makeProfileZoneFile('some-name.id', '')).to.throw(InvalidParameterError);
		});
	});

	describe('resolveZoneFileToPerson', () => {
		it(`makes ${correct()} persons`, async function() {
			// TODO: Add tests for legacy zone files
			// TODO: Add tests for valid profiles which token is expired

			this.slow(300);

			const algorithm = 'ES256K';
			const publicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479';
			const privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f';
			const tokenSigner = new TokenSigner(algorithm, privateKey);

			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const personJson: PersonJson = {
				'@context': 'http://schema.org',
				'@type': 'Person',
				'@id': name,
				name: 'John Doe'
			};
			const signedToken = signProfileToken(personJson, privateKey);

			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/0/profile.json')
				.reply(200, `[{ "token": "${signedToken}" }]`);

			const zoneFile = makeProfileZoneFile(name, tokenFileUrl);

			chai.expect(await resolveZoneFileToPerson(zoneFile, publicKey)).to.deep.equal(personJson);
		});

		it(`fails on ${incorrect()} inputs`, async function() {
			this.slow(200);

			const algorithm = 'ES256K';
			const publicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479';
			const privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f';
			const tokenSigner = new TokenSigner(algorithm, privateKey);

			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';
			const tokenFileUrlForInvalidTokenFile =
				'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/1/profile.json';
			const tokenFileUrlForEmptyToken = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/2/profile.json';
			const tokenFileUrlForIncorrectToken =
				'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/3/profile.json';
			const tokenFileUrlForUnsignedToken = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/4/profile.json';

			const personJson: PersonJson = {
				'@context': 'http://schema.org',
				'@type': 'Person',
				'@id': name,
				name: 'John Doe'
			};
			const correctlySignedToken = signProfileToken(personJson, privateKey);
			const incorrectToken = signProfileToken({ ...personJson, ...{ '@type': undefined } }, privateKey);
			const unsignedToken = createUnsecuredToken(personJson);

			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/0/profile.json')
				.reply(200, `[{ "token": "${correctlySignedToken}" }]`);
			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/1/profile.json')
				.reply(200, '');
			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/2/profile.json')
				.reply(200, `[{ "token": "" }]`);
			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/3/profile.json')
				.reply(200, `[{ "token": "${incorrectToken}" }]`);
			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/4/profile.json')
				.reply(200, `[{ "token": "${unsignedToken}" }]`);

			const zoneFile = makeProfileZoneFile(name, tokenFileUrl);
			const zoneFileWithInvalidTokenFile = makeProfileZoneFile(name, tokenFileUrlForInvalidTokenFile);
			const zoneFileWithEmptyToken = makeProfileZoneFile(name, tokenFileUrlForEmptyToken);
			const zoneFileWithIncorrectToken = makeProfileZoneFile(name, tokenFileUrlForIncorrectToken);
			const zoneFileWithUnsignedToken = makeProfileZoneFile(name, tokenFileUrlForUnsignedToken);

			// TODO: Revisit these when the other functions throw better errors
			chai.expect(resolveZoneFileToPerson('', '')).to.eventually.be.rejectedWith(DidNotSatisfyJsonSchemaError);
			chai
				.expect(resolveZoneFileToPerson(zoneFile, 'some wrong key'))
				.to.eventually.be.rejectedWith(InvalidProfileTokenError);
			chai
				.expect(resolveZoneFileToPerson(zoneFileWithInvalidTokenFile, publicKey))
				.to.eventually.be.rejectedWith(InvalidProfileTokenError);
			// chai.expect(resolveZoneFileToPerson(zoneFileWithEmptyToken, publicKey)).to.eventually.be.rejectedWith(InvalidProfileTokenError);
			// chai.expect(resolveZoneFileToPerson(zoneFileWithIncorrectToken, publicKey)).to.eventually.be.rejectedWith(InvalidProfileTokenError);
			chai
				.expect(resolveZoneFileToPerson(zoneFileWithUnsignedToken, publicKey))
				.to.eventually.be.rejectedWith(InvalidProfileTokenError);
		});
	});

	describe('resolveZoneFileToProfile', () => {
		it(`makes ${correct()} profiles`, async function() {
			// TODO: Add tests for legacy zone files
			// TODO: Add tests for valid profiles which token is expired

			this.slow(300);

			const algorithm = 'ES256K';
			const publicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479';
			const privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f';
			const tokenSigner = new TokenSigner(algorithm, privateKey);

			const name = 'some-name.id';
			const tokenFileUrl = 'https://gaia.blockstack.org/hub/1111111111111111111114oLvT2/0/profile.json';

			const profileJson: ProfileJson = {
				'@context': 'http://schema.org',
				'@type': 'Person',
				'@id': name,
				name: 'John Doe'
			};
			const signedToken = signProfileToken(profileJson, privateKey);

			nock('https://gaia.blockstack.org')
				.get('/hub/1111111111111111111114oLvT2/0/profile.json')
				.reply(200, `[{ "token": "${signedToken}" }]`);

			const zoneFile = makeProfileZoneFile(name, tokenFileUrl);

			chai.expect(await resolveZoneFileToPerson(zoneFile, publicKey)).to.deep.equal(profileJson);
		});

		it(`fails on ${incorrect()} inputs`, async function() {
			// TODO: Do these when the used methods throw better errors
		});
	});
});
