import { z } from 'zod';

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Email address validation schema
 * - RFC 5321 compliant
 * - Maximum 254 characters (RFC 3696)
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email must be 254 characters or less')
  .email('Please enter a valid email address')
  .transform((email) => email.toLowerCase().trim());

/**
 * Phone number validation schema
 * - Supports US format: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxxxxxxxxx
 * - Supports international format: +1xxxxxxxxxx
 * - Normalizes to E.164 format for US numbers
 */
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform((phone) => phone.replace(/[\s\-\(\)\.]/g, ''))
  .refine(
    (phone) => {
      // US format (10 digits, optionally with +1)
      if (/^\+?1?\d{10}$/.test(phone)) return true;
      // International format (starts with +, 7-15 digits)
      if (/^\+\d{7,15}$/.test(phone)) return true;
      return false;
    },
    { message: 'Please enter a valid phone number' }
  )
  .transform((phone) => {
    // Normalize US numbers to +1 format
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // Return international numbers as-is if they have +
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${digits}`;
  });

/**
 * Name validation schema
 * - Letters, spaces, hyphens, and apostrophes only
 * - 1-100 characters
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .refine(
    (name) => /^[a-zA-Z\s\-']+$/.test(name),
    { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  )
  .transform((name) => name.trim());

/**
 * First name validation schema
 */
export const firstNameSchema = nameSchema.describe('First name');

/**
 * Last name validation schema
 */
export const lastNameSchema = nameSchema.describe('Last name');

/**
 * UUID validation schema (v4)
 */
export const uuidSchema = z
  .string()
  .uuid('Please enter a valid UUID')
  .transform((uuid) => uuid.toLowerCase());

/**
 * URL validation schema
 * - HTTP/HTTPS only
 * - Maximum 2048 characters
 */
export const urlSchema = z
  .string()
  .max(2048, 'URL must be 2048 characters or less')
  .url('Please enter a valid URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  );

/**
 * Date validation schema (ISO 8601 format)
 */
export const dateSchema = z
  .string()
  .refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Please enter a valid date' }
  )
  .transform((date) => new Date(date));

/**
 * Date schema that must be in the past
 */
export const pastDateSchema = dateSchema.refine(
  (date) => date <= new Date(),
  { message: 'Date must be in the past' }
);

/**
 * Date schema that must be in the future
 */
export const futureDateSchema = dateSchema.refine(
  (date) => date >= new Date(),
  { message: 'Date must be in the future' }
);

/**
 * Date of birth schema
 * - Must be in the past
 * - Must be at least 1 year ago
 * - Must be less than 150 years ago
 */
export const dateOfBirthSchema = z
  .string()
  .refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Please enter a valid date of birth' }
  )
  .transform((date) => new Date(date))
  .refine(
    (date) => {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 150, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return date >= minDate && date <= maxDate;
    },
    { message: 'Please enter a valid date of birth' }
  );

/**
 * PIN validation schema (exactly 6 digits)
 */
export const pinSchema = z
  .string()
  .length(6, 'PIN must be exactly 6 digits')
  .refine(
    (pin) => /^\d{6}$/.test(pin),
    { message: 'PIN must contain only numbers' }
  );

/**
 * Currency amount validation schema
 * - Non-negative
 * - Maximum 999,999,999.99
 * - Up to 2 decimal places
 */
export const currencySchema = z
  .number()
  .min(0, 'Amount must be non-negative')
  .max(999999999.99, 'Amount exceeds maximum allowed')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

/**
 * Currency amount from string input
 */
export const currencyStringSchema = z
  .string()
  .transform((val) => {
    // Remove currency symbols and commas
    const cleaned = val.replace(/[$,]/g, '').trim();
    return parseFloat(cleaned);
  })
  .pipe(currencySchema);

/**
 * Percentage validation schema (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

/**
 * Percentage from string input
 */
export const percentageStringSchema = z
  .string()
  .transform((val) => {
    const cleaned = val.replace(/%/g, '').trim();
    return parseFloat(cleaned);
  })
  .pipe(percentageSchema);

/**
 * ZIP code validation schema (US)
 * - 5 digits or 5+4 format
 */
export const zipCodeSchema = z
  .string()
  .refine(
    (zip) => /^\d{5}(-\d{4})?$/.test(zip),
    { message: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)' }
  );

/**
 * State code validation schema (US)
 * - 2-letter state abbreviation
 */
export const stateCodeSchema = z
  .string()
  .length(2, 'State code must be 2 characters')
  .toUpperCase()
  .refine(
    (state) => {
      const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
      ];
      return validStates.includes(state);
    },
    { message: 'Please enter a valid US state code' }
  );

/**
 * Address line validation schema
 */
export const addressLineSchema = z
  .string()
  .min(1, 'Address is required')
  .max(200, 'Address must be 200 characters or less')
  .transform((addr) => addr.trim());

/**
 * City validation schema
 */
export const citySchema = z
  .string()
  .min(1, 'City is required')
  .max(100, 'City must be 100 characters or less')
  .transform((city) => city.trim());

/**
 * Full address schema
 */
export const addressSchema = z.object({
  line1: addressLineSchema,
  line2: addressLineSchema.optional(),
  city: citySchema,
  state: stateCodeSchema,
  zipCode: zipCodeSchema,
  country: z.string().default('US'),
});

/**
 * Password validation schema
 * - Minimum 12 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or less')
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => /\d/.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    { message: 'Password must contain at least one special character' }
  );

/**
 * Search query validation schema
 * - Sanitizes and trims input
 * - Maximum 200 characters
 */
export const searchQuerySchema = z
  .string()
  .max(200, 'Search query too long')
  .transform((query) => query.trim().replace(/[<>]/g, ''));

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type Email = z.infer<typeof emailSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Name = z.infer<typeof nameSchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type URL = z.infer<typeof urlSchema>;
export type DateValue = z.infer<typeof dateSchema>;
export type PIN = z.infer<typeof pinSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type Percentage = z.infer<typeof percentageSchema>;
export type ZipCode = z.infer<typeof zipCodeSchema>;
export type StateCode = z.infer<typeof stateCodeSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
