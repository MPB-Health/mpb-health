// Formatters
export { formatCurrency, formatPhone, formatDate, formatNumber } from './formatters';

// Validators
export { isValidEmail, isValidPhone, isValidZipCode } from './validators';

// CSV utilities
export { parseCSV, generateCSV, downloadCSV } from './csv';

// Safe utilities
export { safeJsonParse, safeJsonStringify } from './safeJson';
export { safeLocalStorage, safeSessionStorage } from './safeStorage';

// Sanitization (DOMPurify-based and utility functions)
export {
  sanitizeHtml,
  escapeHtml,
  sanitizeInput,
  stripHtml,
  sanitizeFilename,
  sanitizeSlug,
  sanitizeRichText,
  sanitizePHI,
  sanitizeUrl,
  detectXSSPatterns,
  sanitizeWithDetection,
  type XSSDetectionResult,
} from './sanitizer';

// String utilities
export { slugify, truncate, capitalize } from './strings';

// Date utilities
export { parseDate, formatRelativeTime, isDateInPast, isDateInFuture } from './dates';

// Logger
export { logger, createClientLogger, type LogLevel } from './logger';

// Async / timeouts (portal-critical fetch hygiene)
export { TimeoutError, isTimeoutError, withTimeout, abortAfterMs } from './async';

// Portal diagnostics (CustomEvent + dev console thresholds; wire to APM in apps)
export {
  emitPortalDiagnostic,
  subscribePortalDiagnostics,
  PORTAL_DIAG_THRESHOLDS,
  type PortalDiagnosticKind,
  type PortalDiagnosticPayload,
} from './portalDiagnostics';

// Validation schemas (Zod-based)
export * from './validation';
