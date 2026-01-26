/**
 * Parse CSV string to array of objects
 */
export function parseCSV<T = Record<string, string>>(
  csvString: string,
  options: {
    delimiter?: string;
    hasHeader?: boolean;
    transformValue?: (value: string, header: string) => any;
  } = {}
): T[] {
  const { delimiter = ',', hasHeader = true, transformValue } = options;

  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = hasHeader
    ? parseCSVLine(lines[0], delimiter)
    : lines[0].split(delimiter).map((_, i) => `col_${i}`);

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = parseCSVLine(line, delimiter);
    const obj: Record<string, any> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      obj[header] = transformValue ? transformValue(value, header) : value;
    });

    return obj as T;
  });
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Generate CSV string from array of objects
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  options: {
    headers?: string[];
    delimiter?: string;
    includeHeader?: boolean;
    transformValue?: (value: any, key: string) => string;
  } = {}
): string {
  if (data.length === 0) return '';

  const {
    headers = Object.keys(data[0]),
    delimiter = ',',
    includeHeader = true,
    transformValue,
  } = options;

  const lines: string[] = [];

  if (includeHeader) {
    lines.push(headers.map((h) => escapeCSVValue(h, delimiter)).join(delimiter));
  }

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      const stringValue = transformValue
        ? transformValue(value, header)
        : value === null || value === undefined
        ? ''
        : String(value);
      return escapeCSVValue(stringValue, delimiter);
    });
    lines.push(values.join(delimiter));
  });

  return lines.join('\n');
}

/**
 * Escape a value for CSV
 */
function escapeCSVValue(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Validate CSV headers match expected format
 */
export function validateCSVHeaders(
  csvString: string,
  expectedHeaders: string[],
  options: { caseSensitive?: boolean; delimiter?: string } = {}
): { valid: boolean; missing: string[]; extra: string[] } {
  const { caseSensitive = false, delimiter = ',' } = options;

  const firstLine = csvString.split('\n')[0];
  const actualHeaders = parseCSVLine(firstLine, delimiter);

  const normalize = (s: string) => (caseSensitive ? s.trim() : s.trim().toLowerCase());

  const normalizedExpected = expectedHeaders.map(normalize);
  const normalizedActual = actualHeaders.map(normalize);

  const missing = normalizedExpected.filter((h) => !normalizedActual.includes(h));
  const extra = normalizedActual.filter((h) => !normalizedExpected.includes(h));

  return {
    valid: missing.length === 0,
    missing: missing.map((h) => expectedHeaders[normalizedExpected.indexOf(h)]),
    extra,
  };
}
