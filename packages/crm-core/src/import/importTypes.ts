// ============================================================================
// CRM IMPORT TYPES
// CSV/Excel import for leads, contacts, and other entities
// ============================================================================

export type ImportEntityType = 'leads' | 'contacts' | 'accounts' | 'deals';

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImportFieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'date' | 'number' | 'boolean';
}

export interface ImportJob {
  id: string;
  org_id: string;
  entity_type: ImportEntityType;
  file_name: string;
  file_size: number;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  duplicate_count: number;
  status: ImportStatus;
  field_mappings: ImportFieldMapping[];
  options: ImportOptions;
  errors: ImportError[];
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  duplicateCheckFields: string[];
  updateExisting: boolean;
  defaultValues: Record<string, unknown>;
  source?: string; // e.g., "Quick Rate Estimate Leads"
  tags?: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  value?: string;
  message: string;
}

export interface ImportPreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMappings: ImportFieldMapping[];
}

export interface ImportResult {
  jobId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  errors: ImportError[];
  createdIds: string[];
}

// Lead-specific import
export interface LeadImportRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  stage?: string;
  priority?: string;
  notes?: string;
  [key: string]: string | undefined;
}

// Contact-specific import
export interface ContactImportRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  account_name?: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  [key: string]: string | undefined;
}

// Website quote submission - for "Quick Rate Estimate Leads"
export interface QuoteSubmission {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  household_size: number | null;
  zip_code: string | null;
  current_insurance: string | null;
  monthly_premium: number | null;
  coverage_preference: string | null;
  primary_concern: string | null;
  contact_preference: string;
  source_page: string | null;
  source_cta: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  form_data: Record<string, unknown> | null;
  zoho_lead_id: string | null;
  zoho_sync_status: 'pending' | 'success' | 'failed' | 'retrying';
  created_at: string;
  updated_at: string;
}

export interface QuoteSubmissionFilters {
  search?: string;
  syncStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  imported?: boolean;
}
