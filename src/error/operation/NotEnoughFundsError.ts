export class NotEnoughFundsError extends Error {
	public readonly name: string = 'NotEnoughFundsError';
	public readonly message: string;
	public readonly leftToFund: number;

	constructor(leftToFund: number) {
		super();

		this.message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
		this.leftToFund = leftToFund;
	}
}
