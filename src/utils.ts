import { parse as uriParse, URIComponents } from 'uri-js';

/**
 * Returns a date that's one year from now
 */
export function nextYear(): Date {
	return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
}

/**
 * Returns a date that's one month from now
 */
export function nextMonth(): Date {
	return new Date(new Date().setMonth(new Date().getMonth() + 1));
}

/**
 * Returns a date that's one hour from now
 */
export function nextHour(): Date {
	return new Date(new Date().setHours(new Date().getHours() + 1));
}

/**
 * Updates a query parameter of a URI
 *
 * @param uri The URI to update
 * @param key The key to update
 * @param value The value to update
 * @returns The updated URI
 */
export function updateQueryStringParameter(uri: string, key: string, value: string): string {
	const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
	const separator = uri.indexOf('?') !== -1 ? '&' : '?';
	if (uri.match(re)) {
		return uri.replace(re, `$1${key}=${value}$2`);
	} else {
		return `${uri}${separator}${key}=${value}`;
	}
}

/**
 * Compare two version tuples
 *
 * @param v1 The left half of the version comparison
 * @param v2 The right half of the version comparison
 * @returns True if v1 >= v2, false otherwise
 */
export function isLaterVersion(v1: string, v2: string): boolean {
	const v1tuple = v1.split('.').map(x => parseInt(x, 10));
	const v2tuple = v2.split('.').map(x => parseInt(x, 10));

	for (let index = 0; index < v2.length; index++) {
		if (index >= v1.length) {
			v2tuple.push(0);
		}
		if (v1tuple[index] < v2tuple[index]) {
			return false;
		}
	}
	return true;
}

/**
 * Generates a UUID4 (see https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random))
 *
 * @returns The generated UUID4
 */
export function makeUUID4(): string {
	let d = new Date().getTime();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		d += performance.now(); // use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = ((d + Math.random() * 16) % 16) | 0; // tslint:disable-line
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); // tslint:disable-line
	});
}

/**
 * Checks if both urls pass the same origin check & are absolute
 *
 * @param uri1 First uri to compare
 * @param uri2 Second uri to compare
 * @returns True if they are considered the same, false otherwise
 */
export function isSameOriginAbsoluteUrl(uri1: string, uri2: string): boolean {
	const parsedUri1 = uriParse(uri1);
	const parsedUri2 = uriParse(uri2);

	return (
		parsedUri1.scheme === parsedUri2.scheme &&
		parsedUri1.host === parsedUri2.host &&
		extractPort(parsedUri1) === extractPort(parsedUri2) &&
		parsedUri1.reference === 'absolute' &&
		parsedUri2.reference === 'absolute'
	);
}

/**
 * Extracts the port from a parsed uri
 *
 * @param uri The uri to extract from (parsed by `uri-js`)
 * @returns The extracted port
 */
function extractPort(uri: URIComponents): number {
	if (uri.port !== undefined) {
		return typeof uri.port === 'string' ? parseInt(uri.port, 10) : uri.port;
	}

	return uri.scheme === 'https' ? 443 : 80;
}
