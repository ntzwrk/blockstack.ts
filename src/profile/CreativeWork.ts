import { Profile } from './Profile';
import { CreativeWork as CreativeWorkJson } from './schemas/CreativeWork.json';

export class CreativeWork extends Profile implements CreativeWorkJson {
	public static fromJSON(creativeWorkJson: CreativeWorkJson): Profile {
		return new CreativeWork(creativeWorkJson['@id']);
	}

	constructor(id: string) {
		super(id, 'CreativeWork');
	}

	public toJSON(): CreativeWorkJson {
		return { ...(this as CreativeWorkJson) };
	}
}
