export class RemoteServiceError extends Error {
	public readonly name: string = 'RemoteServiceError';
	public readonly message: string;
	public readonly response: Response;

	constructor(response: Response, message?: string) {
		super(message);

		this.message = message !== undefined ? message : 'The used remote service reported an error';
		this.response = response;
	}
}
