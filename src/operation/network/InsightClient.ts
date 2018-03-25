import { BitcoinNetwork } from './BitcoinNetwork';
import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class InsightClient extends BitcoinNetwork {
	public apiUrl: string;

	constructor(insightUrl: string = 'https://utxo.technofractal.com/') {
		super();
		this.apiUrl = insightUrl;
	}

	public broadcastTransaction(transaction: string) {
		const jsonData = { tx: transaction };
		return fetch(`${this.apiUrl}/tx/send`, {
			body: JSON.stringify(jsonData),
			headers: new Headers({ 'Content-Type': 'application/json' }),
			method: 'POST'
		}).then(resp => resp.json());
	}

	public getBlockHeight() {
		return fetch(`${this.apiUrl}/status`)
			.then(resp => resp.json())
			.then(status => status.blocks);
	}

	public getTransactionInfo(txHash: string): Promise<{ block_height: number }> {
		return fetch(`${this.apiUrl}/tx/${txHash}`)
			.then(resp => resp.json())
			.then(transactionInfo => {
				if (transactionInfo.error) {
					throw new Error(`Error finding transaction: ${transactionInfo.error}`);
				}
				return fetch(`${this.apiUrl}/block/${transactionInfo.blockHash}`);
			})
			.then(resp => resp.json())
			.then(blockInfo => ({ block_height: blockInfo.height }));
	}

	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return fetch(`${this.apiUrl}/addr/${address}/utxo`)
			.then(resp => resp.json())
			.then(utxos =>
				utxos.map((x: { satoshis: number; confirmations: number; txid: string; vout: number }) => ({
					confirmations: x.confirmations,
					tx_hash: x.txid,
					tx_output_n: x.vout,
					value: x.satoshis
				}))
			);
	}
}
