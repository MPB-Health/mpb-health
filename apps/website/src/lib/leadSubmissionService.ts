import { sendLeadWelcomeEmail } from './emailService';
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

/**
 * ARYX `submit_public_lead` rejects form_data over 640 KB (20× original 32 KB).
 * Client ceiling stays under that with margin; tier matrices are always compacted
 * so quote engines cannot reintroduce the old 32 KB failure mode.
 */
export const FORM_DATA_MAX_BYTES = 600_000;
/** Soft target for quote payloads — keep CRM rows lean even with 640 KB headroom. */
export const FORM_DATA_SOFT_MAX_BYTES = 48_000;

/**
 * Compact quote payloads for CRM storage.
 * Hero / rate engines attach full tier matrices that easily exceed the RPC limit;
 * CRM + Email #1 only need plan labels and price bands.
 */
export function sanitizeFormDataForCrm(
  formData: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!formData) return undefined;

  const compact = structuredClone(formData) as Record<string, unknown>;
  const rates = compact.all_plan_rates;

  if (rates && typeof rates === 'object' && !Array.isArray(rates)) {
    const slim: Record<string, unknown> = {};
    for (const [planId, raw] of Object.entries(rates as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object') continue;
      const plan = raw as Record<string, unknown>;
      const tiers = Array.isArray(plan.tiers) ? plan.tiers : [];
      // Hero already sends compact tier_prices; legacy payloads still send full tiers.
      const existingPrices = Array.isArray(plan.tier_prices) ? plan.tier_prices : [];
      const tierPrices =
        tiers.length > 0
          ? tiers
              .slice(0, 12)
              .map((t) => {
                if (!t || typeof t !== 'object') return null;
                const tier = t as Record<string, unknown>;
                return {
                  tierLabel: tier.tierLabel ?? tier.tierId,
                  monthly: tier.monthly,
                };
              })
              .filter(Boolean)
          : existingPrices.slice(0, 12).map((t) => {
              if (!t || typeof t !== 'object') return null;
              const tier = t as Record<string, unknown>;
              return {
                tierLabel: tier.tierLabel ?? tier.tierId,
                monthly: tier.monthly,
              };
            }).filter(Boolean);

      slim[planId] = {
        planLabel: plan.planLabel,
        lowestPrice: plan.lowestPrice,
        highestPrice: plan.highestPrice,
        ...(plan.flatRate != null ? { flatRate: plan.flatRate } : {}),
        ...(tierPrices.length > 0
          ? {
              tier_count:
                typeof plan.tier_count === 'number' ? plan.tier_count : tiers.length || tierPrices.length,
              tier_prices: tierPrices,
            }
          : {}),
      };
    }
    compact.all_plan_rates = slim;
  }

  let json = JSON.stringify(compact);
  // Prefer lean CRM rows; only strip further when soft target is exceeded.
  if (json.length <= FORM_DATA_SOFT_MAX_BYTES) return compact;

  // Progressive strip: drop tier ladders, then drop all_plan_rates entirely.
  if (compact.all_plan_rates && typeof compact.all_plan_rates === 'object') {
    for (const plan of Object.values(compact.all_plan_rates as Record<string, unknown>)) {
      if (plan && typeof plan === 'object') {
        delete (plan as Record<string, unknown>).tier_prices;
        delete (plan as Record<string, unknown>).tier_count;
      }
    }
    json = JSON.stringify(compact);
  }

  if (json.length > FORM_DATA_SOFT_MAX_BYTES && 'all_plan_rates' in compact) {
    delete compact.all_plan_rates;
    compact.all_plan_rates_omitted = true;
    json = JSON.stringify(compact);
    log.warn(
      `[LeadSubmission] form_data still oversized after tier trim (${json.length}B); omitted all_plan_rates`,
    );
  }

  if (json.length > FORM_DATA_MAX_BYTES) {
    log.warn(
      `[LeadSubmission] form_data truncated to CRM keys only (${json.length}B → essentials)`,
    );
    return {
      lead_type: compact.lead_type,
      quote_calc_session_id: compact.quote_calc_session_id,
      household_type: compact.household_type,
      state: compact.state,
      best_match_plan: compact.best_match_plan,
      best_match_percentage: compact.best_match_percentage,
      traditional_cost_estimate: compact.traditional_cost_estimate,
      form_data_truncated: true,
    };
  }

  return compact;
}

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
      const safeFormData = sanitizeFormDataForCrm(formData.formData);
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
        form_data: safeFormData,
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

      // Staff "new lead" notifications are now sent server-side by the ARYX
      // intake (crm-website-lead-intake → send-crm-email-v2), tenant-isolated
      // with recipients configured per-org in system_settings. The website no
      // longer fires its own client-side staff email — doing so would duplicate
      // the reliable server-side one. See migration 20260624160000.
      //
      // The transitional welcome fallback still runs async (non-blocking) only
      // when ARYX could not send Email #1, so the prospect always gets a reply.
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
