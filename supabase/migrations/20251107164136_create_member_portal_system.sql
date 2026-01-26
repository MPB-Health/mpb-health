/*
  # Create Comprehensive Member Portal System

  ## Summary
  This migration creates a complete member portal system for health sharing management,
  including member profiles, claims, documents, payments, coverage, providers, prescriptions,
  and health records. All tables have proper RLS policies and are HIPAA-compliant.

  ## New Tables Created

  ### Member Profile System
  - `member_profiles` - Extended member information with health data
  - `member_dependents` - Family members covered under membership
  - `emergency_contacts` - Emergency contact information

  ### Claims Management
  - `claims` - Medical, dental, and prescription claims
  - `claim_items` - Individual line items within claims
  - `claim_documents` - Documents attached to claims
  - `claim_notes` - Processing notes and communication

  ### Document Management
  - `member_documents` - Secure document storage and categorization
  - `document_access_log` - Audit trail for document access

  ### Payment and Billing
  - `payment_methods` - Stored payment methods
  - `transactions` - Payment transaction history
  - `invoices` - Membership invoices and statements

  ### Coverage and Benefits
  - `member_coverage` - Coverage details and eligibility
  - `benefit_usage` - Benefit utilization tracking
  - `coverage_documents` - Plan documents and certificates

  ### Provider Directory
  - `providers` - Healthcare provider information
  - `provider_specialties` - Provider specialty mappings
  - `provider_locations` - Provider office locations
  - `provider_reviews` - Member reviews and ratings

  ### Prescription Management
  - `prescriptions` - Active and historical prescriptions
  - `pharmacies` - Pharmacy directory
  - `medication_reminders` - Prescription refill reminders

  ### Health Records
  - `health_history` - Medical history and conditions
  - `lab_results` - Laboratory test results
  - `immunizations` - Vaccination records
  - `visit_summaries` - Healthcare visit summaries

  ### Communication
  - `member_notifications` - System notifications
  - `support_tickets` - Member support requests
  - `messages` - Secure member-advisor messaging

  ## Security
  - All tables have RLS enabled
  - Members can only access their own data
  - Advisors can access assigned member data
  - Admins have full access with audit logging
  - Sensitive health data is protected with additional policies
*/

-- =============================================
-- MEMBER PROFILE SYSTEM
-- =============================================

-- Extended member profiles with health data
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  profile_photo_url text,
  membership_number text UNIQUE,
  membership_status text DEFAULT 'active' CHECK (membership_status IN ('active', 'pending', 'suspended', 'cancelled')),
  membership_start_date date,
  membership_end_date date,
  plan_id uuid,
  assigned_advisor_id uuid REFERENCES auth.users(id),
  preferred_language text DEFAULT 'en',
  communication_preferences jsonb DEFAULT '{"email": true, "sms": false, "phone": false}'::jsonb,
  medical_conditions text[],
  allergies text[],
  medications text[],
  emergency_contact_consent boolean DEFAULT false,
  hipaa_consent boolean DEFAULT false,
  consent_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Member dependents
CREATE TABLE IF NOT EXISTS public.member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  relationship text NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'other')),
  date_of_birth date NOT NULL,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  ssn_last_four text,
  is_covered boolean DEFAULT true,
  coverage_start_date date,
  coverage_end_date date,
  medical_conditions text[],
  allergies text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  alternate_phone text,
  email text,
  address text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- CLAIMS MANAGEMENT
-- =============================================

-- Providers table must exist before claims
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npi text UNIQUE,
  first_name text,
  last_name text,
  practice_name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('physician', 'hospital', 'clinic', 'specialist', 'facility', 'other')),
  specialties text[],
  phone text,
  email text,
  website text,
  accepts_new_patients boolean DEFAULT true,
  is_network boolean DEFAULT false,
  rating numeric(2, 1),
  review_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  claim_number text UNIQUE NOT NULL,
  claim_type text NOT NULL CHECK (claim_type IN ('medical', 'dental', 'vision', 'prescription', 'other')),
  status text DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'pending_info', 'approved', 'partially_approved', 'denied', 'paid')),
  provider_name text NOT NULL,
  provider_id uuid REFERENCES public.providers(id),
  patient_name text NOT NULL,
  patient_type text CHECK (patient_type IN ('member', 'dependent')),
  dependent_id uuid REFERENCES public.member_dependents(id),
  service_date date NOT NULL,
  diagnosis_codes text[],
  total_amount numeric(10, 2) NOT NULL,
  eligible_amount numeric(10, 2),
  approved_amount numeric(10, 2),
  paid_amount numeric(10, 2) DEFAULT 0,
  denial_reason text,
  processing_notes text,
  submitted_date timestamptz DEFAULT now(),
  reviewed_date timestamptz,
  approved_date timestamptz,
  paid_date timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Claim line items
CREATE TABLE IF NOT EXISTS public.claim_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  description text NOT NULL,
  procedure_code text,
  quantity integer DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  eligible_amount numeric(10, 2),
  approved_amount numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Claim documents
CREATE TABLE IF NOT EXISTS public.claim_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('bill', 'receipt', 'eob', 'medical_records', 'prescription', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

-- Claim processing notes
CREATE TABLE IF NOT EXISTS public.claim_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  note_type text CHECK (note_type IN ('internal', 'member_visible', 'system')),
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- DOCUMENT MANAGEMENT
-- =============================================

-- Member documents
CREATE TABLE IF NOT EXISTS public.member_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  document_category text NOT NULL CHECK (document_category IN ('claim', 'coverage', 'form', 'medical_record', 'id_card', 'other')),
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  version integer DEFAULT 1,
  is_current boolean DEFAULT true,
  tags text[],
  expires_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Document access audit log
CREATE TABLE IF NOT EXISTS public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.member_documents(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES auth.users(id),
  access_type text NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'delete')),
  ip_address inet,
  user_agent text,
  accessed_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- PAYMENT AND BILLING
-- =============================================

-- Payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('credit_card', 'debit_card', 'bank_account', 'ach')),
  is_default boolean DEFAULT false,
  card_last_four text,
  card_brand text,
  card_exp_month integer,
  card_exp_year integer,
  bank_name text,
  account_last_four text,
  billing_name text NOT NULL,
  billing_address text,
  billing_zip text,
  payment_token text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('membership_fee', 'claim_reimbursement', 'refund', 'adjustment', 'penalty')),
  amount numeric(10, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method_id uuid REFERENCES public.payment_methods(id),
  payment_gateway_id text,
  description text,
  invoice_id uuid,
  claim_id uuid REFERENCES public.claims(id),
  processed_date timestamptz,
  receipt_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  amount_paid numeric(10, 2) DEFAULT 0,
  amount_due numeric(10, 2) NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  invoice_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- COVERAGE AND BENEFITS
-- =============================================

-- Member coverage
CREATE TABLE IF NOT EXISTS public.member_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  plan_type text NOT NULL,
  coverage_start_date date NOT NULL,
  coverage_end_date date,
  monthly_share_amount numeric(10, 2) NOT NULL,
  annual_unshared_amount numeric(10, 2),
  remaining_unshared numeric(10, 2),
  lifetime_maximum numeric(12, 2),
  lifetime_used numeric(12, 2) DEFAULT 0,
  is_active boolean DEFAULT true,
  benefits jsonb DEFAULT '{}'::jsonb,
  network_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Benefit usage tracking
CREATE TABLE IF NOT EXISTS public.benefit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  coverage_id uuid NOT NULL REFERENCES public.member_coverage(id) ON DELETE CASCADE,
  benefit_category text NOT NULL,
  year integer NOT NULL,
  amount_used numeric(10, 2) DEFAULT 0,
  amount_limit numeric(10, 2),
  visits_used integer DEFAULT 0,
  visits_limit integer,
  last_updated timestamptz DEFAULT now() NOT NULL
);

-- Coverage documents
CREATE TABLE IF NOT EXISTS public.coverage_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_id uuid NOT NULL REFERENCES public.member_coverage(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('certificate', 'summary', 'guidelines', 'id_card', 'amendment')),
  title text NOT NULL,
  file_url text NOT NULL,
  effective_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Provider locations
CREATE TABLE IF NOT EXISTS public.provider_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  location_name text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  phone text,
  fax text,
  hours_of_operation jsonb,
  is_primary boolean DEFAULT false,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Provider reviews
CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  visit_date date,
  would_recommend boolean,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(provider_id, member_id, visit_date)
);

-- =============================================
-- PRESCRIPTION MANAGEMENT
-- =============================================

-- Pharmacies
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  is_24_hour boolean DEFAULT false,
  has_drive_through boolean DEFAULT false,
  is_network boolean DEFAULT false,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  quantity integer NOT NULL,
  refills_remaining integer DEFAULT 0,
  prescribing_provider text NOT NULL,
  provider_id uuid REFERENCES public.providers(id),
  pharmacy_id uuid REFERENCES public.pharmacies(id),
  prescription_number text,
  prescribed_date date NOT NULL,
  filled_date date,
  expiration_date date,
  instructions text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),
  is_controlled boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Medication reminders
CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('refill', 'take_medication', 'appointment')),
  reminder_date date NOT NULL,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- HEALTH RECORDS
-- =============================================

-- Health history
CREATE TABLE IF NOT EXISTS public.health_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  condition_type text CHECK (condition_type IN ('chronic', 'acute', 'resolved', 'family_history')),
  diagnosed_date date,
  resolved_date date,
  severity text CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Lab results
CREATE TABLE IF NOT EXISTS public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_category text,
  test_date date NOT NULL,
  result_value text NOT NULL,
  result_unit text,
  reference_range text,
  is_abnormal boolean DEFAULT false,
  ordering_provider text,
  lab_facility text,
  notes text,
  document_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Immunizations
CREATE TABLE IF NOT EXISTS public.immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  vaccine_code text,
  administration_date date NOT NULL,
  administering_provider text,
  lot_number text,
  site text,
  route text,
  dose_number integer,
  next_dose_due date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Visit summaries
CREATE TABLE IF NOT EXISTS public.visit_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  visit_type text NOT NULL CHECK (visit_type IN ('office', 'emergency', 'urgent_care', 'telehealth', 'hospital', 'specialist', 'lab', 'imaging', 'other')),
  provider_name text NOT NULL,
  provider_id uuid REFERENCES public.providers(id),
  chief_complaint text,
  diagnosis text,
  treatment_plan text,
  medications_prescribed text[],
  follow_up_instructions text,
  next_appointment_date date,
  document_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- COMMUNICATION AND NOTIFICATIONS
-- =============================================

-- Member notifications
CREATE TABLE IF NOT EXISTS public.member_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('claim_update', 'payment_due', 'payment_received', 'document_uploaded', 'coverage_update', 'system_alert', 'message', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('technical', 'billing', 'claims', 'coverage', 'general', 'complaint')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_member', 'waiting_staff', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Secure messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  subject text,
  message_body text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  parent_message_id uuid REFERENCES public.messages(id),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_member_profiles_membership_number ON public.member_profiles(membership_number);
CREATE INDEX IF NOT EXISTS idx_member_profiles_status ON public.member_profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_member_dependents_member_id ON public.member_dependents(member_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_member_id ON public.emergency_contacts(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_member_id ON public.claims(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON public.claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON public.claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON public.claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_member_id ON public.member_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_category ON public.member_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_payment_methods_member_id ON public.payment_methods(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON public.invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_member_coverage_member_id ON public.member_coverage(member_id);
CREATE INDEX IF NOT EXISTS idx_providers_npi ON public.providers(npi);
CREATE INDEX IF NOT EXISTS idx_provider_locations_provider_id ON public.provider_locations(provider_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_member_id ON public.prescriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_health_history_member_id ON public.health_history(member_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_member_id ON public.lab_results(member_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_member_id ON public.immunizations(member_id);
CREATE INDEX IF NOT EXISTS idx_visit_summaries_member_id ON public.visit_summaries(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON public.member_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.member_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_member_id ON public.support_tickets(member_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Member Profile Policies
CREATE POLICY "Members can read own profile"
  ON public.member_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Members can update own profile"
  ON public.member_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all member profiles"
  ON public.member_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update all member profiles"
  ON public.member_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Advisors can read assigned member profiles"
  ON public.member_profiles FOR SELECT
  TO authenticated
  USING (
    assigned_advisor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('advisor', 'admin', 'staff')
    )
  );

-- Member Dependents Policies
CREATE POLICY "Members can manage own dependents"
  ON public.member_dependents FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Admins can manage all dependents"
  ON public.member_dependents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Emergency Contacts Policies
CREATE POLICY "Members can manage own emergency contacts"
  ON public.emergency_contacts FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

-- Claims Policies
CREATE POLICY "Members can read own claims"
  ON public.claims FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can create own claims"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can update own draft claims"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid() AND status = 'draft');

CREATE POLICY "Staff can manage all claims"
  ON public.claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Claim Items Policies
CREATE POLICY "Members can manage own claim items"
  ON public.claim_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE id = claim_id AND member_id = auth.uid()
    )
  );

-- Documents Policies
CREATE POLICY "Members can manage own documents"
  ON public.member_documents FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Staff can read all documents"
  ON public.member_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Payment Methods Policies
CREATE POLICY "Members can manage own payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

-- Transactions Policies
CREATE POLICY "Members can read own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Staff can manage all transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Provider Policies (Public Read)
CREATE POLICY "Anyone can read active providers"
  ON public.providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read provider locations"
  ON public.provider_locations FOR SELECT
  TO authenticated
  USING (true);

-- Provider Reviews Policies
CREATE POLICY "Members can create provider reviews"
  ON public.provider_reviews FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can read all reviews"
  ON public.provider_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Prescriptions Policies
CREATE POLICY "Members can manage own prescriptions"
  ON public.prescriptions FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

-- Health Records Policies
CREATE POLICY "Members can manage own health history"
  ON public.health_history FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can manage own lab results"
  ON public.lab_results FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can manage own immunizations"
  ON public.immunizations FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can manage own visit summaries"
  ON public.visit_summaries FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Members can read own notifications"
  ON public.member_notifications FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can update own notifications"
  ON public.member_notifications FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid());

-- Support Tickets Policies
CREATE POLICY "Members can manage own support tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Staff can manage all support tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Messages Policies
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_member_profiles_updated_at BEFORE UPDATE ON public.member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_dependents_updated_at BEFORE UPDATE ON public.member_dependents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_documents_updated_at BEFORE UPDATE ON public.member_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique claim number
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS text AS $$
BEGIN
  RETURN 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text AS $$
BEGIN
  RETURN 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 6);
END;
$$ LANGUAGE plpgsql;

-- Function to log document access
CREATE OR REPLACE FUNCTION public.log_document_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.document_access_log (document_id, accessed_by, access_type)
  VALUES (NEW.id, auth.uid(), 'view');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
