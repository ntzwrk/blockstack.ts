export { Profile } from './Profile';

export { Person } from './Person';
export { Organization } from './Organization';
export { CreativeWork } from './CreativeWork';

export { signProfileToken, wrapProfileToken, verifyProfileToken, extractProfile, decodeToken } from './jwt';

export { lookupProfile } from './lookup';

export { validateProofs, containsValidProofStatement, containsValidAddressProofStatement } from './proof';
