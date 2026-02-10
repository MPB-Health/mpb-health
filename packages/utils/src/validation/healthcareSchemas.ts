import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  firstNameSchema,
  lastNameSchema,
  addressSchema,
  dateOfBirthSchema,
} from './schemas';

// ============================================================================
// Healthcare-Specific Validation Schemas
// ============================================================================

/**
 * SSN last 4 digits validation schema
 * - Exactly 4 digits
 * - No common invalid patterns (0000, 1234)
 */
export const ssnLastFourSchema = z
  .string()
  .length(4, 'SSN last 4 must be exactly 4 digits')
  .refine(
    (ssn) => /^\d{4}$/.test(ssn),
    { message: 'SSN last 4 must contain only numbers' }
  )
  .refine(
    (ssn) => !['0000', '1234', '4321', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(ssn),
    { message: 'Please enter a valid SSN last 4 digits' }
  );

/**
 * Full SSN validation schema (for internal use only - HIPAA sensitive)
 * - Format: XXX-XX-XXXX
 * - Validates area number (001-899, excluding 666)
 * - Validates group number (01-99)
 * - Validates serial number (0001-9999)
 */
export const ssnFullSchema = z
  .string()
  .transform((ssn) => ssn.replace(/[-\s]/g, ''))
  .refine(
    (ssn) => /^\d{9}$/.test(ssn),
    { message: 'SSN must be 9 digits' }
  )
  .refine(
    (ssn) => {
      const area = parseInt(ssn.substring(0, 3), 10);
      const group = parseInt(ssn.substring(3, 5), 10);
      const serial = parseInt(ssn.substring(5, 9), 10);

      // Area number validation (001-899, excluding 666)
      if (area < 1 || area > 899 || area === 666) return false;
      // Group number validation (01-99)
      if (group < 1 || group > 99) return false;
      // Serial number validation (0001-9999)
      if (serial < 1 || serial > 9999) return false;

      return true;
    },
    { message: 'Please enter a valid Social Security Number' }
  )
  .transform((ssn) => `${ssn.substring(0, 3)}-${ssn.substring(3, 5)}-${ssn.substring(5, 9)}`);

/**
 * MPB Health Member ID validation schema
 * - Format: MPB-XXXXXXXX (8 alphanumeric characters)
 * - Case insensitive, normalized to uppercase
 */
export const memberIdSchema = z
  .string()
  .transform((id) => id.toUpperCase().replace(/[\s-]/g, ''))
  .refine(
    (id) => /^MPB[A-Z0-9]{8}$/.test(id) || /^[A-Z0-9]{8}$/.test(id),
    { message: 'Please enter a valid member ID (e.g., MPB-12345678)' }
  )
  .transform((id) => {
    // Normalize to MPB-XXXXXXXX format
    if (id.startsWith('MPB')) {
      return `MPB-${id.substring(3)}`;
    }
    return `MPB-${id}`;
  });

/**
 * National Provider Identifier (NPI) validation schema
 * - 10-digit number
 * - Luhn algorithm checksum validation
 */
export const npiSchema = z
  .string()
  .transform((npi) => npi.replace(/[\s-]/g, ''))
  .refine(
    (npi) => /^\d{10}$/.test(npi),
    { message: 'NPI must be exactly 10 digits' }
  )
  .refine(
    (npi) => {
      // NPI Luhn checksum validation
      // Prefix with 80840 (CMS prefix) and validate Luhn
      const prefixed = '80840' + npi;
      let sum = 0;
      let isEven = false;

      for (let i = prefixed.length - 1; i >= 0; i--) {
        let digit = parseInt(prefixed[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0;
    },
    { message: 'Please enter a valid NPI number' }
  );

/**
 * Medicare Beneficiary Identifier (MBI) validation schema
 * - Format: 1AA2-AA3-AA45
 * - Position rules: C A AN N A AN A N A AN N
 * - C = 1-9, A = A-Z (except S,L,O,I,B,Z), AN = alphanumeric (except S,L,O,I,B,Z), N = 0-9
 */
export const mbiSchema = z
  .string()
  .toUpperCase()
  .transform((mbi) => mbi.replace(/[\s-]/g, ''))
  .refine(
    (mbi) => /^[1-9][AC-HJ-KM-NP-RT-Y][AC-HJ-KM-NP-RT-Y0-9]\d[AC-HJ-KM-NP-RT-Y][AC-HJ-KM-NP-RT-Y0-9][AC-HJ-KM-NP-RT-Y]\d[AC-HJ-KM-NP-RT-Y][AC-HJ-KM-NP-RT-Y0-9]\d$/.test(mbi),
    { message: 'Please enter a valid Medicare Beneficiary Identifier' }
  )
  .transform((mbi) => `${mbi.substring(0, 4)}-${mbi.substring(4, 7)}-${mbi.substring(7, 11)}`);

/**
 * Insurance policy number validation schema
 * - Alphanumeric, 5-30 characters
 */
export const policyNumberSchema = z
  .string()
  .min(5, 'Policy number must be at least 5 characters')
  .max(30, 'Policy number must be 30 characters or less')
  .refine(
    (policy) => /^[A-Z0-9]+$/i.test(policy),
    { message: 'Policy number can only contain letters and numbers' }
  )
  .transform((policy) => policy.toUpperCase());

/**
 * Insurance group number validation schema
 * - Alphanumeric, 2-20 characters
 */
export const groupNumberSchema = z
  .string()
  .min(2, 'Group number must be at least 2 characters')
  .max(20, 'Group number must be 20 characters or less')
  .refine(
    (group) => /^[A-Z0-9]+$/i.test(group),
    { message: 'Group number can only contain letters and numbers' }
  )
  .transform((group) => group.toUpperCase());

/**
 * ICD-10 diagnosis code validation schema
 * - Format: A00-Z99 with optional decimal
 */
export const icd10Schema = z
  .string()
  .toUpperCase()
  .refine(
    (code) => /^[A-Z]\d{2}(\.\d{1,4})?$/.test(code),
    { message: 'Please enter a valid ICD-10 code (e.g., J06.9)' }
  );

/**
 * CPT procedure code validation schema
 * - 5 digits, optionally with modifier
 */
export const cptSchema = z
  .string()
  .refine(
    (code) => /^\d{5}(-\d{2})?$/.test(code),
    { message: 'Please enter a valid CPT code (e.g., 99213 or 99213-25)' }
  );

/**
 * Lead source validation schema
 */
export const leadSourceSchema = z.enum([
  'website',
  'referral',
  'phone',
  'email',
  'event',
  'partner',
  'advertisement',
  'social_media',
  'other',
]);

/**
 * Lead status validation schema
 */
export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'dormant',
]);

/**
 * Complete lead form validation schema
 */
export const leadSchema = z.object({
  // Contact Information
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,

  // Address (optional)
  address: addressSchema.optional(),

  // Lead Details
  source: leadSourceSchema,
  status: leadStatusSchema.default('new'),

  // Optional fields
  dateOfBirth: dateOfBirthSchema.optional(),
  ssn_last_four: ssnLastFourSchema.optional(),
  memberId: memberIdSchema.optional(),

  // Notes and metadata
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),

  // Consent
  consentGiven: z.boolean().refine(
    (consent) => consent === true,
    { message: 'You must consent to continue' }
  ),
  consentTimestamp: z.date().optional(),
});

/**
 * Member profile schema
 */
export const memberProfileSchema = z.object({
  memberId: memberIdSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dateOfBirthSchema,
  ssn_last_four: ssnLastFourSchema.optional(),
  address: addressSchema.optional(),

  // Insurance information
  insuranceCarrier: z.string().max(100).optional(),
  policyNumber: policyNumberSchema.optional(),
  groupNumber: groupNumberSchema.optional(),

  // Medicare specific
  mbi: mbiSchema.optional(),

  // Provider information
  primaryCareNpi: npiSchema.optional(),

  // Status
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('pending'),
  enrollmentDate: z.date().optional(),
});

/**
 * Advisor assignment schema
 */
export const advisorAssignmentSchema = z.object({
  memberId: memberIdSchema,
  advisorId: z.string().uuid(),
  assignmentType: z.enum(['primary', 'secondary', 'temporary']),
  startDate: z.date(),
  endDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// Type exports
export type SSNLastFour = z.infer<typeof ssnLastFourSchema>;
export type SSNFull = z.infer<typeof ssnFullSchema>;
export type MemberId = z.infer<typeof memberIdSchema>;
export type NPI = z.infer<typeof npiSchema>;
export type MBI = z.infer<typeof mbiSchema>;
export type PolicyNumber = z.infer<typeof policyNumberSchema>;
export type GroupNumber = z.infer<typeof groupNumberSchema>;
export type ICD10 = z.infer<typeof icd10Schema>;
export type CPT = z.infer<typeof cptSchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;
export type LeadStatus = z.infer<typeof leadStatusSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type MemberProfile = z.infer<typeof memberProfileSchema>;
export type AdvisorAssignment = z.infer<typeof advisorAssignmentSchema>;
