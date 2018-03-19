/**
 * Debug level (none: 0, full: 10)
 */
const DEBUG_LEVEL = 10;

/**
 * Prints out debug information
 *
 * @param importance Level of importance (0: important, 10: less important)
 * @param message Message to print
 */
export function printDebug(importance: number, message: any, ...optionalArgs: any[]) {
	if (importance < DEBUG_LEVEL) {
		console.log(message, ...optionalArgs);
	}
}
