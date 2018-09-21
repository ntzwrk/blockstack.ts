import { InvalidDIDError, InvalidDIDTypeError } from './error';

export class DecentralizedID {
	public static fromAddress(address: string): DecentralizedID {
		return new DecentralizedID('btc-addr', address);
	}

	public static fromPublicKey(publicKey: string): DecentralizedID {
		return new DecentralizedID('ecdsa-pub', publicKey);
	}

	public static fromString(str: string): DecentralizedID {
		const didParts = str.split(':');

		if (didParts.length !== 3) {
			throw new InvalidDIDError(str, 'Decentralized IDs must have 3 parts');
		}

		if (didParts[0].toLowerCase() !== 'did') {
			throw new InvalidDIDError(str, 'Decentralized IDs must start with "did"');
		}

		const type = didParts[1];
		const identifier = didParts[2];
		return new DecentralizedID(type, identifier);
	}

	private readonly type: string;
	private readonly identifier: string;

	public constructor(type: string, identifier: string) {
		this.type = type;
		this.identifier = identifier;
	}

	public getAddress() {
		if(this.type == 'btc-addr') {
			return this.identifier;
		} else {
			throw new InvalidDIDTypeError(this.type, 'btc-addr');
		}
	}

	public getType(): string {
		return this.type;
	}

	public toString(): string {
		return `did:${this.type}:${this.identifier}`;
	}
}
