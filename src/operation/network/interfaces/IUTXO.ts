export interface IUTXO {
	value?: number;
	confirmations?: number;
	tx_hash: string;
	tx_output_n: number;
}
