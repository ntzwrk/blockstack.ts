import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { correct, incorrect } from '../fun';

import { NameZoneFile } from '../../src/NameZoneFile';

chai.use(chaiAsPromised);

describe('NameZoneFile', () => {
	describe('lookupByName', () => {
		it(`looks up ${correct()} names`, async function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			const zoneFile = await NameZoneFile.lookupByName('vsund.id');

			chai.expect(zoneFile.name).to.equal('vsund.id');
			chai.expect(zoneFile.profileTokenUrl).to.contain('/hub/15DrW8LfoZecCzQZxKuKQkzMQrUjC1SC2f/0/profile.json');
		});

		it(`fails on ${incorrect()} inputs`, async function() {
			this.slow(3000);
			this.timeout(6000);
			this.retries(3);

			// TODO: Revisit this when Blockstack Core responds with proper error messages (`blockstack-core-client.ts` currently returns a plain error for not finding a zone file)
			chai.expect(NameZoneFile.lookupByName('please-dont-buy-this-name.id')).to.eventually.be.rejectedWith(Error);
		});
	});
});
