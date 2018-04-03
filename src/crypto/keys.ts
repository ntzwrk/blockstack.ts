import * as bigi from 'bigi';
import { address as baddress, crypto as bcrypto, ECPair } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';

import { config } from '../config';
import { InvalidParameterError } from '../error';

export function getEntropy(numberOfBytes: number) {
	if (!numberOfBytes) {
		numberOfBytes = 32;
	}
	return randomBytes(numberOfBytes);
}

export function makeECPrivateKey() {
	const keyPair = ECPair.makeRandom({ rng: getEntropy });
	return keyPair.d.toBuffer(32).toString('hex');
}

export function publicKeyToAddress(publicKey: string) {
	const publicKeyBuffer = new Buffer(publicKey, 'hex');
	const publicKeyHash160 = bcrypto.hash160(publicKeyBuffer);
	return baddress.toBase58Check(publicKeyHash160, 0x00);
}

export function getPublicKeyFromPrivate(privateKey: string) {
	const keyPair = new ECPair(bigi.fromHex(privateKey));
	return keyPair.getPublicKeyBuffer().toString('hex');
}

export function hexStringToECPair(skHex: string) {
	const ecPairOptions = {
		compressed: true,
		network: config.network.layer1
	};

	if (skHex.length === 66) {
		if (skHex.slice(64) !== '01') {
			throw new InvalidParameterError(
				'skHex',
				'Improperly formatted private-key hex string. 66-length hex usually indicates compressed key, but last byte must be == 1',
				skHex
			);
		}
		return new ECPair(bigi.fromHex(skHex.slice(0, 64)), undefined, ecPairOptions);
	} else if (skHex.length === 64) {
		ecPairOptions.compressed = false;
		return new ECPair(bigi.fromHex(skHex), undefined, ecPairOptions);
	} else {
		throw new InvalidParameterError(
			'skHex',
			'Improperly formatted private-key hex string: length should be 64 or 66',
			skHex
		);
	}
}

export function ecPairToHexString(secretKey: ECPair) {
	const ecPointHex = secretKey.d.toHex();
	if (secretKey.compressed) {
		return `${ecPointHex}01`;
	} else {
		return ecPointHex;
	}
}
