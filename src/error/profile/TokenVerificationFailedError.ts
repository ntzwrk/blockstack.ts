import { JWT } from 'jsontokens';

export class TokenVerificationFailedError extends Error {
	public readonly name: string = 'TokenVerificationFailedError';
	public readonly message: string;
	public readonly token: string | JWT;

	constructor(token?: string | JWT) {
		super();

		this.message = 'The given token could not be verified';
		this.token = token;
	}
}
