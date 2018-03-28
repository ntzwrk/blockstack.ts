export class InvalidAmountError extends Error {
	public readonly name: string = 'InvalidAmountError';
	public readonly message: string;
	public readonly fees: number;
	public readonly specifiedAmount: number;

	constructor(fees: number, specifiedAmount: number) {
		super();

		this.message = `Not enough coins to fund fees transaction fees. Fees would be "${fees}", specified spend is "${specifiedAmount}"`;
		this.fees = fees;
		this.specifiedAmount = specifiedAmount;
	}
}
