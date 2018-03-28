// ./
export { InvalidDIDError } from './InvalidDIDError';
export { InvalidParameterError } from './InvalidParameterError';
export { NotImplementedError } from './NotImplementedError';

// ./auth/
export { MultiplePublicKeysNotSupportedError } from './auth/MultiplePublicKeysNotSupportedError';

// ./encryption/
export { InputNumberTooBigError } from './encryption/InputNumberTooBigError';
export { InvalidHexStringError } from './encryption/InvalidHexStringError';
export { MacValidationError } from './encryption/MacValidationError';

// ./operation/
export { InvalidAmountError } from './operation/InvalidAmountError';
export { NotEnoughFundsError } from './operation/NotEnoughFundsError';
export { NoUTXOFoundError } from './operation/NoUTXOFoundError';
export { RemoteServiceError } from './operation/RemoteServiceError';

// ./profile/
export { InvalidNameError } from './profile/InvalidNameError';
export { InvalidProfileTokenError } from './profile/InvalidProfileTokenError';
export { InvalidProofUrlError } from './profile/InvalidProofUrlError';
export { SigningAlgorithmNotSupportedError } from './profile/SigningAlgorithmNotSupportedError';
export { TokenVerificationFailedError } from './profile/TokenVerificationFailedError';

// ./storage/
export { GetFileError } from './storage/GetFileError';

// ./zoneFile/
export { InvalidTokenFileUrlError } from './zoneFile/InvalidTokenFileUrlError';
export { MissingOriginError } from './zoneFile/MissingOriginError';
