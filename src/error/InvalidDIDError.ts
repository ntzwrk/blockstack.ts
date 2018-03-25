import { BlockstackError } from './index';

export class InvalidDIDError extends BlockstackError {
	constructor(message: string = '') {
		super({ code: 'invalid_did_error', message, parameter: '' });
		this.name = 'InvalidDIDError';
		this.message = message;
	}
}
