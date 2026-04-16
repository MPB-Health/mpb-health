import { supabase } from './supabase';
import type {
  MemberProfile,
  MemberDependent,
  EmergencyContact,
  Claim,
  ClaimItem,
  MemberDocument,
  PaymentMethod,
  Transaction,
  Invoice,
  MemberCoverage,
  Provider,
  ProviderLocation,
  Prescription,
  HealthHistory,
  LabResult,
  Immunization,
  VisitSummary,
  MemberNotification,
  SupportTicket,
  MemberDashboardData,
  ClaimSummary
} from '../types/memberPortal';

export const memberPortalService = {
  async getMemberProfile(userId: string): Promise<MemberProfile | null> {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id, first_name, last_name, date_of_birth, gender, phone, address_line1, address_line2, city, state, zip_code, country, profile_photo_url, membership_number, membership_status, membership_start_date, membership_end_date, plan_id, assigned_advisor_id, preferred_language, communication_preferences, medical_conditions, allergies, medications, emergency_contact_consent, hipaa_consent, consent_date, metadata, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member profile:', error);
      return null;
    }

    return data as any;
  },

  async updateMemberProfile(userId: string, updates: Partial<MemberProfile>): Promise<MemberProfile | null> {
    const { data, error } = await supabase
      .from('member_profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, first_name, last_name, date_of_birth, gender, phone, address_line1, address_line2, city, state, zip_code, country, profile_photo_url, membership_number, membership_status, membership_start_date, membership_end_date, plan_id, assigned_advisor_id, preferred_language, communication_preferences, medical_conditions, allergies, medications, emergency_contact_consent, hipaa_consent, consent_date, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating member profile:', error);
      return null;
    }

    return data as any;
  },

  async createMemberProfile(profile: Omit<MemberProfile, 'created_at' | 'updated_at'>): Promise<MemberProfile | null> {
    const { data, error } = await supabase
      .from('member_profiles')
      .insert([profile])
      .select('id, first_name, last_name, date_of_birth, gender, phone, address_line1, address_line2, city, state, zip_code, country, profile_photo_url, membership_number, membership_status, membership_start_date, membership_end_date, plan_id, assigned_advisor_id, preferred_language, communication_preferences, medical_conditions, allergies, medications, emergency_contact_consent, hipaa_consent, consent_date, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating member profile:', error);
      return null;
    }

    return data as any;
  },

  async getDependents(memberId: string): Promise<MemberDependent[]> {
    const { data, error } = await supabase
      .from('member_dependents')
      .select('id, member_id, first_name, last_name, relationship, date_of_birth, gender, ssn_last_four, is_covered, coverage_start_date, coverage_end_date, medical_conditions, allergies, metadata, created_at, updated_at')
      .eq('member_id', memberId)
      .order('date_of_birth', { ascending: true });

    if (error) {
      console.error('Error fetching dependents:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addDependent(dependent: Omit<MemberDependent, 'id' | 'created_at' | 'updated_at'>): Promise<MemberDependent | null> {
    const { data, error } = await supabase
      .from('member_dependents')
      .insert([dependent])
      .select('id, member_id, first_name, last_name, relationship, date_of_birth, gender, ssn_last_four, is_covered, coverage_start_date, coverage_end_date, medical_conditions, allergies, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding dependent:', error);
      return null;
    }

    return data as any;
  },

  async updateDependent(dependentId: string, updates: Partial<MemberDependent>): Promise<MemberDependent | null> {
    const { data, error } = await supabase
      .from('member_dependents')
      .update(updates)
      .eq('id', dependentId)
      .select('id, member_id, first_name, last_name, relationship, date_of_birth, gender, ssn_last_four, is_covered, coverage_start_date, coverage_end_date, medical_conditions, allergies, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating dependent:', error);
      return null;
    }

    return data as any;
  },

  async deleteDependent(dependentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('member_dependents')
      .delete()
      .eq('id', dependentId);

    if (error) {
      console.error('Error deleting dependent:', error);
      return false;
    }

    return true;
  },

  async getEmergencyContacts(memberId: string): Promise<EmergencyContact[]> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('id, member_id, name, relationship, phone, alternate_phone, email, address, is_primary, created_at, updated_at')
      .eq('member_id', memberId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<EmergencyContact | null> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert([contact])
      .select('id, member_id, name, relationship, phone, alternate_phone, email, address, is_primary, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding emergency contact:', error);
      return null;
    }

    return data as any;
  },

  async updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('id', contactId)
      .select('id, member_id, name, relationship, phone, alternate_phone, email, address, is_primary, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating emergency contact:', error);
      return null;
    }

    return data as any;
  },

  async deleteEmergencyContact(contactId: string): Promise<boolean> {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      console.error('Error deleting emergency contact:', error);
      return false;
    }

    return true;
  },

  async getClaims(memberId: string, options?: { status?: string; limit?: number }): Promise<Claim[]> {
    let query = supabase
      .from('claims')
      .select('id, member_id, claim_number, claim_type, status, provider_name, provider_id, patient_name, patient_type, dependent_id, service_date, diagnosis_codes, total_amount, eligible_amount, approved_amount, paid_amount, denial_reason, processing_notes, submitted_date, reviewed_date, approved_date, paid_date, reviewed_by, metadata, created_at, updated_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    // Handle missing table gracefully
    if (error?.message?.includes('schema cache') || 
        error?.code === 'PGRST204' ||
        error?.code === 'PGRST205') {
      return [];
    }

    if (error) {
      console.error('Error fetching claims:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getClaim(claimId: string): Promise<Claim | null> {
    const { data, error } = await supabase
      .from('claims')
      .select('id, member_id, claim_number, claim_type, status, provider_name, provider_id, patient_name, patient_type, dependent_id, service_date, diagnosis_codes, total_amount, eligible_amount, approved_amount, paid_amount, denial_reason, processing_notes, submitted_date, reviewed_date, approved_date, paid_date, reviewed_by, metadata, created_at, updated_at')
      .eq('id', claimId)
      .maybeSingle();

    // Handle missing table gracefully
    if (error?.message?.includes('schema cache') || 
        error?.code === 'PGRST204' ||
        error?.code === 'PGRST205') {
      return null;
    }

    if (error) {
      console.error('Error fetching claim:', error);
      return null;
    }

    return data as any;
  },

  async createClaim(claim: Omit<Claim, 'id' | 'created_at' | 'updated_at' | 'claim_number'>): Promise<Claim | null> {
    const { data: claimNumber } = await supabase.rpc('generate_claim_number');

    const { data, error } = await supabase
      .from('claims')
      .insert([{ ...claim, claim_number: claimNumber }])
      .select('id, member_id, claim_number, claim_type, status, provider_name, provider_id, patient_name, patient_type, dependent_id, service_date, diagnosis_codes, total_amount, eligible_amount, approved_amount, paid_amount, denial_reason, processing_notes, submitted_date, reviewed_date, approved_date, paid_date, reviewed_by, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating claim:', error);
      return null;
    }

    return data as any;
  },

  async updateClaim(claimId: string, updates: Partial<Claim>): Promise<Claim | null> {
    const { data, error } = await supabase
      .from('claims')
      .update(updates)
      .eq('id', claimId)
      .select('id, member_id, claim_number, claim_type, status, provider_name, provider_id, patient_name, patient_type, dependent_id, service_date, diagnosis_codes, total_amount, eligible_amount, approved_amount, paid_amount, denial_reason, processing_notes, submitted_date, reviewed_date, approved_date, paid_date, reviewed_by, metadata, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating claim:', error);
      return null;
    }

    return data as any;
  },

  async getClaimItems(claimId: string): Promise<ClaimItem[]> {
    const { data, error } = await supabase
      .from('claim_items')
      .select('id, claim_id, description, procedure_code, quantity, unit_price, total_amount, eligible_amount, approved_amount, notes, created_at')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching claim items:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addClaimItem(item: Omit<ClaimItem, 'id' | 'created_at'>): Promise<ClaimItem | null> {
    const { data, error } = await supabase
      .from('claim_items')
      .insert([item])
      .select('id, claim_id, description, procedure_code, quantity, unit_price, total_amount, eligible_amount, approved_amount, notes, created_at')
      .single();

    if (error) {
      console.error('Error adding claim item:', error);
      return null;
    }

    return data as any;
  },

  async getClaimSummary(memberId: string): Promise<ClaimSummary> {
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;

    const { data: claims, error } = await supabase
      .from('claims')
      .select('status, total_amount, approved_amount, paid_amount')
      .eq('member_id', memberId)
      .gte('service_date', yearStart);

    if (error || !claims) {
      console.error('Error fetching claim summary:', error);
      return {
        total_claims: 0,
        total_submitted: 0,
        total_approved: 0,
        total_denied: 0,
        total_paid: 0,
        pending_claims: 0,
        year_to_date_expenses: 0,
        year_to_date_reimbursed: 0,
      };
    }

    const summary = claims.reduce(
      (acc, claim) => {
        acc.total_claims++;
        acc.total_submitted += claim.total_amount || 0;

        if (claim.status === 'approved' || claim.status === 'paid') {
          acc.total_approved += claim.approved_amount || 0;
        }

        if (claim.status === 'denied') {
          acc.total_denied += claim.total_amount || 0;
        }

        if (claim.status === 'paid') {
          acc.total_paid += claim.paid_amount || 0;
        }

        if (['submitted', 'under_review', 'pending_info'].includes(claim.status)) {
          acc.pending_claims++;
        }

        return acc;
      },
      {
        total_claims: 0,
        total_submitted: 0,
        total_approved: 0,
        total_denied: 0,
        total_paid: 0,
        pending_claims: 0,
        year_to_date_expenses: 0,
        year_to_date_reimbursed: 0,
      }
    );

    summary.year_to_date_expenses = summary.total_submitted;
    summary.year_to_date_reimbursed = summary.total_paid;

    return summary;
  },

  async getMemberDocuments(memberId: string, category?: string): Promise<MemberDocument[]> {
    let query = supabase
      .from('member_documents')
      .select('id, member_id, document_category, title, description, file_name, file_url, file_size, mime_type, version, is_current, tags, expires_at, uploaded_by, created_at, updated_at')
      .eq('member_id', memberId)
      .eq('is_current', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('document_category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching member documents:', error);
      return [];
    }

    return (data || []) as any;
  },

  async uploadDocument(document: Omit<MemberDocument, 'id' | 'created_at' | 'updated_at'>): Promise<MemberDocument | null> {
    const { data, error } = await supabase
      .from('member_documents')
      .insert([document])
      .select('id, member_id, document_category, title, description, file_name, file_url, file_size, mime_type, version, is_current, tags, expires_at, uploaded_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error uploading document:', error);
      return null;
    }

    return data as any;
  },

  async getPaymentMethods(memberId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, member_id, payment_type, is_default, card_last_four, card_brand, card_exp_month, card_exp_year, bank_name, account_last_four, billing_name, billing_address, billing_zip, payment_token, is_active, created_at, updated_at')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addPaymentMethod(method: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([method])
      .select('id, member_id, payment_type, is_default, card_last_four, card_brand, card_exp_month, card_exp_year, bank_name, account_last_four, billing_name, billing_address, billing_zip, payment_token, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding payment method:', error);
      return null;
    }

    return data as any;
  },

  async getTransactions(memberId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, member_id, transaction_type, amount, status, payment_method_id, payment_gateway_id, description, invoice_id, claim_id, processed_date, receipt_url, metadata, created_at, updated_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getInvoices(memberId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, member_id, invoice_number, billing_period_start, billing_period_end, total_amount, amount_paid, amount_due, due_date, status, invoice_url, created_at, updated_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getMemberCoverage(memberId: string): Promise<MemberCoverage | null> {
    const { data, error } = await supabase
      .from('member_coverage')
      .select('id, member_id, plan_name, plan_type, coverage_start_date, coverage_end_date, monthly_share_amount, annual_unshared_amount, remaining_unshared, lifetime_maximum, lifetime_used, is_active, benefits, network_info, created_at, updated_at')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member coverage:', error);
      return null;
    }

    return data as any;
  },

  async searchProviders(searchParams: {
    query?: string;
    specialty?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    isNetwork?: boolean;
    limit?: number;
  }): Promise<Provider[]> {
    let query = supabase
      .from('providers')
      .select('id, npi, first_name, last_name, practice_name, provider_type, specialties, phone, email, website, accepts_new_patients, is_network, rating, review_count, metadata, created_at, updated_at')
      .order('rating', { ascending: false, nullsFirst: false });

    if (searchParams.query) {
      query = query.or(`practice_name.ilike.%${searchParams.query}%,first_name.ilike.%${searchParams.query}%,last_name.ilike.%${searchParams.query}%`);
    }

    if (searchParams.specialty) {
      query = query.contains('specialties', [searchParams.specialty]);
    }

    if (searchParams.isNetwork !== undefined) {
      query = query.eq('is_network', searchParams.isNetwork);
    }

    if (searchParams.limit) {
      query = query.limit(searchParams.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching providers:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getProviderLocations(providerId: string): Promise<ProviderLocation[]> {
    const { data, error } = await supabase
      .from('provider_locations')
      .select('id, provider_id, location_name, address_line1, address_line2, city, state, zip_code, phone, fax, hours_of_operation, is_primary, latitude, longitude, created_at')
      .eq('provider_id', providerId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching provider locations:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getPrescriptions(memberId: string, activeOnly = false): Promise<Prescription[]> {
    let query = supabase
      .from('prescriptions')
      .select('id, member_id, medication_name, dosage, quantity, refills_remaining, prescribing_provider, provider_id, pharmacy_id, prescription_number, prescribed_date, filled_date, expiration_date, instructions, status, is_controlled, created_at, updated_at')
      .eq('member_id', memberId)
      .order('prescribed_date', { ascending: false });

    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addPrescription(prescription: Omit<Prescription, 'id' | 'created_at' | 'updated_at'>): Promise<Prescription | null> {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([prescription])
      .select('id, member_id, medication_name, dosage, quantity, refills_remaining, prescribing_provider, provider_id, pharmacy_id, prescription_number, prescribed_date, filled_date, expiration_date, instructions, status, is_controlled, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding prescription:', error);
      return null;
    }

    return data as any;
  },

  async getHealthHistory(memberId: string, activeOnly = false): Promise<HealthHistory[]> {
    let query = supabase
      .from('health_history')
      .select('id, member_id, condition_name, condition_type, diagnosed_date, resolved_date, severity, notes, is_active, created_at, updated_at')
      .eq('member_id', memberId)
      .order('diagnosed_date', { ascending: false, nullsFirst: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching health history:', error);
      return [];
    }

    return (data || []) as any;
  },

  async addHealthHistory(history: Omit<HealthHistory, 'id' | 'created_at' | 'updated_at'>): Promise<HealthHistory | null> {
    const { data, error } = await supabase
      .from('health_history')
      .insert([history])
      .select('id, member_id, condition_name, condition_type, diagnosed_date, resolved_date, severity, notes, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding health history:', error);
      return null;
    }

    return data as any;
  },

  async getLabResults(memberId: string, limit = 50): Promise<LabResult[]> {
    const { data, error } = await supabase
      .from('lab_results')
      .select('id, member_id, test_name, test_category, test_date, result_value, result_unit, reference_range, is_abnormal, ordering_provider, lab_facility, notes, document_url, created_at')
      .eq('member_id', memberId)
      .order('test_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching lab results:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getImmunizations(memberId: string): Promise<Immunization[]> {
    const { data, error } = await supabase
      .from('immunizations')
      .select('id, member_id, vaccine_name, vaccine_code, administration_date, administering_provider, lot_number, site, route, dose_number, next_dose_due, notes, created_at')
      .eq('member_id', memberId)
      .order('administration_date', { ascending: false });

    if (error) {
      console.error('Error fetching immunizations:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getVisitSummaries(memberId: string, limit = 50): Promise<VisitSummary[]> {
    const { data, error } = await supabase
      .from('visit_summaries')
      .select('id, member_id, visit_date, visit_type, provider_name, provider_id, chief_complaint, diagnosis, treatment_plan, medications_prescribed, follow_up_instructions, next_appointment_date, document_url, created_at, updated_at')
      .eq('member_id', memberId)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching visit summaries:', error);
      return [];
    }

    return (data || []) as any;
  },

  async getNotifications(memberId: string, unreadOnly = false): Promise<MemberNotification[]> {
    let query = supabase
      .from('member_notifications')
      .select('id, member_id, notification_type, title, message, priority, is_read, read_at, action_url, actor_department, category, related_entity_type, related_entity_id, source_event_id, expires_at, metadata, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []) as any;
  },

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('member_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification read:', error);
      return false;
    }

    return true;
  },

  async createNotification(notification: Omit<MemberNotification, 'id' | 'created_at'>): Promise<MemberNotification | null> {
    const { data, error } = await supabase
      .from('member_notifications')
      .insert([notification])
      .select('id, member_id, notification_type, title, message, priority, is_read, read_at, action_url, actor_department, category, related_entity_type, related_entity_id, source_event_id, expires_at, metadata, created_at')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data as any;
  },

  async markAllNotificationsRead(memberId: string): Promise<boolean> {
    const { error } = await supabase
      .from('member_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('member_id', memberId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications read:', error);
      return false;
    }

    return true;
  },

  async getUnreadNotificationCount(memberId: string): Promise<number> {
    const { count, error } = await supabase
      .from('member_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  },

  async getSupportTickets(memberId: string): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, member_id, ticket_number, subject, description, category, priority, status, assigned_to, resolved_at, resolution_notes, created_at, updated_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support tickets:', error);
      return [];
    }

    return (data || []) as any;
  },

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'ticket_number'>): Promise<SupportTicket | null> {
    const { data: ticketNumber } = await supabase.rpc('generate_ticket_number');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{ ...ticket, ticket_number: ticketNumber }])
      .select('id, member_id, ticket_number, subject, description, category, priority, status, assigned_to, resolved_at, resolution_notes, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      return null;
    }

    return data as any;
  },

  async getDashboardData(userId: string): Promise<MemberDashboardData | null> {
    try {
      const [
        profile,
        coverage,
        recentClaims,
        notifications,
        upcomingAppointments,
        activePrescriptions,
        claimSummary
      ] = await Promise.all([
        this.getMemberProfile(userId),
        this.getMemberCoverage(userId),
        this.getClaims(userId, { limit: 5 }),
        this.getNotifications(userId, true),
        this.getVisitSummaries(userId, 5),
        this.getPrescriptions(userId, true),
        this.getClaimSummary(userId)
      ]);

      if (!profile) {
        return null;
      }

      return {
        profile,
        coverage: coverage!,
        recent_claims: recentClaims,
        unread_notifications: notifications.length,
        upcoming_appointments: upcomingAppointments,
        active_prescriptions: activePrescriptions,
        pending_tasks: 0,
        claim_summary: claimSummary
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return null;
    }
  }
};
