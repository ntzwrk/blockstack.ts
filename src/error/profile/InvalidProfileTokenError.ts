import { JWT } from 'jsontokens';

import { ProfileTokenJson } from '../../profile/schema/ProfileToken.json';

export class InvalidProfileTokenError extends Error {
	public readonly name: string = 'InvalidProfileTokenError';
	public readonly message: string;
	public readonly profileToken: string | JWT | ProfileTokenJson;

	constructor(profileToken: string | JWT | ProfileTokenJson, message?: string) {
		super(message);

		this.message = message !== undefined ? message : 'Could not verify the given profile token';
		this.profileToken = profileToken;
	}
}
