export class GetFileError extends Error {
	public readonly name: string = 'GetFileError';
	public readonly message: string;
	public readonly path: string;
	public readonly response: Response | undefined;

	constructor(path: string, response?: Response) {
		super();

		this.message =
			response !== undefined
				? `Failed to get "${path}", HTTP status was ${response.status}`
				: `Failed to get "${path}"`;
		this.path = path;
		this.response = response;
	}
}
