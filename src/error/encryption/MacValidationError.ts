export class MacValidationError extends Error {
	public readonly name: string = 'MacValidationError';
	public readonly message: string = 'Actual MAC did not match the expected MAC';
	public readonly expectedMac: Buffer;
	public readonly actualMac: Buffer;

	constructor(expectedMac: Buffer, actualMac: Buffer) {
		super();

		this.expectedMac = expectedMac;
		this.actualMac = actualMac;
	}
}
