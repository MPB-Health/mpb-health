/** Sanitize search input for use in PostgREST .or() filter strings.
 *  Strips characters that could break filter syntax. */
export function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_.,()\\]/g, '').trim();
}
