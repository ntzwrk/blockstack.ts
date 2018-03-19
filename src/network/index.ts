import { BitcoindAPI } from './BitcoindAPI';
import { BlockchainInfoApi } from './BlockchainInfoApi';
import { BlockstackNetwork } from './BlockstackNetwork';
import { InsightClient } from './InsightClient';
import { LocalRegtest } from './LocalRegtest';

export interface IUTXO {
	value?: number;
	confirmations?: number;
	tx_hash: string;
	tx_output_n: number;
}

export const SATOSHIS_PER_BTC = 1e8;
export const TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT = 'zone-file';
export const TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT = 'registration';
export const TX_BROADCAST_SERVICE_TX_ENDPOINT = 'transaction';

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

export const network = {
	BitcoindAPI,
	BlockchainInfoApi,
	BlockstackNetwork,
	InsightClient,
	LocalRegtest,
	defaults: { LOCAL_REGTEST, MAINNET_DEFAULT }
};
