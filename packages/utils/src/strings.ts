/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(
  text: string,
  maxLength: number,
  options: { suffix?: string; wordBoundary?: boolean } = {}
): string {
  const { suffix = '...', wordBoundary = true } = options;

  if (text.length <= maxLength) return text;

  const truncateAt = maxLength - suffix.length;

  if (wordBoundary) {
    const lastSpace = text.lastIndexOf(' ', truncateAt);
    if (lastSpace > 0) {
      return text.substring(0, lastSpace) + suffix;
    }
  }

  return text.substring(0, truncateAt) + suffix;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(text: string): string {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text: string): string {
  return text
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase())
    .slice(0, maxLength)
    .join('');
}

/**
 * Mask sensitive data with asterisks
 */
export function maskString(
  text: string,
  visibleStart: number = 0,
  visibleEnd: number = 0,
  maskChar: string = '*'
): string {
  if (text.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(text.length);
  }

  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const masked = maskChar.repeat(text.length - visibleStart - visibleEnd);

  return start + masked + end;
}

/**
 * Format a name to "Last, First" format
 */
export function formatNameLastFirst(firstName: string, lastName: string): string {
  if (!firstName && !lastName) return '';
  if (!lastName) return firstName;
  if (!firstName) return lastName;
  return `${lastName}, ${firstName}`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
