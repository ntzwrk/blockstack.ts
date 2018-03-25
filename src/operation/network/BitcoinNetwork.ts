import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class BitcoinNetwork {
	public broadcastTransaction(transaction: string): Promise<string> {
		return Promise.reject(new Error(`Not implemented, broadcastTransaction(${transaction})`));
	}
	public getBlockHeight(): Promise<number> {
		return Promise.reject(new Error('Not implemented, getBlockHeight()'));
	}
	public getTransactionInfo(txid: string): Promise<{ block_height: number }> {
		return Promise.reject(new Error(`Not implemented, getTransactionInfo(${txid})`));
	}
	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return Promise.reject(new Error(`Not implemented, getNetworkedUTXOs(${address})`));
	}
}
