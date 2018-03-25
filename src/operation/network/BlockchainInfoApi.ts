import * as bitcoinjs from 'bitcoinjs-lib';
import * as fetch from 'isomorphic-fetch';
// import * as FormData from 'form-data'; // TODO: Evaluate the need later

import { DebugType, log } from '../../debug';
import { RemoteServiceError } from '../../error';
import { BitcoinNetwork } from './BitcoinNetwork';
import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class BlockchainInfoApi extends BitcoinNetwork {
	public utxoProviderUrl: string;

	constructor(blockchainInfoUrl: string = 'https://blockchain.info') {
		super();
		this.utxoProviderUrl = blockchainInfoUrl;
	}

	public getBlockHeight() {
		return fetch(`${this.utxoProviderUrl}/latestblock?cors=true`)
			.then(resp => resp.json())
			.then(blockObj => blockObj.height);
	}

	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return fetch(`${this.utxoProviderUrl}/unspent?format=json&active=${address}&cors=true`)
			.then(resp => {
				if (resp.status === 500) {
					log(DebugType.info, 'UTXO provider returned status code 500, usually means no UTXOs: returning []');
					return {
						unspent_outputs: []
					};
				} else {
					return resp.json();
				}
			})
			.then(utxoJSON => utxoJSON.unspent_outputs)
			.then(utxoList =>
				utxoList.map(
					(utxo: { value: number; tx_output_n: number; confirmations: number; tx_hash_big_endian: string }) => ({
						confirmations: utxo.confirmations,
						tx_hash: utxo.tx_hash_big_endian,
						tx_output_n: utxo.tx_output_n,
						value: utxo.value
					})
				)
			);
	}

	public getTransactionInfo(txHash: string): Promise<{ block_height: number }> {
		return fetch(`${this.utxoProviderUrl}/rawtx/${txHash}?cors=true`)
			.then(resp => {
				if (resp.status === 200) {
					return resp.json();
				} else {
					throw new Error(`Could not lookup transaction info for '${txHash}'. Server error.`);
				}
			})
			.then(respObj => ({ block_height: respObj.block_height }));
	}

	public broadcastTransaction(transaction: string) {
		const form = new FormData();
		form.append('tx', transaction);
		return fetch(`${this.utxoProviderUrl}/pushtx?cors=true`, {
			body: form,
			method: 'POST'
		}).then(resp => {
			const text = resp.text();
			return text.then((respText: string) => {
				if (respText.toLowerCase().indexOf('transaction submitted') >= 0) {
					const reversed = bitcoinjs.Transaction.fromHex(transaction)
						.getHash()
						.reverse();
					return (reversed as Buffer).toString('hex'); // big_endian
				} else {
					throw new RemoteServiceError(resp, `Broadcast transaction failed with message: ${respText}`);
				}
			});
		});
	}
}
