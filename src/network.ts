import * as bitcoinjs from 'bitcoinjs-lib';
import * as FormData from 'form-data';

import { printDebug } from './debug';
import { MissingParameterError, RemoteServiceError } from './errors';

export interface IUTXO {
	value?: number;
	confirmations?: number;
	tx_hash: string;
	tx_output_n: number;
}

const SATOSHIS_PER_BTC = 1e8;
const TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT = 'zone-file';
const TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT = 'registration';
const TX_BROADCAST_SERVICE_TX_ENDPOINT = 'transaction';

export class BlockstackNetwork {
	public blockstackAPIUrl: string;
	public broadcastServiceUrl: string;
	public layer1: bitcoinjs.Network;
	public DUST_MINIMUM: number;
	public includeUtxoMap: { [address: string]: IUTXO[] };
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

	public getNamespaceBurnAddress(namespace: string) {
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

	public getUTXOs(address: string): Promise<IUTXO[]> {
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

		const txHash = tx
			.getHash()
			.reverse()
			.toString('hex');
		tx.outs.forEach((utxoCreated, txOutputN) => {
			if (bitcoinjs.script.classifyOutput(utxoCreated.script) === 'nulldata') {
				return;
			}
			const address = bitcoinjs.address.fromOutputScript(utxoCreated.script, this.layer1);

			let includeSet: IUTXO[] = [];
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

	public getNetworkedUTXOs(address: string): Promise<IUTXO[]> {
		return this.btc.getNetworkedUTXOs(address);
	}
}

export class LocalRegtest extends BlockstackNetwork {
	constructor(apiUrl: string, broadcastServiceUrl: string, bitcoinAPI: BitcoinNetwork) {
		super(apiUrl, broadcastServiceUrl, bitcoinAPI, bitcoinjs.networks.testnet);
	}

	public getFeeRate(): Promise<number> {
		return Promise.resolve(Math.floor(0.00001 * SATOSHIS_PER_BTC));
	}
}

export class BitcoinNetwork {
	public broadcastTransaction(transaction: string): Promise<object> {
		return Promise.reject(new Error(`Not implemented, broadcastTransaction(${transaction})`));
	}
	public getBlockHeight(): Promise<number> {
		return Promise.reject(new Error('Not implemented, getBlockHeight()'));
	}
	public getTransactionInfo(txid: string): Promise<{ block_height: number }> {
		return Promise.reject(new Error(`Not implemented, getTransactionInfo(${txid})`));
	}
	public getNetworkedUTXOs(address: string): Promise<IUTXO[]> {
		return Promise.reject(new Error(`Not implemented, getNetworkedUTXOs(${address})`));
	}
}

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

	public getNetworkedUTXOs(address: string): Promise<IUTXO[]> {
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

	public getNetworkedUTXOs(address: string): Promise<IUTXO[]> {
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

	public getNetworkedUTXOs(address: string): Promise<IUTXO[]> {
		return fetch(`${this.utxoProviderUrl}/unspent?format=json&active=${address}&cors=true`)
			.then(resp => {
				if (resp.status === 500) {
					printDebug(8, 'UTXO provider returned status code 500, usually means no UTXOs: returning []');
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
					return bitcoinjs.Transaction.fromHex(transaction)
						.getHash()
						.reverse()
						.toString('hex'); // big_endian
				} else {
					throw new RemoteServiceError(resp, `Broadcast transaction failed with message: ${respText}`);
				}
			});
		});
	}
}

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
