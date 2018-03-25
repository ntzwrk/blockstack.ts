export * from './auth';
export * from './profile';
export * from './storage';

export { makeDIDFromAddress, makeDIDFromPublicKey, getDIDType, getAddressFromDID } from './dids';
export { getEntropy, makeECPrivateKey, publicKeyToAddress, getPublicKeyFromPrivate } from './encryption';
export {
	nextYear,
	nextMonth,
	nextHour,
	makeUUID4,
	updateQueryStringParameter,
	isLaterVersion,
	isSameOriginAbsoluteUrl,
	hexStringToECPair,
	ecPairToHexString
} from './utils';

export { transactions, safety } from './operation';

export { network } from './operation/network';

export { decodeToken } from 'jsontokens';

export { config } from './config';
