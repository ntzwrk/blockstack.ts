export class NotImplementedError extends Error {
	public readonly name: string = 'NotImplementedError';
	public readonly message: string;
	public readonly operation: string;

	constructor(operation?: string, reason?: string) {
		super();

		const messageWithoutReason =
			operation !== undefined
				? `The used operation "${operation}" is not implemented`
				: 'The used operation is not implemented';
		this.message = reason !== undefined ? reason : messageWithoutReason;
		this.operation = operation;
	}
}
