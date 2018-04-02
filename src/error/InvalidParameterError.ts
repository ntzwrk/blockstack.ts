export class InvalidParameterError extends Error {
	public readonly name: string = 'InvalidParameterError';
	public readonly message: string;
	public readonly parameter: string | undefined;
	public readonly reason: string | undefined;
	public readonly value: any;

	constructor(parameter?: string, reason?: string, value?: any) {
		super();

		const messageWithoutReason =
			parameter !== undefined ? `The given parameter "${parameter}" was invalid` : 'The given parameter was invalid';
		this.message = reason !== undefined ? reason : messageWithoutReason;
		this.parameter = parameter;
		this.reason = reason;
		this.value = value;
	}
}
