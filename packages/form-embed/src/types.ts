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
  width?: 'full' | 'half';
  validation?: FormFieldValidation;
  defaultValue?: string;
  content?: string;
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

export interface WebFormConfig {
  id: string;
  name: string;
  slug: string;
  fields: FormField[];
  styling: FormStyling;
  status: string;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface MPBFormEmbedProps {
  /** CRM web form ID */
  formId?: string;
  /** CRM web form slug — alternative to formId */
  slug?: string;
  /** Supabase project URL (e.g. https://xyz.supabase.co) */
  supabaseUrl: string;
  /** Supabase anon key for public API access */
  supabaseAnonKey: string;
  /** Override the source_url reported with the submission */
  sourceUrl?: string;
  /** Extra static data merged into every submission */
  extraData?: Record<string, string>;
  /** Callback fired after successful submission */
  onSuccess?: (submissionId: string) => void;
  /** Callback fired on submission error */
  onError?: (error: string) => void;
  /** CSS class name applied to the outer wrapper */
  className?: string;
}
