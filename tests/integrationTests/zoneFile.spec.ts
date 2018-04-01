import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import { TokenSigner, JWT } from 'jsontokens';
import { JsonZoneFile, makeZoneFile, parseZoneFile } from 'zone-file';

import { correct, incorrect } from '../fun';

import { DidNotSatisfyJsonSchemaError, InvalidParameterError } from '../../src/error';
import { signProfileToken } from '../../src/profile/jwt';
import { PersonJson } from '../../src/profile/schema/Person.json';
import { ProfileJson } from '../../src/profile/schema/Profile.json';
import {
	getTokenFileUrl,
	makeProfileZoneFile,
	resolveZoneFileToPerson,
	resolveZoneFileToProfile
} from '../../src/zoneFile';

chai.use(chaiAsPromised);

describe('zoneFile.ts', () => {
	describe('resolveZoneFileToPerson', () => {
		it(`makes ${correct()} persons`, async function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			const zoneFile = '$ORIGIN vsund.id\n$TTL 3600\n_http._tcp URI 5 1 \"https://gaia.blockstack.org/hub/15DrW8LfoZecCzQZxKuKQkzMQrUjC1SC2f/0/profile.json\"\n'
			const address = '15DrW8LfoZecCzQZxKuKQkzMQrUjC1SC2f';

			const personJson: PersonJson = await resolveZoneFileToPerson(zoneFile, address);

			chai.expect(personJson["@context"]).to.equal('http://schema.org');
			chai.expect(personJson["@type"]).to.equal('Person');
			chai.expect(personJson.name).to.equal('vsund');
		});

		it(`fails on ${incorrect()} inputs`, function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			chai.expect(resolveZoneFileToPerson('', '')).to.eventually.be.rejectedWith(DidNotSatisfyJsonSchemaError);
		});
	});

	describe('resolveZoneFileToProfile', () => {
		it(`makes ${correct()} profiles`, async function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			const zoneFile = '$ORIGIN vsund.id\n$TTL 3600\n_http._tcp URI 5 1 \"https://gaia.blockstack.org/hub/15DrW8LfoZecCzQZxKuKQkzMQrUjC1SC2f/0/profile.json\"\n'
			const address = '15DrW8LfoZecCzQZxKuKQkzMQrUjC1SC2f';

			const profileJson: ProfileJson = await resolveZoneFileToProfile(zoneFile, address);

			chai.expect(profileJson["@context"]).to.equal('http://schema.org');
			chai.expect(profileJson["@type"]).to.equal('Person');
			chai.expect(profileJson.name).to.equal('vsund');
		});

		it(`fails on ${incorrect()} inputs`, function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			chai.expect(resolveZoneFileToProfile('', '')).to.eventually.be.rejectedWith(DidNotSatisfyJsonSchemaError);
		});
	});
});
