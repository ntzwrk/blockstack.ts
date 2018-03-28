export class InvalidHexStringError extends Error {
	public readonly name: string = 'InvalidHexStringError';
	public readonly message: string;

	constructor(message?: string) {
		super(message);

		this.message =
			message !== undefined ? message : 'The given hex string is improperly formatted: Length should be 64 or 66';
	}
}
