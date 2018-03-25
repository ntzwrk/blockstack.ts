import { BlockstackError } from './index';

export class NotEnoughFundsError extends BlockstackError {
	public readonly leftToFund: number;
	constructor(leftToFund: number) {
		const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
		super({ code: 'not_enough_error', message });
		this.leftToFund = leftToFund;
		this.name = 'NotEnoughFundsError';
		this.message = message;
	}
}
