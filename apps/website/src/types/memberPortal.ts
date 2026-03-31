export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'cancelled';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type Relationship = 'spouse' | 'child' | 'parent' | 'other';
export type ClaimType = 'medical' | 'dental' | 'vision' | 'prescription' | 'other';
export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'pending_info' | 'approved' | 'partially_approved' | 'denied' | 'paid';
export type PatientType = 'member' | 'dependent';
export type DocumentCategory = 'claim' | 'coverage' | 'form' | 'medical_record' | 'id_card' | 'other';
export type AccessType = 'view' | 'download' | 'share' | 'delete';
export type PaymentType = 'credit_card' | 'debit_card' | 'bank_account' | 'ach';
export type TransactionType = 'membership_fee' | 'claim_reimbursement' | 'refund' | 'adjustment' | 'penalty';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type ProviderType = 'physician' | 'hospital' | 'clinic' | 'specialist' | 'facility' | 'other';
export type PrescriptionStatus = 'active' | 'expired' | 'cancelled' | 'completed';
export type ReminderType = 'refill' | 'take_medication' | 'appointment';
export type ConditionType = 'chronic' | 'acute' | 'resolved' | 'family_history';
export type Severity = 'mild' | 'moderate' | 'severe';
export type VisitType = 'office' | 'emergency' | 'urgent_care' | 'telehealth' | 'hospital' | 'specialist' | 'lab' | 'imaging' | 'other';
export type NotificationType =
  | 'claim_update' | 'payment_due' | 'payment_received'
  | 'document_uploaded' | 'coverage_update' | 'system_alert'
  | 'message' | 'reminder'
  | 'profile_update' | 'billing_update' | 'membership_update'
  | 'eligibility_update' | 'dependent_update' | 'account_update'
  | 'support_update' | 'operational_update';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'claims' | 'coverage' | 'general' | 'complaint';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_member' | 'waiting_staff' | 'resolved' | 'closed';
export type NoteType = 'internal' | 'member_visible' | 'system';

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  phone: boolean;
}

export interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: Gender;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  profile_photo_url?: string;
  membership_number?: string;
  membership_status: MembershipStatus;
  membership_start_date?: string;
  membership_end_date?: string;
  plan_id?: string;
  assigned_advisor_id?: string;
  preferred_language: string;
  communication_preferences: CommunicationPreferences;
  medical_conditions?: string[];
  allergies?: string[];
  medications?: string[];
  emergency_contact_consent: boolean;
  hipaa_consent: boolean;
  consent_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MemberDependent {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: Relationship;
  date_of_birth: string;
  gender?: Gender;
  ssn_last_four?: string;
  is_covered: boolean;
  coverage_start_date?: string;
  coverage_end_date?: string;
  medical_conditions?: string[];
  allergies?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  member_id: string;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  member_id: string;
  claim_number: string;
  claim_type: ClaimType;
  status: ClaimStatus;
  provider_name: string;
  provider_id?: string;
  patient_name: string;
  patient_type?: PatientType;
  dependent_id?: string;
  service_date: string;
  diagnosis_codes?: string[];
  total_amount: number;
  eligible_amount?: number;
  approved_amount?: number;
  paid_amount: number;
  denial_reason?: string;
  processing_notes?: string;
  submitted_date?: string;
  reviewed_date?: string;
  approved_date?: string;
  paid_date?: string;
  reviewed_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClaimItem {
  id: string;
  claim_id: string;
  description: string;
  procedure_code?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  eligible_amount?: number;
  approved_amount?: number;
  notes?: string;
  created_at: string;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface ClaimNote {
  id: string;
  claim_id: string;
  note_type?: NoteType;
  note: string;
  created_by?: string;
  created_at: string;
}

export interface MemberDocument {
  id: string;
  member_id: string;
  document_category: DocumentCategory;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  version: number;
  is_current: boolean;
  tags?: string[];
  expires_at?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  accessed_by: string;
  access_type: AccessType;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

export interface PaymentMethod {
  id: string;
  member_id: string;
  payment_type: PaymentType;
  is_default: boolean;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  bank_name?: string;
  account_last_four?: string;
  billing_name: string;
  billing_address?: string;
  billing_zip?: string;
  payment_token?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  member_id: string;
  transaction_type: TransactionType;
  amount: number;
  status: TransactionStatus;
  payment_method_id?: string;
  payment_gateway_id?: string;
  description?: string;
  invoice_id?: string;
  claim_id?: string;
  processed_date?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  member_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  status: InvoiceStatus;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberCoverage {
  id: string;
  member_id: string;
  plan_name: string;
  plan_type: string;
  coverage_start_date: string;
  coverage_end_date?: string;
  monthly_share_amount: number;
  annual_unshared_amount?: number;
  remaining_unshared?: number;
  lifetime_maximum?: number;
  lifetime_used: number;
  is_active: boolean;
  benefits?: Record<string, any>;
  network_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BenefitUsage {
  id: string;
  member_id: string;
  coverage_id: string;
  benefit_category: string;
  year: number;
  amount_used: number;
  amount_limit?: number;
  visits_used: number;
  visits_limit?: number;
  last_updated: string;
}

export interface CoverageDocument {
  id: string;
  coverage_id: string;
  document_type: string;
  title: string;
  file_url: string;
  effective_date?: string;
  created_at: string;
}

export interface Provider {
  id: string;
  npi?: string;
  first_name?: string;
  last_name?: string;
  practice_name: string;
  provider_type: ProviderType;
  specialties?: string[];
  phone?: string;
  email?: string;
  website?: string;
  accepts_new_patients: boolean;
  is_network: boolean;
  rating?: number;
  review_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProviderLocation {
  id: string;
  provider_id: string;
  location_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  fax?: string;
  hours_of_operation?: Record<string, any>;
  is_primary: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface ProviderReview {
  id: string;
  provider_id: string;
  member_id: string;
  rating: number;
  review_text?: string;
  visit_date?: string;
  would_recommend?: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  is_24_hour: boolean;
  has_drive_through: boolean;
  is_network: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Prescription {
  id: string;
  member_id: string;
  medication_name: string;
  dosage: string;
  quantity: number;
  refills_remaining: number;
  prescribing_provider: string;
  provider_id?: string;
  pharmacy_id?: string;
  prescription_number?: string;
  prescribed_date: string;
  filled_date?: string;
  expiration_date?: string;
  instructions?: string;
  status: PrescriptionStatus;
  is_controlled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationReminder {
  id: string;
  member_id: string;
  prescription_id?: string;
  reminder_type: ReminderType;
  reminder_date: string;
  is_sent: boolean;
  sent_at?: string;
  created_at: string;
}

export interface HealthHistory {
  id: string;
  member_id: string;
  condition_name: string;
  condition_type?: ConditionType;
  diagnosed_date?: string;
  resolved_date?: string;
  severity?: Severity;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabResult {
  id: string;
  member_id: string;
  test_name: string;
  test_category?: string;
  test_date: string;
  result_value: string;
  result_unit?: string;
  reference_range?: string;
  is_abnormal: boolean;
  ordering_provider?: string;
  lab_facility?: string;
  notes?: string;
  document_url?: string;
  created_at: string;
}

export interface Immunization {
  id: string;
  member_id: string;
  vaccine_name: string;
  vaccine_code?: string;
  administration_date: string;
  administering_provider?: string;
  lot_number?: string;
  site?: string;
  route?: string;
  dose_number?: number;
  next_dose_due?: string;
  notes?: string;
  created_at: string;
}

export interface VisitSummary {
  id: string;
  member_id: string;
  visit_date: string;
  visit_type: VisitType;
  provider_name: string;
  provider_id?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications_prescribed?: string[];
  follow_up_instructions?: string;
  next_appointment_date?: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberNotification {
  id: string;
  member_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority: Priority;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  actor_department?: string;
  category?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  source_event_id?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  member_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: Priority;
  status: TicketStatus;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  message_body: string;
  is_read: boolean;
  read_at?: string;
  parent_message_id?: string;
  attachments?: any[];
  created_at: string;
}

export interface ClaimSummary {
  total_claims: number;
  total_submitted: number;
  total_approved: number;
  total_denied: number;
  total_paid: number;
  pending_claims: number;
  year_to_date_expenses: number;
  year_to_date_reimbursed: number;
}

export interface MemberDashboardData {
  profile: MemberProfile;
  coverage: MemberCoverage;
  recent_claims: Claim[];
  unread_notifications: number;
  upcoming_appointments: VisitSummary[];
  active_prescriptions: Prescription[];
  pending_tasks: number;
  claim_summary: ClaimSummary;
}
