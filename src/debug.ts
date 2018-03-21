/**
 * Available debug types
 */
export const enum DebugType {
	info = 2,
	warn = 1,
	error = 0
}

/**
 * Debug level (this and everything more severe gets printed)
 */
let DEBUG_LEVEL: DebugType | null = DebugType.info;

/**
 * Prints out debug information
 *
 * @param type Debug type of message
 * @param message Message to print
 */
export function log(type: DebugType, message: any, ...optionalArgs: any[]) {
	if (DEBUG_LEVEL !== null && type <= DEBUG_LEVEL) {
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
