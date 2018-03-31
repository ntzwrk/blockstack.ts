export class DidNotSatisfyJsonSchemaError extends Error {
	public readonly name: string = 'DidNotSatisfyJsonSchemaError';
	public readonly message: string = 'The given JSON did not satisfy the expected JSON schema';
	public readonly internalJsonSchemaId: string;
	public readonly json: any;

	constructor(internalJsonSchemaId: string, json: any) {
		super();

		this.internalJsonSchemaId = internalJsonSchemaId;
		this.json = json;
	}
}
