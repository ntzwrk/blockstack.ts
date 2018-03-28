import { NotImplementedError } from '../../error';
import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class BitcoinNetwork {
	public broadcastTransaction(transaction: string): Promise<string> {
		return Promise.reject(new NotImplementedError('broadcastTransaction'));
	}
	public getBlockHeight(): Promise<number> {
		return Promise.reject(new NotImplementedError('getBlockHeight'));
	}
	public getTransactionInfo(txid: string): Promise<{ block_height: number }> {
		return Promise.reject(new NotImplementedError('getTransactionInfo'));
	}
	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return Promise.reject(new NotImplementedError('getNetworkedUTXOs'));
	}
}
