import { Facebook } from './Facebook';
import { Github } from './Github';
import { HackerNews } from './HackerNews';
import { Instagram } from './Instagram';
import { LinkedIn } from './LinkedIn';
import { Service } from './Service';
import { Twitter } from './Twitter';

export const profileServices: Map<string, Service> = new Map([
	['facebook', Facebook],
	['github', Github],
	['hackerNews', HackerNews],
	['instagram', Instagram],
	['linkedIn', LinkedIn],
	['twitter', Twitter]
]);

export { Service } from './Service';
