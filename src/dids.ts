import { InvalidDIDError } from './error';

export function makeDIDFromAddress(address: string) {
	return `did:btc-addr:${address}`;
}

export function makeDIDFromPublicKey(publicKey: string) {
	return `did:ecdsa-pub:${publicKey}`;
}

export function getDIDType(decentralizedID: string) {
	const didParts = decentralizedID.split(':');

	if (didParts.length !== 3) {
		throw new InvalidDIDError('Decentralized IDs must have 3 parts');
	}

	if (didParts[0].toLowerCase() !== 'did') {
		throw new InvalidDIDError('Decentralized IDs must start with "did"');
	}

	return didParts[1].toLowerCase();
}

export function getAddressFromDID(decentralizedID: string) {
	const didType = getDIDType(decentralizedID);
	if (didType === 'btc-addr') {
		return decentralizedID.split(':')[2];
	} else {
		return null;
	}
}
