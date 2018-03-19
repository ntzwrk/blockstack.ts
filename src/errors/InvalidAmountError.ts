import { BlockstackError } from './index';

export class InvalidAmountError extends BlockstackError {
	public readonly fees: number;
	public readonly specifiedAmount: number;
	constructor(fees: number, specifiedAmount: number) {
		const message =
			`Not enough coin to fund fees transaction fees. Fees would be ${fees},` +
			` specified spend is  ${specifiedAmount}`;
		super({ code: 'invalid_amount_error', message });
		this.specifiedAmount = specifiedAmount;
		this.fees = fees;
		this.name = 'InvalidAmountError';
		this.message = message;
	}
}
