import { BlockstackError, ERROR_CODES } from './index';

export class RemoteServiceError extends BlockstackError {
	public readonly response: Response;

	constructor(response: Response, message: string = '') {
		super({ code: ERROR_CODES.REMOTE_SERVICE_ERROR, message });
		this.response = response;
	}
}
