import * as bitcoinjs from 'bitcoinjs-lib';

import { BlockstackNetwork, BitcoinNetwork, SATOSHIS_PER_BTC } from './index';

export class LocalRegtest extends BlockstackNetwork {
	constructor(apiUrl: string, broadcastServiceUrl: string, bitcoinAPI: BitcoinNetwork) {
		super(apiUrl, broadcastServiceUrl, bitcoinAPI, bitcoinjs.networks.testnet);
	}

	public getFeeRate(): Promise<number> {
		return Promise.resolve(Math.floor(0.00001 * SATOSHIS_PER_BTC));
	}
}
