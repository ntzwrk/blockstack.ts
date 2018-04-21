import { BlockstackCoreClient } from 'blockstack-core-client.ts';

import { BlockstackNetwork, defaults } from './operation/network';

export const config = {
	coreClient: new BlockstackCoreClient('core.blockstack.org'),
	network: defaults.MAINNET_DEFAULT
};
