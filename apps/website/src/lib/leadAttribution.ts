import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadAttribution');

// ─────────────────────────────────────────────────────────────────────────────
// First-touch campaign attribution for lead intake.
//
// `lead_submissions` has carried utm_source/medium/campaign/term/content and
// referrer since the ARYX cutover, and submit_public_lead inserts all six — but
// no live form ever populated them, so 100% of leads landed with NULL
// attribution and no campaign could be tied to a CRM outcome.
//
// Reading the params at submit time is not enough: a visitor lands on
// `/?utm_source=google`, browses, and submits from `/get-a-quote`, by which
// point the query string is gone and `document.referrer` has been overwritten
// by internal navigation. So we capture once, on first sight, and persist for
// the session.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mpb_lead_attribution';

export interface LeadAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
}

const UTM_KEYS = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_term', 'utmTerm'],
  ['utm_content', 'utmContent'],
] as const;

/** Trim, drop empties, and cap length so a hostile query string can't bloat form_data. */
function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 255);
}

function read(): LeadAttribution {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeadAttribution) : {};
  } catch {
    // Private mode / storage disabled — attribution degrades, intake must not.
    return {};
  }
}

function write(value: LeadAttribution): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Non-fatal: see read().
  }
}

/**
 * Capture campaign attribution from the current URL and referrer.
 *
 * Call once as early as possible in app startup, and again on route changes so
 * a campaign link into any deep page is still caught. First touch wins: an
 * existing value is only replaced when the URL carries a *new* utm_source,
 * which marks a genuinely new campaign click rather than internal navigation.
 */
export function captureLeadAttribution(): LeadAttribution {
  if (typeof window === 'undefined') return {};

  const stored = read();
  const params = new URLSearchParams(window.location.search);

  const incoming: LeadAttribution = {};
  for (const [param, field] of UTM_KEYS) {
    const value = clean(params.get(param));
    if (value) incoming[field] = value;
  }

  // Only record an external referrer, and only when we have nothing yet —
  // after the first client-side navigation document.referrer is our own site.
  let referrer = stored.referrer;
  if (!referrer) {
    const raw = clean(document.referrer);
    if (raw) {
      try {
        if (new URL(raw).hostname !== window.location.hostname) referrer = raw;
      } catch {
        // Unparseable referrer — ignore rather than store garbage.
      }
    }
  }

  const isNewCampaign = Boolean(incoming.utmSource && incoming.utmSource !== stored.utmSource);
  const next: LeadAttribution = isNewCampaign
    ? { ...incoming, ...(referrer ? { referrer } : {}) }
    : { ...incoming, ...stored, ...(referrer ? { referrer } : {}) };

  if (Object.keys(next).length > 0) {
    write(next);
    if (isNewCampaign) log.info(`campaign captured: ${next.utmSource}`);
  }

  return next;
}

/**
 * Attribution to spread into a `submitLead` payload. Safe to call anywhere —
 * falls back to capturing on the spot if startup capture never ran.
 */
export function getLeadAttribution(): LeadAttribution {
  if (typeof window === 'undefined') return {};
  const stored = read();
  return Object.keys(stored).length > 0 ? stored : captureLeadAttribution();
}
