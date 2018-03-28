export class InvalidTokenFileUrlError extends Error {
	public readonly name: string = 'InvalidTokenFileUrlError';
	public readonly message: string;
	public readonly tokenFileUrl: string;

	constructor(tokenFileUrl?: string) {
		super();

		this.message =
			tokenFileUrl !== undefined
				? `The given token file URL "${tokenFileUrl}" is invalid`
				: 'The given token file URL is invalid';
		this.tokenFileUrl = tokenFileUrl;
	}
}
