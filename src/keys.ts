import * as bigi from 'bigi';
import { address as baddress, crypto as bcrypto, ECPair } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';

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
