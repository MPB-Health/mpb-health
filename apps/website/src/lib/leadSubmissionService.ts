import { sendLeadNotification, sendLeadWelcomeEmail } from './emailService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadSubmission');

// ─────────────────────────────────────────────────────────────────────────────
// Single-write to ARYX (MPB → ARYX single-CRM consolidation, 2026-05-28)
//
// MPB website leads now write ONLY to the ARYX CRM at
// https://knelbprqqbjggqfqvfmc.supabase.co (the project that powers
// crm.mpb.health). The legacy `supabase.functions.invoke('crm-website-lead-intake')`
// dual-write path was retired — there is no longer a separate legacy CRM
// Supabase project that needs the lead. The legacy → ARYX sync pipeline is
// stopped (SYNC_ENABLED=false), so writing to legacy would create silent
// drift; we never want that.
//
// Required env vars (Vercel — Production):
//   VITE_ARYX_FUNCTIONS_URL = https://knelbprqqbjggqfqvfmc.supabase.co
//   VITE_ARYX_ANON_KEY      = <ARYX anon key>
// ─────────────────────────────────────────────────────────────────────────────
const ARYX_FUNCTIONS_URL = (import.meta.env.VITE_ARYX_FUNCTIONS_URL ?? '').replace(/\/+$/, '');
const ARYX_ANON_KEY = import.meta.env.VITE_ARYX_ANON_KEY ?? '';

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

  sourcePage?: string;
  sourceCTA?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;

  formData?: Record<string, any>;
}

export interface LeadSubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  warnings?: string[];
}

interface IntakeResponse {
  success: boolean;
  lead_id?: string;
  email_sent?: boolean;
  email_error?: string | null;
  cadence_enrolled?: boolean;
  auto_response_pending?: boolean;
  error?: string;
}

const INTAKE_PATH = 'functions/v1/crm-website-lead-intake';

class LeadSubmissionService {
  async submitLead(formData: LeadFormData): Promise<LeadSubmissionResult> {
    const warnings: string[] = [];

    if (!ARYX_FUNCTIONS_URL || !ARYX_ANON_KEY) {
      // Fail loudly in dev when the ARYX intake target is not configured.
      // Production builds must have these env vars set in Vercel.
      const msg =
        'Lead intake is misconfigured (missing VITE_ARYX_FUNCTIONS_URL or VITE_ARYX_ANON_KEY). ' +
        'Please contact support and try again later.';
      log.error(`[LeadSubmission] ${msg}`);
      return { success: false, error: msg };
    }

    try {
      const payload = {
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

      const res = await fetch(`${ARYX_FUNCTIONS_URL}/${INTAKE_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ARYX_ANON_KEY}`,
          apikey: ARYX_ANON_KEY,
          'X-Lead-Source': 'mpb-website',
        },
        body: JSON.stringify(payload),
        // 10s ceiling — the intake function does cadence enrollment + email
        // dispatch + stage advance and can legitimately take 4-7s on cold start.
        signal: AbortSignal.timeout(10000),
      });

      let intake: IntakeResponse | null = null;
      try {
        intake = (await res.json()) as IntakeResponse;
      } catch {
        // Non-JSON body. Surface the HTTP status verbatim.
        intake = null;
      }

      if (!res.ok) {
        const message =
          intake?.error ?? `Lead intake failed (${res.status} ${res.statusText})`;
        if (/already submitted/i.test(message)) {
          throw new Error(
            'It looks like you already submitted this form. Please check your email.',
          );
        }
        throw new Error(message);
      }

      if (!intake?.success || !intake.lead_id) {
        const message = intake?.error || 'Failed to save submission';
        if (/already submitted/i.test(message)) {
          throw new Error(
            'It looks like you already submitted this form. Please check your email.',
          );
        }
        throw new Error(message);
      }

      if (intake.auto_response_pending) {
        warnings.push('auto_response_pending');
      }

      // Staff notification + transitional welcome fallback run async so they
      // do not block the form's success state. Failures here are non-fatal.
      this.sendStaffNotification(formData).catch((err) =>
        console.error('Staff email notification error:', err),
      );

      if (intake.auto_response_pending) {
        this.sendLegacyWelcomeFallback(formData).catch((err) =>
          console.error('Legacy welcome fallback error:', err),
        );
      }

      return {
        success: true,
        submissionId: intake.lead_id,
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

  private async sendStaffNotification(formData: LeadFormData): Promise<void> {
    await sendLeadNotification({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      householdType: formData.householdSize
        ? `${formData.householdSize} ${formData.householdSize === 1 ? 'person' : 'people'}`
        : undefined,
      source: formData.sourcePage || 'Get a Quote Form',
    });
  }

  private async sendLegacyWelcomeFallback(formData: LeadFormData): Promise<void> {
    const fd = formData.formData;
    const householdSize =
      formData.householdSize ??
      (fd?.household_type === 'member-only'
        ? 1
        : fd?.household_type === 'member-spouse'
          ? 2
          : fd?.household_type === 'member-child'
            ? 1 + (fd?.dependents_count || 0)
            : fd?.household_type === 'member-family'
              ? 2 + (fd?.dependents_count || 0)
              : undefined);
    const membershipPriorities =
      fd?.membership_priorities ?? fd?.priorities_matched ?? [];
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
      membershipPriorities:
        planData?.membership_priorities ?? membershipPriorities,
    });
    log.info(`[LeadSubmission] Legacy welcome fallback sent to ${formData.email}`);
  }
}

export const leadSubmissionService = new LeadSubmissionService();
