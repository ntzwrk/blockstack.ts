import { BlockstackError } from './index';

export class InvalidParameterError extends BlockstackError {
	constructor(parameter: string, message: string = '') {
		super({ code: 'missing_parameter', message, parameter: '' });
		this.name = 'MissingParametersError';
	}
}
