import * as bigi from 'bigi';
import * as bitcoin from 'bitcoinjs-lib';

import { loadUserData } from '../auth';
import { BLOCKSTACK_DEFAULT_GAIA_HUB_URL, BLOCKSTACK_GAIA_HUB_LABEL, BLOCKSTACK_STORAGE_LABEL } from '../constants';
import { DebugType, Logger } from '../debug';

export interface IGaiaHubConfig {
	address: string;
	url_prefix: string;
	token: string;
	server: string;
}

export function uploadToGaiaHub(
	filename: string,
	contents: any,
	hubConfig: IGaiaHubConfig,
	contentType: string = 'application/octet-stream'
): Promise<any> {
	return new Promise(resolve => {
		Logger.log(DebugType.info, `uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`);
		return fetch(`${hubConfig.server}/store/${hubConfig.address}/${filename}`, {
			body: contents,
			headers: {
				Authorization: `bearer ${hubConfig.token}`,
				'Content-Type': contentType
			},
			method: 'POST'
		})
			.then(response => response.text())
			.then(responseText => JSON.parse(responseText))
			.then(responseJSON => {
				resolve(responseJSON.publicURL);
			});
	});
}

export function getFullReadUrl(filename: string, hubConfig: IGaiaHubConfig): string {
	return `${hubConfig.url_prefix}${hubConfig.address}/${filename}`;
}

export function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string): Promise<IGaiaHubConfig> {
	Logger.log(DebugType.info, `connectToGaiaHub: ${gaiaHubUrl}/hub_info`);
	const challengeSigner = new bitcoin.ECPair(bigi.fromHex(challengeSignerHex));
	return new Promise(resolve => {
		fetch(`${gaiaHubUrl}/hub_info`)
			.then(response => response.text())
			.then(responseText => JSON.parse(responseText))
			.then(responseJSON => {
				const readURL = responseJSON.read_url_prefix;
				const challenge = responseJSON.challenge_text;
				const digest = bitcoin.crypto.sha256(challenge);
				const signature = challengeSigner
					.sign(digest)
					.toDER()
					.toString('hex');
				const publickey = challengeSigner.getPublicKeyBuffer().toString('hex');
				const token = new Buffer(JSON.stringify({ publickey, signature })).toString('base64');
				const address = challengeSigner.getAddress();
				resolve({
					address,
					server: gaiaHubUrl,
					token,
					url_prefix: readURL
				});
			});
	});
}

/**
 * These two functions are app-specific connections to gaia hub,
 *   they read the user data object for information on setting up
 *   a hub connection, and store the hub config to localstorage
 * @private
 * @returns {Promise} that resolves to the new gaia hub connection
 */
export function setLocalGaiaHubConnection(): Promise<IGaiaHubConfig> {
	let userData = loadUserData();

	if (!userData.hubUrl) {
		userData.hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL;

		window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData));

		userData = loadUserData();
	}

	return connectToGaiaHub(userData.hubUrl, userData.appPrivateKey).then(gaiaConfig => {
		localStorage.setItem(BLOCKSTACK_GAIA_HUB_LABEL, JSON.stringify(gaiaConfig));
		return gaiaConfig;
	});
}

export function getOrSetLocalGaiaHubConnection(): Promise<IGaiaHubConfig> {
	const storedContent = localStorage.getItem(BLOCKSTACK_GAIA_HUB_LABEL);
	if (storedContent !== null) {
		const hubConfig = JSON.parse(storedContent) as IGaiaHubConfig;
		return new Promise(resolve => resolve(hubConfig));
	} else {
		return setLocalGaiaHubConnection();
	}
}

export function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string> {
	Logger.log(DebugType.info, `connectToGaiaHub: ${gaiaHubUrl}/hub_info`);
	const challengeSigner = new bitcoin.ECPair(bigi.fromHex(appPrivateKey));
	return new Promise(resolve => {
		fetch(`${gaiaHubUrl}/hub_info`)
			.then(response => response.text())
			.then(responseText => JSON.parse(responseText))
			.then(responseJSON => {
				const readURL = responseJSON.read_url_prefix;
				const address = challengeSigner.getAddress();
				const bucketUrl = `${readURL}${address}/`;
				resolve(bucketUrl);
			});
	});
}
