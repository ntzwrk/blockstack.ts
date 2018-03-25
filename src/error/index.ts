export const ERROR_CODES = {
	MISSING_PARAMETER: 'missing_parameter',
	REMOTE_SERVICE_ERROR: 'remote_service_error',
	UNKNOWN: 'unknown'
};

export interface IErrorType {
	code: string;
	parameter?: string;
	message: string;
}

export class BlockstackError extends Error {
	public readonly code: string;
	public readonly parameter?: string;

	constructor(error: IErrorType) {
		super(error.message);
		this.code = error.code;
		this.parameter = error.parameter ? error.parameter : undefined;
	}

	public toString() {
		return `${super.toString()} code: ${this.code} param: ${this.parameter ? this.parameter : 'n/a'}`;
	}
}

export { InvalidAmountError } from './InvalidAmountError';
export { InvalidDIDError } from './InvalidDIDError';
export { InvalidParameterError } from './InvalidParameterError';
export { MissingParameterError } from './MissingParameterError';
export { NotEnoughFundsError } from './NotEnoughFundsError';
export { RemoteServiceError } from './RemoteServiceError';
