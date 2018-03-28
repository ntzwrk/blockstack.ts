import { JsonZoneFile } from 'zone-file';

export class MissingOriginError extends Error {
	public readonly name: string = 'MissingOriginError';
	public readonly message: string = 'The given zone file is missing an "$origin" property';
	public readonly zoneFile: JsonZoneFile;

	constructor(zoneFile?: JsonZoneFile) {
		super();

		this.zoneFile = zoneFile;
	}
}
