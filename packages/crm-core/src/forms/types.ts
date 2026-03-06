// =============================================================================
// Web Form Builder Types
// =============================================================================

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'hidden'
  | 'heading'
  | 'paragraph';

export type FormStatus = 'draft' | 'active' | 'archived';
export type FormEntityType = 'lead' | 'contact';
export type SubmissionStatus = 'new' | 'converted' | 'duplicate' | 'spam';
export type DuplicateHandling = 'create_new' | 'update' | 'skip';
export type FieldWidth = 'full' | 'half';

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  width?: FieldWidth;
  validation?: FormFieldValidation;
  /** For hidden fields */
  defaultValue?: string;
  /** For heading/paragraph - the content text */
  content?: string;
}

export interface FormSettings {
  redirectUrl?: string;
  notificationEmail?: string;
  autoResponseEnabled?: boolean;
  autoResponseSubject?: string;
  autoResponseBody?: string;
  duplicateHandling?: DuplicateHandling;
  tags?: string[];
  assignTo?: string;
}

export interface FormStyling {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  buttonText?: string;
  headerText?: string;
  descriptionText?: string;
  successMessage?: string;
  logoUrl?: string;
}

export interface WebForm {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  slug: string;
  entity_type: FormEntityType;
  status: FormStatus;
  fields: FormField[];
  settings: FormSettings;
  styling: FormStyling;
  submit_count: number;
  last_submission_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebFormCreateInput {
  name: string;
  description?: string;
  slug: string;
  entity_type?: FormEntityType;
  status?: FormStatus;
  fields?: FormField[];
  settings?: FormSettings;
  styling?: FormStyling;
}

export interface WebFormUpdateInput {
  name?: string;
  description?: string;
  slug?: string;
  entity_type?: FormEntityType;
  status?: FormStatus;
  fields?: FormField[];
  settings?: FormSettings;
  styling?: FormStyling;
}

export interface WebFormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  source_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  lead_id: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export interface SubmissionFilters {
  status?: SubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface FormAnalytics {
  totalSubmissions: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  conversionRate: number;
  submissionsByDay: { date: string; count: number }[];
}
