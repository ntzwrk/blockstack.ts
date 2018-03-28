import { BN } from 'bn.js';

export class InputNumberTooBigError extends Error {
	public readonly name: string = 'InputNumberTooBigError';
	public readonly message: string = 'The given BN is too big (no support for BNs > 32 byte)';
	public readonly bn: BN;

	constructor(bn: BN) {
		super();

		this.bn = bn;
	}
}
