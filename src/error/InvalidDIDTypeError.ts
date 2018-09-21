export class InvalidDIDTypeError extends Error {
	public readonly name: string = 'InvalidDIDTypeError';
	public readonly message: string;
	public readonly actualType: string;
	public readonly expectedType: string;

	constructor(actualType: string, expectedType: string) {
		super();

		this.message = `The given DID type "${actualType}" did not match the expected "${expectedType}"`;
		this.actualType = actualType;
		this.expectedType = expectedType;
	}
}
