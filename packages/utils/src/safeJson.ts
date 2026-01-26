/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  defaultValue?: T
): T | undefined {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringify value to JSON with error handling
 */
export function safeJsonStringify(
  value: unknown,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string | undefined {
  try {
    return JSON.stringify(value, replacer, space);
  } catch {
    return undefined;
  }
}
