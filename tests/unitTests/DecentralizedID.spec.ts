import * as chai from 'chai';

import { correct, incorrect } from '../fun';

import { DecentralizedID } from '../../src/DecentralizedID';
import { InvalidDIDError, InvalidDIDTypeError } from '../../src/error';

describe('DecentralizedID', () => {
	const didWithBtcAddr = new DecentralizedID('btc-addr', '1111111111111111111114oLvT2');
	const didWithPubKey = new DecentralizedID('ecdsa-pub', '000000000000000000000000000000000000000000000000000000000000000000')

	const btcAddr = '1111111111111111111114oLvT2';
	const pubKey = '000000000000000000000000000000000000000000000000000000000000000000';

	const didStringWithBtcAddr = 'did:btc-addr:1111111111111111111114oLvT2';
	const didStringWithPubKey = 'did:ecdsa-pub:000000000000000000000000000000000000000000000000000000000000000000';

	describe('fromAddress', () => {
		it(`creates ${correct()} DID objects from an address`, () => {
			const did = DecentralizedID.fromAddress('1111111111111111111114oLvT2');

			chai.expect(did).to.deep.equal(didWithBtcAddr);
		});
	});

	describe('fromPublicKey', () => {
		it(`creates ${correct()} DID Objects from a public key`, () => {
			const did = DecentralizedID.fromPublicKey('000000000000000000000000000000000000000000000000000000000000000000');

			chai.expect(did).to.deep.equal(didWithPubKey);
		});
	});

	describe('fromString', () => {
		it(`creates ${correct()} DID objects from a string`, () => {
			chai.expect(DecentralizedID.fromString(didStringWithBtcAddr)).to.deep.equal(didWithBtcAddr);
			chai.expect(DecentralizedID.fromString(didStringWithPubKey)).to.deep.equal(didWithPubKey);
		});

		it(`fails on ${incorrect()} inputs`, () => {
			chai.expect(() => DecentralizedID.fromString('did:1:2:3')).to.throw(InvalidDIDError);
			chai.expect(() => DecentralizedID.fromString('did:1')).to.throw(InvalidDIDError);
			chai.expect(() => DecentralizedID.fromString('')).to.throw(InvalidDIDError);
			chai.expect(() => DecentralizedID.fromString('no-did:1:2')).to.throw(InvalidDIDError);
		});
	});

	describe('constructor', () => {
		it(`creates ${correct()} DID objects`, () => {
			chai.expect(new DecentralizedID('btc-addr', btcAddr)).to.deep.equal(didWithBtcAddr);
			chai.expect(new DecentralizedID('ecdsa-pub', pubKey)).to.deep.equal(didWithPubKey);
		});
	});

	describe('getAddress', () => {
		it(`retrieves the ${correct()} address of a DID object`, () => {
			chai.expect(didWithBtcAddr.getAddress()).to.equal(btcAddr);
		});

		it(`fails on ${incorrect()} inputs`, () => {
			chai.expect(() => didWithPubKey.getAddress()).to.throw(InvalidDIDTypeError);
		});
	});

	describe('getType', () => {
		it(`retrieves the ${correct()} type of a DID object`, () => {
			chai.expect(didWithBtcAddr.getType()).to.equal('btc-addr');
			chai.expect(didWithPubKey.getType()).to.equal('ecdsa-pub');
		});
	});

	describe('toString', () => {
		it(`creates ${correct()} DID strings from DID objects`, () => {
			chai.expect(didWithBtcAddr.toString()).to.equal(didStringWithBtcAddr);
			chai.expect(didWithPubKey.toString()).to.equal(didStringWithPubKey);
		});
	});
});
