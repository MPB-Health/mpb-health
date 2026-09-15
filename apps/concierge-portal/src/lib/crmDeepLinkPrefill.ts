/**
 * CRM → Concierge deep-link query params (see aryx-crm `buildConciergeUrl`).
 * Used to prefill New Log Entry when opening /daily-logs from a member profile.
 */
export const CRM_DAILY_LOG_QUERY_KEYS = [
  'crm_contact_id',
  'email',
  'phone',
  'member_name',
  'first_name',
  'last_name',
  'external_member_id',
] as const;

function paramsFromSearch(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

/** Prefer `member_name`; fall back to `first_name` + `last_name`. */
export function memberNameFromCrmSearch(search: string): string {
  const p = paramsFromSearch(search);
  const full = p.get('member_name')?.trim();
  if (full) return full;
  return [p.get('first_name'), p.get('last_name')].filter(Boolean).join(' ').trim();
}

export function hasCrmDailyLogPrefill(search: string): boolean {
  const p = paramsFromSearch(search);
  return CRM_DAILY_LOG_QUERY_KEYS.some((k) => Boolean(p.get(k)?.trim()));
}

/** Keep only non-CRM params (e.g. `tab`) so refresh doesn't re-apply prefill. */
export function dailyLogsPathWithoutCrmPrefill(search: string): string {
  const p = paramsFromSearch(search);
  for (const k of CRM_DAILY_LOG_QUERY_KEYS) p.delete(k);
  const qs = p.toString();
  return qs ? `/daily-logs?${qs}` : '/daily-logs';
}
