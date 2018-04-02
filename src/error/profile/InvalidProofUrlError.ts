export class InvalidProofUrlError extends Error {
	public readonly name: string = 'InvalidProofUrlError';
	public readonly message: string;
	public readonly proofUrl: string | undefined;
	public readonly service: string | undefined;

	constructor(proofUrl?: string, service?: string) {
		super();

		this.message =
			proofUrl !== undefined && service !== undefined
				? `The proof url "${proofUrl}" is not valid for service "${service}"`
				: 'The given proof url is not valid for the used service';
		this.proofUrl = proofUrl;
		this.service = service;
	}
}
