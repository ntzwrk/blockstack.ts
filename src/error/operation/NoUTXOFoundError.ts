export class NoUTXOFoundError extends Error {
	public readonly name: string = 'NoUTXOFoundError';
	public readonly message: string;

	constructor(message?: string) {
		super(message);

		this.message = message !== undefined ? message : 'No UTXO could be found';
	}
}
