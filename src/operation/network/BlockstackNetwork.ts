import * as bitcoinjs from 'bitcoinjs-lib';

import { MissingParameterError, RemoteServiceError } from '../../error';
import { BitcoinNetwork } from './BitcoinNetwork';
import {
	TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT,
	TX_BROADCAST_SERVICE_TX_ENDPOINT,
	TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT
} from './constants';
import { IUTXO } from './interfaces/IUTXO';
import { IUTXOWithValue } from './interfaces/IUTXOWithValue';

export class BlockstackNetwork {
	public blockstackAPIUrl: string;
	public broadcastServiceUrl: string;
	public layer1: bitcoinjs.Network;
	public DUST_MINIMUM: number;
	public includeUtxoMap: { [address: string]: IUTXOWithValue[] };
	public excludeUtxoSet: IUTXO[];
	public btc: BitcoinNetwork;

	constructor(
		apiUrl: string,
		broadcastServiceUrl: string,
		bitcoinAPI: BitcoinNetwork,
		network: bitcoinjs.Network = bitcoinjs.networks.bitcoin
	) {
		this.blockstackAPIUrl = apiUrl;
		this.broadcastServiceUrl = broadcastServiceUrl;
		this.layer1 = network;
		this.btc = bitcoinAPI;

		this.DUST_MINIMUM = 5500;
		this.includeUtxoMap = {};
		this.excludeUtxoSet = [];
	}

	public coerceAddress(address: string) {
		const addressHash = bitcoinjs.address.fromBase58Check(address).hash;
		return bitcoinjs.address.toBase58Check(addressHash, this.layer1.pubKeyHash);
	}

	public getNamePrice(fullyQualifiedName: string) {
		return fetch(`${this.blockstackAPIUrl}/v1/prices/names/${fullyQualifiedName}`)
			.then(resp => resp.json())
			.then(x => x.name_price.satoshis)
			.then(satoshis => {
				if (satoshis) {
					if (satoshis < this.DUST_MINIMUM) {
						return this.DUST_MINIMUM;
					} else {
						return satoshis;
					}
				} else {
					throw new Error('Failed to parse price of name');
				}
			});
	}

	public getGracePeriod() {
		return new Promise(resolve => resolve(5000));
	}

	public getNamesOwned(address: string) {
		const networkAddress = this.coerceAddress(address);
		return fetch(`${this.blockstackAPIUrl}/v1/addresses/bitcoin/${networkAddress}`)
			.then(resp => resp.json())
			.then(obj => obj.names);
	}

	public getNamespaceBurnAddress(namespace: string | undefined) {
		return fetch(`${this.blockstackAPIUrl}/v1/namespaces/${namespace}`)
			.then(resp => {
				if (resp.status === 404) {
					throw new Error(`No such namespace '${namespace}'`);
				} else {
					return resp.json();
				}
			})
			.then(namespaceInfo => {
				let address = '1111111111111111111114oLvT2'; // default burn address
				const blockHeights = Object.keys(namespaceInfo.history);
				blockHeights.sort((x, y) => parseInt(x, 10) - parseInt(y, 10));
				blockHeights.forEach(blockHeight => {
					const infoAtBlock = namespaceInfo.history[blockHeight][0];
					if (infoAtBlock.hasOwnProperty('burn_address')) {
						address = infoAtBlock.burn_address;
					}
				});
				return address;
			})
			.then(address => this.coerceAddress(address));
	}

	public getNameInfo(fullyQualifiedName: string) {
		return fetch(`${this.blockstackAPIUrl}/v1/names/${fullyQualifiedName}`)
			.then(resp => {
				if (resp.status === 404) {
					throw new Error('Name not found');
				} else if (resp.status !== 200) {
					throw new Error(`Bad response status: ${resp.status}`);
				} else {
					return resp.json();
				}
			})
			.then(nameInfo => {
				// the returned address _should_ be in the correct network ---
				//  blockstackd gets into trouble because it tries to coerce back to mainnet
				//  and the regtest transaction generation libraries want to use testnet addresses
				if (nameInfo.address) {
					return Object.assign({}, nameInfo, { address: this.coerceAddress(nameInfo.address) });
				} else {
					return nameInfo;
				}
			});
	}

	/**
	 * Performs a POST request to the given URL
	 * @param  {String} endpoint  the name of
	 * @param  {String} body [description]
	 * @return {Promise<Object|Error>} Returns a `Promise` that resolves to the object requested.
	 * In the event of an error, it rejects with:
	 * * a `RemoteServiceError` if there is a problem
	 * with the transaction broadcast service
	 * * `MissingParameterError` if you call the function without a required
	 * parameter
	 *
	 * @private
	 */
	public broadcastServiceFetchHelper(endpoint: string, body: object): Promise<object | Error> {
		const requestHeaders = {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		};

		const options = {
			body: JSON.stringify(body),
			headers: requestHeaders,
			method: 'POST'
		};

		const url = `${this.broadcastServiceUrl}/v1/broadcast/${endpoint}`;
		return fetch(url, options).then(response => {
			if (response.ok) {
				return response.json();
			} else {
				throw new RemoteServiceError(response);
			}
		});
	}

	/**
	 * Broadcasts a signed bitcoin transaction to the network optionally waiting to broadcast the
	 * transaction until a second transaction has a certain number of confirmations.
	 *
	 * @param  {string} transaction the hex-encoded transaction to broadcast
	 * @param  {string} transactionToWatch the hex transaction id of the transaction to watch for
	 * the specified number of confirmations before broadcasting the `transaction`
	 * @param  {number} confirmations the number of confirmations `transactionToWatch` must have
	 * before broadcasting `transaction`.
	 * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
	 * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
	 *
	 * In the event of an error, it rejects with:
	 * * a `RemoteServiceError` if there is a problem
	 *   with the transaction broadcast service
	 * * `MissingParameterError` if you call the function without a required
	 *   parameter
	 */
	public broadcastTransaction(
		transaction: string,
		transactionToWatch: string | null = null,
		confirmations: number = 6
	) {
		if (!transaction) {
			const error = new MissingParameterError('transaction');
			return Promise.reject(error);
		}

		if (!confirmations && confirmations !== 0) {
			const error = new MissingParameterError('confirmations');
			return Promise.reject(error);
		}

		if (transactionToWatch === null) {
			return this.btc.broadcastTransaction(transaction);
		} else {
			/*
       * POST /v1/broadcast/transaction
       * Request body:
       * JSON.stringify({
       *  transaction,
       *  transactionToWatch,
       *  confirmations
       * })
       */
			const endpoint = TX_BROADCAST_SERVICE_TX_ENDPOINT;

			const requestBody = {
				confirmations,
				transaction,
				transactionToWatch
			};

			return this.broadcastServiceFetchHelper(endpoint, requestBody);
		}
	}

	/**
	 * Broadcasts a zone file to the Atlas network via the transaction broadcast service.
	 *
	 * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
	 * @param  {String} transactionToWatch the hex transaction id of the transaction
	 * to watch for confirmation before broadcasting the zone file to the Atlas network
	 * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
	 * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
	 *
	 * In the event of an error, it rejects with:
	 * * a `RemoteServiceError` if there is a problem
	 *   with the transaction broadcast service
	 * * `MissingParameterError` if you call the function without a required
	 *   parameter
	 */
	public broadcastZoneFile(zoneFile: string, transactionToWatch: string | null = null) {
		if (!zoneFile) {
			return Promise.reject(new MissingParameterError('zoneFile'));
		}

		// TODO: validate zonefile

		if (transactionToWatch) {
			// broadcast via transaction broadcast service

			/*
       * POST /v1/broadcast/zone-file
       * Request body:
       * JSON.stringify({
       *  zoneFile,
       *  transactionToWatch
       * })
       */

			const requestBody = {
				transactionToWatch,
				zoneFile
			};

			const endpoint = TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT;

			return this.broadcastServiceFetchHelper(endpoint, requestBody);
		} else {
			// broadcast via core endpoint

			// zone file is two words but core's api treats it as one word 'zonefile'
			const requestBody = { zonefile: zoneFile };

			return fetch(`${this.blockstackAPIUrl}/v1/zonefile/`, {
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json'
				},
				method: 'POST'
			}).then(resp => {
				const json = resp.json();
				return json.then(respObj => {
					if (respObj.hasOwnProperty('error')) {
						throw new RemoteServiceError(resp);
					}
					return respObj.servers;
				});
			});
		}
	}

	/**
	 * Sends the preorder and registration transactions and zone file
	 * for a Blockstack name registration
	 * along with the to the transaction broadcast service.
	 *
	 * The transaction broadcast:
	 *
	 * * immediately broadcasts the preorder transaction
	 * * broadcasts the register transactions after the preorder transaction
	 * has an appropriate number of confirmations
	 * * broadcasts the zone file to the Atlas network after the register transaction
	 * has an appropriate number of confirmations
	 *
	 * @param  {String} preorderTransaction the hex-encoded, signed preorder transaction generated
	 * using the `makePreorder` function
	 * @param  {String} registerTransaction the hex-encoded, signed register transaction generated
	 * using the `makeRegister` function
	 * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
	 * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
	 * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
	 *
	 * In the event of an error, it rejects with:
	 * * a `RemoteServiceError` if there is a problem
	 *   with the transaction broadcast service
	 * * `MissingParameterError` if you call the function without a required
	 *   parameter
	 */
	public broadcastNameRegistration(preorderTransaction: string, registerTransaction: string, zoneFile: string) {
		/*
       * POST /v1/broadcast/registration
       * Request body:
       * JSON.stringify({
       * preorderTransaction,
       * registerTransaction,
       * zoneFile
       * })
       */

		if (!preorderTransaction) {
			const error = new MissingParameterError('preorderTransaction');
			return Promise.reject(error);
		}

		if (!registerTransaction) {
			const error = new MissingParameterError('registerTransaction');
			return Promise.reject(error);
		}

		if (!zoneFile) {
			const error = new MissingParameterError('zoneFile');
			return Promise.reject(error);
		}

		const requestBody = {
			preorderTransaction,
			registerTransaction,
			zoneFile
		};

		const endpoint = TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT;

		return this.broadcastServiceFetchHelper(endpoint, requestBody);
	}

	public getFeeRate(): Promise<number> {
		return fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended')
			.then(resp => resp.json())
			.then(rates => Math.floor(rates.fastestFee));
	}

	public countDustOutputs() {
		throw new Error('Not implemented.');
	}

	public getUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return this.getNetworkedUTXOs(address).then(networkedUTXOs => {
			let returnSet = networkedUTXOs.concat();
			if (this.includeUtxoMap.hasOwnProperty(address)) {
				returnSet = networkedUTXOs.concat(this.includeUtxoMap[address]);
			}

			// aaron: I am *well* aware this is O(n)*O(m) runtime
			//    however, clients should clear the exclude set periodically
			const excludeSet = this.excludeUtxoSet;
			returnSet = returnSet.filter(utxo => {
				const inExcludeSet = excludeSet.reduce(
					(inSet, utxoToCheck) =>
						inSet || (utxoToCheck.tx_hash === utxo.tx_hash && utxoToCheck.tx_output_n === utxo.tx_output_n),
					false
				);
				return !inExcludeSet;
			});

			return returnSet;
		});
	}

	/**
	 * This will modify the network's utxo set to include UTXOs
	 *  from the given transaction and exclude UTXOs *spent* in
	 *  that transaction
	 * @param {String} txHex - the hex-encoded transaction to use
	 * @return {void} no return value, this modifies the UTXO config state
	 * @private
	 */
	public modifyUTXOSetFrom(txHex: string) {
		const tx = bitcoinjs.Transaction.fromHex(txHex);

		const excludeSet: IUTXO[] = this.excludeUtxoSet.concat();

		tx.ins.forEach(utxoUsed => {
			const reverseHash = Buffer.from(utxoUsed.hash);
			reverseHash.reverse();
			excludeSet.push({
				tx_hash: reverseHash.toString('hex'),
				tx_output_n: utxoUsed.index
			});
		});

		this.excludeUtxoSet = excludeSet;

		const txHash = (tx.getHash().reverse() as Buffer).toString('hex');
		tx.outs.forEach((utxoCreated, txOutputN) => {
			if (bitcoinjs.script.classifyOutput(utxoCreated.script) === 'nulldata') {
				return;
			}
			const address = bitcoinjs.address.fromOutputScript(utxoCreated.script, this.layer1);

			let includeSet: IUTXOWithValue[] = [];
			if (this.includeUtxoMap.hasOwnProperty(address)) {
				includeSet = includeSet.concat(this.includeUtxoMap[address]);
			}

			includeSet.push({
				confirmations: 0,
				tx_hash: txHash,
				tx_output_n: txOutputN,
				value: utxoCreated.value
			});
			this.includeUtxoMap[address] = includeSet;
		});
	}

	public resetUTXOs(address: string) {
		delete this.includeUtxoMap[address];
		this.excludeUtxoSet = [];
	}

	public getConsensusHash() {
		return fetch(`${this.blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
			.then(resp => resp.json())
			.then(x => x.consensus_hash);
	}

	public getTransactionInfo(txHash: string): Promise<{ block_height: number }> {
		return this.btc.getTransactionInfo(txHash) as Promise<{ block_height: number }>;
	}

	public getBlockHeight() {
		return this.btc.getBlockHeight();
	}

	public getNetworkedUTXOs(address: string): Promise<IUTXOWithValue[]> {
		return this.btc.getNetworkedUTXOs(address);
	}
}
