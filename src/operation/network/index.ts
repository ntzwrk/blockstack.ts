import { BitcoindAPI } from './BitcoindAPI';
import { BlockchainInfoApi } from './BlockchainInfoApi';
import { BlockstackNetwork } from './BlockstackNetwork';
import { LocalRegtest } from './LocalRegtest';

export { BitcoindAPI } from './BitcoindAPI';
export { BlockchainInfoApi } from './BlockchainInfoApi';
export { BlockstackNetwork } from './BlockstackNetwork';
export { InsightClient } from './InsightClient';
export { LocalRegtest } from './LocalRegtest';

const LOCAL_REGTEST = new LocalRegtest(
	'http://localhost:16268',
	'http://localhost:16269',
	new BitcoindAPI('http://localhost:18332/', { username: 'blockstack', password: 'blockstacksystem' }) // tslint:disable-line
);

const MAINNET_DEFAULT = new BlockstackNetwork(
	'https://core.blockstack.org',
	'https://broadcast.blockstack.org',
	new BlockchainInfoApi()
);

export const defaults = { LOCAL_REGTEST, MAINNET_DEFAULT };
