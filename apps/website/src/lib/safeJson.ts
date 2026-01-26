export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function safeJsonParse<T = unknown>(
  jsonString: string | null | undefined,
  fallback?: T
): SafeParseResult<T> {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      success: false,
      error: 'Invalid input: expected non-empty string',
      data: fallback,
    };
  }

  const trimmed = jsonString.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      error: 'Empty JSON string',
      data: fallback,
    };
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (parsed === null || parsed === undefined) {
      return {
        success: false,
        error: 'Parsed value is null or undefined',
        data: fallback,
      };
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';

    console.warn('[SafeJSON] Parse failed:', {
      error: errorMessage,
      preview: trimmed.substring(0, 100),
    });

    return {
      success: false,
      error: errorMessage,
      data: fallback,
    };
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback: string = '{}'
): string {
  try {
    if (value === undefined) {
      return fallback;
    }

    const result = JSON.stringify(value);

    if (result === undefined) {
      return fallback;
    }

    return result;
  } catch (error) {
    console.warn('[SafeJSON] Stringify failed:', error);
    return fallback;
  }
}

export function validateJsonStructure<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): SafeParseResult<T> {
  if (!validator(data)) {
    return {
      success: false,
      error: 'Data does not match expected structure',
    };
  }

  return {
    success: true,
    data,
  };
}
