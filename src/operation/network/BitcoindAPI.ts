import { BitcoinNetwork } from './BitcoinNetwork';
import { SATOSHIS_PER_BTC } from './constants';
import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class BitcoindAPI extends BitcoinNetwork {
	public bitcoindUrl: string;
	public bitcoindCredentials: { username: string; password: string };

	constructor(bitcoindUrl: string, bitcoindCredentials: { username: string; password: string }) {
		super();
		this.bitcoindUrl = bitcoindUrl;
		this.bitcoindCredentials = bitcoindCredentials;
	}

	public broadcastTransaction(transaction: string) {
		const jsonRPC = {
			jsonrpc: '1.0',
			method: 'sendrawtransaction',
			params: [transaction]
		};
		const authString = Buffer.from(
			`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`
		).toString('base64');
		const headers = new Headers({ Authorization: `Basic ${authString}` });
		return fetch(this.bitcoindUrl, {
			body: JSON.stringify(jsonRPC),
			headers,
			method: 'POST'
		})
			.then(resp => resp.json())
			.then(respObj => respObj.result);
	}

	public getBlockHeight() {
		const jsonRPC = {
			jsonrpc: '1.0',
			method: 'getblockcount'
		};
		const authString = Buffer.from(
			`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`
		).toString('base64');
		const headers = new Headers({ Authorization: `Basic ${authString}` });
		return fetch(this.bitcoindUrl, {
			body: JSON.stringify(jsonRPC),
			headers,
			method: 'POST'
		})
			.then(resp => resp.json())
			.then(respObj => respObj.result);
	}

	public getTransactionInfo(txHash: string): Promise<{ block_height: number }> {
		const jsonRPC = {
			jsonrpc: '1.0',
			method: 'gettransaction',
			params: [txHash]
		};
		const authString = Buffer.from(
			`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`
		).toString('base64');
		const headers = new Headers({ Authorization: `Basic ${authString}` });
		return fetch(this.bitcoindUrl, {
			body: JSON.stringify(jsonRPC),
			headers,
			method: 'POST'
		})
			.then(resp => resp.json())
			.then(respObj => respObj.result)
			.then(txInfo => txInfo.blockhash)
			.then(blockhash => {
				const jsonRPCBlock = {
					jsonrpc: '1.0',
					method: 'getblockheader',
					params: [blockhash]
				};
				headers.append('Authorization', `Basic ${authString}`);
				return fetch(this.bitcoindUrl, {
					body: JSON.stringify(jsonRPCBlock),
					headers,
					method: 'POST'
				});
			})
			.then(resp => resp.json())
			.then(respObj => ({ block_height: respObj.result.height }));
	}

	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		const jsonRPCImport = {
			jsonrpc: '1.0',
			method: 'importaddress',
			params: [address]
		};
		const jsonRPCUnspent = {
			jsonrpc: '1.0',
			method: 'listunspent',
			params: [1, 9999999, [address]]
		};
		const authString = Buffer.from(
			`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`
		).toString('base64');
		const headers = new Headers({ Authorization: `Basic ${authString}` });

		return fetch(this.bitcoindUrl, {
			body: JSON.stringify(jsonRPCImport),
			headers,
			method: 'POST'
		})
			.then(() =>
				fetch(this.bitcoindUrl, {
					body: JSON.stringify(jsonRPCUnspent),
					headers,
					method: 'POST'
				})
			)
			.then(resp => resp.json())
			.then(x => x.result)
			.then(utxos =>
				utxos.map((x: { amount: number; confirmations: number; txid: string; vout: number }) => ({
					confirmations: x.confirmations,
					tx_hash: x.txid,
					tx_output_n: x.vout,
					value: x.amount * SATOSHIS_PER_BTC
				}))
			);
	}
}
