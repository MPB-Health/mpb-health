/**
 * Parse a date string to Date object, handling various formats
 */
export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;

  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const parsed = parseDate(date);
  if (!parsed) return '';

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  }
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return parsed.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(date: Date | string): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return parsed.getTime() > Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;

  const today = new Date();
  return (
    parsed.getDate() === today.getDate() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getFullYear() === today.getFullYear()
  );
}

/**
 * Get the start of day for a date
 */
export function startOfDay(date: Date | string): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;

  const result = new Date(parsed);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of day for a date
 */
export function endOfDay(date: Date | string): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;

  const result = new Date(parsed);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;

  const result = new Date(parsed);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the difference in days between two dates
 */
export function diffInDays(date1: Date | string, date2: Date | string): number {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);

  if (!parsed1 || !parsed2) return 0;

  const diffMs = parsed1.getTime() - parsed2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return '';

  const formatter = new Intl.DateTimeFormat('en-US', options);

  if (start.getTime() === end.getTime()) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

/**
 * Get age from birth date
 */
export function getAge(birthDate: Date | string): number {
  const parsed = parseDate(birthDate);
  if (!parsed) return 0;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age--;
  }

  return age;
}
