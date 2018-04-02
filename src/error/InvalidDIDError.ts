export class InvalidDIDError extends Error {
	public readonly name: string = 'InvalidDIDError';
	public readonly message: string;
	public readonly did: string | undefined;

	constructor(did?: string, message?: string) {
		super(message);

		this.message = message !== undefined ? message : 'The given DID is invalid';
		this.did = did;
	}
}
