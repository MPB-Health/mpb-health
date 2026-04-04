import { supabase } from './supabase';
import { sendLeadNotification, sendLeadWelcomeEmail } from './emailService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadSubmission');

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  householdSize?: number;
  currentInsurance?: string;
  monthlyPremium?: string;
  coveragePreference?: string;
  zipCode?: string;
  primaryConcern?: string;
  contactPreference?: string;

  // Routing context
  sourcePage?: string;
  sourceCTA?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;

  // Additional metadata
  formData?: Record<string, any>;
}

export interface LeadSubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  warnings?: string[];
}

class LeadSubmissionService {
  async submitLead(formData: LeadFormData): Promise<LeadSubmissionResult> {
    const warnings: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const submissionData = {
        user_id: user?.id || null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        household_size: formData.householdSize,
        current_insurance: formData.currentInsurance,
        monthly_premium: formData.monthlyPremium,
        coverage_preference: formData.coveragePreference,
        zip_code: formData.zipCode,
        primary_concern: formData.primaryConcern,
        contact_preference: formData.contactPreference || 'phone',
        source_page: formData.sourcePage,
        source_cta: formData.sourceCTA,
        utm_source: formData.utmSource,
        utm_medium: formData.utmMedium,
        utm_campaign: formData.utmCampaign,
        utm_term: formData.utmTerm,
        utm_content: formData.utmContent,
        referrer: formData.referrer,
        form_data: formData.formData,
      };

      const { data: submission, error: dbError } = await supabase
        .from('lead_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (dbError) {
        console.error('Database submission error:', {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
        });

        if (dbError.code === 'PGRST301' || dbError.message.includes('row-level security')) {
          throw new Error('Your submission was received but could not be saved. Please contact support if this continues.');
        }

        if (dbError.code === '23505') {
          throw new Error('It looks like you already submitted this form. Please check your email.');
        }

        throw new Error(`Failed to save submission: ${dbError.message}`);
      }

      this.sendNotificationsAsync(formData).catch(error => {
        console.error('Async notification error:', error);
        warnings.push('Email notifications may have failed');
      });

      return {
        success: true,
        submissionId: submission.id,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      console.error('Lead submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit lead',
      };
    }
  }

  private async sendNotificationsAsync(formData: LeadFormData): Promise<void> {
    // Send notification to staff
    try {
      await sendLeadNotification({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        householdType: formData.householdSize ? `${formData.householdSize} ${formData.householdSize === 1 ? 'person' : 'people'}` : undefined,
        source: formData.sourcePage || 'Get a Quote Form',
      });
    } catch (error) {
      console.error('Staff email notification error:', error);
    }

    // Send welcome email to the lead (with plan comparison when from hero calculator)
    try {
      const fd = formData.formData;
      const householdSize = formData.householdSize ?? (fd?.household_type === 'member-only' ? 1 : fd?.household_type === 'member-spouse' ? 2 : fd?.household_type === 'member-child' ? 1 + (fd?.dependents_count || 0) : fd?.household_type === 'member-family' ? 2 + (fd?.dependents_count || 0) : undefined);
      const membershipPriorities = fd?.membership_priorities ?? fd?.priorities_matched ?? [];
      const planData = fd?.all_plan_rates
        ? {
            all_plan_rates: fd.all_plan_rates,
            traditional_cost_estimate: fd.traditional_cost_estimate,
            best_match_plan: fd.best_match_plan ?? null,
            best_match_percentage: fd.best_match_percentage,
            household_size: householdSize,
            household_type: fd.household_type,
            membership_priorities: membershipPriorities,
          }
        : undefined;
      await sendLeadWelcomeEmail({
        firstName: formData.firstName,
        email: formData.email,
        planData,
        householdSize: planData?.household_size ?? householdSize,
        membershipPriorities: planData?.membership_priorities ?? membershipPriorities,
      });
      log.info(`[LeadSubmission] Welcome email sent to ${formData.email}`);
    } catch (error) {
      console.error('Lead welcome email error:', error);
    }

  }

}

export const leadSubmissionService = new LeadSubmissionService();
