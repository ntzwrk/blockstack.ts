/**
 * Available debug types
 */
export const enum DebugType {
	info = 2,
	warn = 1,
	error = 0
}

export class Logger {
	/**
	 * Debug level (this and everything more severe gets printed)
	 */
	public static debugLevel: DebugType | null = DebugType.info;

	/**
	 * Prints out debug information
	 *
	 * @param type Debug type of message
	 * @param message Message to print
	 */
	public static log(type: DebugType, message: any, ...optionalArgs: any[]) {
		if (this.debugLevel !== null && type <= this.debugLevel) {
			switch (type) {
				case DebugType.info:
					console.info(message, ...optionalArgs); // tslint:disable-line
					break;
				case DebugType.warn:
					console.warn(message, ...optionalArgs); // tslint:disable-line
					break;
				case DebugType.error:
					console.error(message, ...optionalArgs); // tslint:disable-line
					break;
			}
		}
	}
}
