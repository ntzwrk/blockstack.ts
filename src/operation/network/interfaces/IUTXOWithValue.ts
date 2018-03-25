import { IUTXO } from './IUTXO';

export interface IUTXOWithValue extends IUTXO {
	value: number;
}
