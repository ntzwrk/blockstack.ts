export { Profile } from './Profile';

export { Person } from './Person';
export { Organization } from './Organization';
export { CreativeWork } from './CreativeWork';

export {
	makeProfileZoneFile,
	getTokenFileUrl,
	resolveZoneFileToProfile,
	lookupProfile,
	validateProofs,
	resolveZoneFileToPerson,
	signProfileToken,
	wrapProfileToken,
	verifyProfileToken,
	extractProfile
} from './utils';

export { profileServices, containsValidProofStatement, containsValidAddressProofStatement } from './services';
