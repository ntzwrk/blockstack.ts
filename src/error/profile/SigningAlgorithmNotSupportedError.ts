export class SigningAlgorithmNotSupportedError extends Error {
	public readonly name: string = 'SigningAlgorithmNotSupportedError';
	public readonly message: string;
	public readonly signingAlgorithm: string | undefined;

	constructor(signingAlgorithm?: string) {
		super();

		this.message =
			signingAlgorithm !== undefined
				? `The used signing algorithm "${signingAlgorithm}" is not supported`
				: 'The used signing algorithm is not supported';
		this.signingAlgorithm = signingAlgorithm;
	}
}
