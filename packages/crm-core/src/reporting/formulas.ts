/**
 * Canonical Sales Reports & Dashboards 2026 formulas.
 *
 * Every report page, XLSX exporter, and RPC callsite should route through
 * these helpers — the spec says "implement exactly, no drift."
 *
 *   Close Rate %        = Closed Sales / Leads Received
 *   Avg Deal Size       = Revenue / Closed Sales
 *   Inhouse Conv. %     = Inhouse Closed / Inhouse Leads Received
 *   Self-Gen Conv. %    = Self-Gen Closed / Self-Gen Leads
 *   Overall Conv. %     = Total Closed / Total Leads
 *   TOTAL Self-Gen      = LinkedIn + Networking + Referrals + Community + Reactivation
 *   GRAND TOTAL Leads   = Self-Gen + Inhouse (RR)
 *   YTD                 = running sum Jan -> current month (scoped to org + fiscal year)
 */

export type Percentage = number; // 0-100, 1dp rounding

const ZERO_CLAMP = 0;

/** Safe percentage: returns 0 when the denominator is 0 to keep report tables readable. */
export function safePercent(numerator: number, denominator: number, decimals = 1): Percentage {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return ZERO_CLAMP;
  }
  const factor = 10 ** decimals;
  return Math.round((numerator / denominator) * 100 * factor) / factor;
}

/** Close Rate % = Closed Sales / Leads Received */
export function closeRatePct(closedSales: number, leadsReceived: number): Percentage {
  return safePercent(closedSales, leadsReceived);
}

/** Avg Deal Size = Revenue / Closed Sales */
export function avgDealSize(revenue: number, closedSales: number): number {
  if (!Number.isFinite(revenue) || !Number.isFinite(closedSales) || closedSales <= 0) return 0;
  return Math.round((revenue / closedSales) * 100) / 100;
}

/** Inhouse Conv. % = Inhouse Closed / Inhouse Leads Received */
export function inhouseConvPct(inhouseClosed: number, inhouseLeads: number): Percentage {
  return safePercent(inhouseClosed, inhouseLeads);
}

/** Self-Gen Conv. % = Self-Gen Closed / Self-Gen Leads */
export function selfGenConvPct(selfGenClosed: number, selfGenLeads: number): Percentage {
  return safePercent(selfGenClosed, selfGenLeads);
}

/** Overall Conv. % = Total Closed / Total Leads */
export function overallConvPct(totalClosed: number, totalLeads: number): Percentage {
  return safePercent(totalClosed, totalLeads);
}

export interface LeadsSplitCounts {
  linkedin: number;
  networking: number;
  referrals: number;
  community: number;
  reactivation: number;
  inhouse: number;
}

/** TOTAL Self-Gen = LinkedIn + Networking + Referrals + Community + Reactivation */
export function totalSelfGen(counts: Omit<LeadsSplitCounts, 'inhouse'>): number {
  return counts.linkedin + counts.networking + counts.referrals + counts.community + counts.reactivation;
}

/** GRAND TOTAL Leads = Self-Gen + Inhouse (RR) */
export function grandTotalLeads(counts: LeadsSplitCounts): number {
  return totalSelfGen(counts) + counts.inhouse;
}

/** Formats a percentage for the XLSX export cells that the deck renders as "%-suffixed". */
export function formatPercent(value: Percentage): string {
  return `${value.toFixed(1)}%`;
}

/** Formats a currency amount for the deck's revenue columns. */
export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/** Running YTD: returns the running-sum series for any monthly numeric series. */
export function runningYTD(monthly: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const v of monthly) {
    acc += v ?? 0;
    out.push(acc);
  }
  return out;
}
