import { supabase } from './supabase';
import { sendLeadNotification, sendLeadWelcomeEmail } from './emailService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadSubmission');

// ─────────────────────────────────────────────────────────────────────────────
// ARYX dual-write (added 2026-05-28)
//
// MPB website leads must land in BOTH the legacy CRM (`crm.mpb.health`) and the
// new ARYX CRM (`crm.aryx.pro`). The legacy intake is the source of truth — we
// fire ARYX intake in the background and a failure on the ARYX side never
// blocks the website success state. ARYX has its own RLS + read-only policies
// that prevent any double-effects on the MPB tenant.
//
// Env vars (set in Vercel for the website project):
//   VITE_ARYX_FUNCTIONS_URL = https://knelbprqqbjggqfqvfmc.supabase.co
//   VITE_ARYX_ANON_KEY      = <ARYX anon key>
// Leave both unset to disable dual-write (useful for previews / dev).
// ─────────────────────────────────────────────────────────────────────────────
const ARYX_FUNCTIONS_URL = (import.meta.env.VITE_ARYX_FUNCTIONS_URL ?? '').replace(/\/+$/, '');
const ARYX_ANON_KEY = import.meta.env.VITE_ARYX_ANON_KEY ?? '';

async function dualWriteToAryx(payload: Record<string, unknown>): Promise<void> {
  if (!ARYX_FUNCTIONS_URL || !ARYX_ANON_KEY) return;
  try {
    const res = await fetch(
      `${ARYX_FUNCTIONS_URL}/functions/v1/crm-website-lead-intake`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ARYX_ANON_KEY}`,
          apikey: ARYX_ANON_KEY,
          'X-Dual-Write-Source': 'mpb-website',
        },
        body: JSON.stringify(payload),
        // Don't block the user — a slow ARYX response shouldn't delay UI.
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      log.warn(`[LeadSubmission] ARYX dual-write non-OK ${res.status}: ${text.slice(0, 240)}`);
      return;
    }
    log.info('[LeadSubmission] ARYX dual-write succeeded');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn(`[LeadSubmission] ARYX dual-write error (non-fatal): ${msg}`);
  }
}

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

// CRM rebuild Section 13 (Round 7 Addendum, 2026-05-13) — website Get-a-Quote
// submissions are the only inbound channel that auto-fires Email #1. Manual
// rep entry, referrals, and LinkedIn imports take other code paths in the
// CRM app and intentionally do NOT touch this service.
//
// Pipeline:
//   1. POST payload → `crm-website-lead-intake` edge function (service-role).
//      The function itself:
//        a. Inserts the lead via `submit_public_lead` (anon-safe RPC).
//        b. Enrolls the lead in the org's "Quote Response" cadence.
//        c. Sends Email #1 from `sales@mympb.com` / "MPB.Health Sales" using
//           the cadence-linked master template + shared MPB Sales signature.
//        d. On send success, advances stage `new → quoted` and tags the lead
//           with `lead_source_attribution = 'website_auto_response'` so the
//           website channel can be measured separately from rep-enrolled
//           cadence sends.
//   2. Staff notification (`sendLeadNotification`) still fires async so the
//      inbox of `info@mympb.com` + the on-call reps see the new lead.
//   3. The legacy plan-comparison "welcome" email is reserved as a
//      transitional fallback that only runs when the edge function reports
//      `auto_response_pending=true` (i.e., the admin hasn't yet pasted the
//      verbatim Email #1 content from the Round 7 OneDrive doc into the
//      Master Template). Once Email #1 is fully configured the fallback
//      will never trigger.

const INTAKE_FUNCTION = 'crm-website-lead-intake';

interface IntakeResponse {
  success: boolean;
  lead_id?: string;
  email_sent?: boolean;
  email_error?: string | null;
  cadence_enrolled?: boolean;
  auto_response_pending?: boolean;
  error?: string;
}

class LeadSubmissionService {
  async submitLead(formData: LeadFormData): Promise<LeadSubmissionResult> {
    const warnings: string[] = [];

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

      // Fire ARYX dual-write in parallel; never await it on the critical path.
      void dualWriteToAryx(payload);

      const { data: intake, error: intakeError } =
        await supabase.functions.invoke<IntakeResponse>(INTAKE_FUNCTION, {
          body: payload,
        });

      if (intakeError) {
        console.error('Lead intake function error:', intakeError);
        // Soft-fall back to the legacy direct RPC so an outage of the edge
        // function never silently drops the lead. The fallback path will not
        // fire Email #1, advance stage, or tag attribution — those rely on
        // the edge function — but the lead row will still be written.
        return await this.fallbackSubmit(payload, formData);
      }

      if (!intake?.success || !intake.lead_id) {
        // Surface validation errors verbatim — the RPC inside the edge
        // function raises SQLSTATE 22023 with a human-readable message.
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

  /**
   * Direct-RPC fallback used only when the intake edge function is
   * unreachable. We keep the original submit_public_lead path so the lead
   * row is never lost; the cadence/Email #1 wiring is intentionally skipped
   * here — those are the edge function's responsibility.
   */
  private async fallbackSubmit(
    payload: Record<string, unknown>,
    formData: LeadFormData,
  ): Promise<LeadSubmissionResult> {
    const { data: submission, error: dbError } = await supabase.rpc(
      'submit_public_lead',
      { payload },
    );
    if (dbError) {
      if (dbError.code === '23505') {
        throw new Error(
          'It looks like you already submitted this form. Please check your email.',
        );
      }
      if (dbError.code === '22023') {
        throw new Error(dbError.message);
      }
      throw new Error(`Failed to save submission: ${dbError.message}`);
    }

    this.sendStaffNotification(formData).catch((err) =>
      console.error('Staff email notification error:', err),
    );
    this.sendLegacyWelcomeFallback(formData).catch((err) =>
      console.error('Legacy welcome fallback error:', err),
    );

    return {
      success: true,
      submissionId: submission.id,
      warnings: ['intake_function_unavailable'],
    };
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
