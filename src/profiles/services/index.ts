import { Facebook } from './facebook';
import { Github } from './github';
import { HackerNews } from './hackerNews';
import { Instagram } from './instagram';
import { LinkedIn } from './linkedIn';
import { Twitter } from './twitter';

export const profileServices = {
	facebook: Facebook,
	github: Github,
	hackerNews: HackerNews,
	instagram: Instagram,
	linkedIn: LinkedIn,
	twitter: Twitter
};

export { containsValidProofStatement, containsValidAddressProofStatement, IProof } from './serviceUtils';
