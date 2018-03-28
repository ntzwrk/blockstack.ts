import { JWT } from 'jsontokens';

export class InvalidProfileTokenError extends Error {
	public readonly name: string = 'InvalidProfileTokenError';
	public readonly message: string;
	public readonly profileToken: string | JWT;

	constructor(profileToken: string | JWT, message?: string) {
		super(message);

		this.message = message !== undefined ? message : 'Could not verify the given profile token';
		this.profileToken = profileToken;
	}
}
