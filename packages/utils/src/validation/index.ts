// ============================================================================
// Validation Schemas Index
// Re-exports all validation schemas and types
// ============================================================================

// Common validation schemas
export {
  // Schemas
  emailSchema,
  phoneSchema,
  nameSchema,
  firstNameSchema,
  lastNameSchema,
  uuidSchema,
  urlSchema,
  dateSchema,
  pastDateSchema,
  futureDateSchema,
  dateOfBirthSchema,
  pinSchema,
  currencySchema,
  currencyStringSchema,
  percentageSchema,
  percentageStringSchema,
  zipCodeSchema,
  stateCodeSchema,
  addressLineSchema,
  citySchema,
  addressSchema,
  passwordSchema,
  searchQuerySchema,
  paginationSchema,
  // Types
  type Email,
  type Phone,
  type Name,
  type UUID,
  type URL,
  type DateValue,
  type PIN,
  type Currency,
  type Percentage,
  type ZipCode,
  type StateCode,
  type Address,
  type Password,
  type SearchQuery,
  type Pagination,
} from './schemas';

// Healthcare-specific validation schemas
export {
  // Schemas
  ssnLastFourSchema,
  ssnFullSchema,
  memberIdSchema,
  npiSchema,
  mbiSchema,
  policyNumberSchema,
  groupNumberSchema,
  icd10Schema,
  cptSchema,
  leadSourceSchema,
  leadStatusSchema,
  leadSchema,
  memberProfileSchema,
  advisorAssignmentSchema,
  // Types
  type SSNLastFour,
  type SSNFull,
  type MemberId,
  type NPI,
  type MBI,
  type PolicyNumber,
  type GroupNumber,
  type ICD10,
  type CPT,
  type LeadSource,
  type LeadStatus,
  type Lead,
  type MemberProfile,
  type AdvisorAssignment,
} from './healthcareSchemas';

// Re-export zod for convenience
export { z } from 'zod';
