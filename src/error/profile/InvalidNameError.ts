export class InvalidNameError extends Error {
	public readonly name: string = 'InvalidNameError';
	public readonly message: string;
	public readonly blockstackName: string;

	constructor(blockstackName?: string) {
		super();

		this.message =
			blockstackName !== undefined
				? `The given blockstack name "${blockstackName}" was invalid`
				: 'The given blockstack name was invalid';
		this.blockstackName = blockstackName;
	}
}
