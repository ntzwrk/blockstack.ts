export class MultiplePublicKeysNotSupportedError extends Error {
	public readonly name: string = 'MultiplePublicKeysNotSupportedError';
	public readonly message: string = 'Using multiple public keys is currently not supported';
}
