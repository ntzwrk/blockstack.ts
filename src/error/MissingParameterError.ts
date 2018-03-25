import { BlockstackError, ERROR_CODES } from './index';

export class MissingParameterError extends BlockstackError {
	constructor(parameter: string, message: string = '') {
		super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter });
		this.name = 'MissingParametersError';
	}
}
