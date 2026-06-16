export interface LeadNotificationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
  formData?: Record<string, unknown>;
}

export interface LeadNotificationDetailRow {
  label: string;
  value: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const HOUSEHOLD_TYPE_LABELS: Record<string, string> = {
  'member-only': 'Just Me (Individual)',
  'member-spouse': 'Member + Spouse',
  'member-child': 'Member + Child(ren)',
  'member-family': 'Member + Family',
  individual: 'Individual',
  couple: 'Couple',
  family: 'Family',
};

const FIELD_LABELS: Record<string, string> = {
  lead_type: 'Lead Type',
  form_type: 'Form Type',
  quote_calc_session_id: 'Quote Calculator Session',
  household_type: 'Household Type',
  state: 'State',
  primary_age: 'Primary Age',
  spouse_age: 'Spouse Age',
  dependents_count: 'Number of Dependents',
  oldest_dependent_age: 'Oldest Dependent Age',
  primary_tobacco: 'Primary Tobacco Use',
  spouse_tobacco: 'Spouse Tobacco Use',
  preexisting_conditions: 'Pre-existing Conditions',
  membership_priorities: 'Membership Priorities',
  priorities_matched: 'Priorities Matched',
  traditional_cost_estimate: 'Traditional Insurance Estimate',
  best_match_plan: 'Best Match Plan',
  best_match_percentage: 'Best Match Score',
  referral_source: 'How They Heard About Us',
  benefit_type: 'Benefit Type',
  benefit_name: 'Benefit Name',
};

const FORM_DATA_FIELD_ORDER = [
  'lead_type',
  'form_type',
  'quote_calc_session_id',
  'household_type',
  'state',
  'primary_age',
  'spouse_age',
  'dependents_count',
  'oldest_dependent_age',
  'primary_tobacco',
  'spouse_tobacco',
  'preexisting_conditions',
  'membership_priorities',
  'priorities_matched',
  'traditional_cost_estimate',
  'best_match_plan',
  'best_match_percentage',
  'referral_source',
  'benefit_type',
  'benefit_name',
];

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}/month`;
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function formatScalar(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (key === 'household_type' && typeof value === 'string') {
    return HOUSEHOLD_TYPE_LABELS[value] ?? value;
  }

  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }

  if (typeof value === 'number') {
    if (key === 'traditional_cost_estimate') return formatCurrency(value);
    if (key === 'best_match_percentage') return formatPercent(value);
    return String(value);
  }

  if (typeof value === 'string') {
    if (key === 'primary_tobacco' || key === 'spouse_tobacco') {
      return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((item) => String(item)).join(', ');
  }

  return JSON.stringify(value);
}

interface PlanRateEntry {
  planLabel?: string;
  lowestPrice?: number;
  highestPrice?: number;
  flatRate?: number | null;
}

function formatPlanRates(allPlanRates: Record<string, PlanRateEntry>): string[] {
  return Object.entries(allPlanRates).map(([planId, plan]) => {
    const label = plan.planLabel || planId;
    if (typeof plan.flatRate === 'number') {
      return `${label}: ${formatCurrency(plan.flatRate)} (flat rate)`;
    }
    if (typeof plan.lowestPrice === 'number' && typeof plan.highestPrice === 'number') {
      if (plan.lowestPrice === plan.highestPrice) {
        return `${label}: ${formatCurrency(plan.lowestPrice)}`;
      }
      return `${label}: $${plan.lowestPrice.toLocaleString('en-US')}–$${plan.highestPrice.toLocaleString('en-US')}/month`;
    }
    if (typeof plan.lowestPrice === 'number') {
      return `${label}: from ${formatCurrency(plan.lowestPrice)}`;
    }
    return `${label}: rates unavailable`;
  });
}

function pushRow(rows: LeadNotificationDetailRow[], label: string, value: string | null | undefined): void {
  if (!value) return;
  rows.push({ label, value });
}

export function buildLeadNotificationDetails(
  lead: LeadNotificationInput,
): LeadNotificationDetailRow[] {
  const rows: LeadNotificationDetailRow[] = [];
  const name = `${lead.firstName} ${lead.lastName}`.trim();

  pushRow(rows, 'Name', name);
  pushRow(rows, 'Email', lead.email);
  pushRow(rows, 'Phone', lead.phone && lead.phone !== 'Not provided' ? lead.phone : lead.phone || null);

  if (lead.householdSize) {
    pushRow(
      rows,
      'Household Size',
      `${lead.householdSize} ${lead.householdSize === 1 ? 'person' : 'people'}`,
    );
  }

  pushRow(rows, 'Zip Code', lead.zipCode);
  pushRow(rows, 'Current Insurance', lead.currentInsurance);
  pushRow(rows, 'Current Monthly Premium', lead.monthlyPremium);
  pushRow(rows, 'Coverage Preference', lead.coveragePreference);
  pushRow(rows, 'Primary Concern', lead.primaryConcern);
  pushRow(rows, 'Contact Preference', lead.contactPreference);
  pushRow(rows, 'Source Page', lead.sourcePage);
  pushRow(rows, 'Source CTA', lead.sourceCTA);
  pushRow(rows, 'UTM Source', lead.utmSource);
  pushRow(rows, 'UTM Medium', lead.utmMedium);
  pushRow(rows, 'UTM Campaign', lead.utmCampaign);
  pushRow(rows, 'UTM Term', lead.utmTerm);
  pushRow(rows, 'UTM Content', lead.utmContent);
  pushRow(rows, 'Referrer', lead.referrer);

  const formData = lead.formData ?? {};
  const handledKeys = new Set<string>(['all_plan_rates']);

  for (const key of FORM_DATA_FIELD_ORDER) {
    if (!(key in formData)) continue;
    handledKeys.add(key);
    const formatted = formatScalar(key, formData[key]);
    pushRow(rows, FIELD_LABELS[key] ?? humanizeKey(key), formatted);
  }

  for (const [key, value] of Object.entries(formData)) {
    if (handledKeys.has(key)) continue;
    const formatted = formatScalar(key, value);
    pushRow(rows, FIELD_LABELS[key] ?? humanizeKey(key), formatted);
  }

  const allPlanRates = formData.all_plan_rates;
  if (allPlanRates && typeof allPlanRates === 'object' && !Array.isArray(allPlanRates)) {
    const planLines = formatPlanRates(allPlanRates as Record<string, PlanRateEntry>);
    if (planLines.length > 0) {
      pushRow(rows, 'Plan Rate Comparison', planLines.join('\n'));
    }
  }

  return rows;
}

export function renderLeadNotificationHtmlRows(rows: LeadNotificationDetailRow[]): string {
  return rows
    .map(({ label, value }) => {
      const safeLabel = escapeHtml(label);
      const safeValue = escapeHtml(value).replace(/\n/g, '<br>');
      let valueCell = safeValue;
      if (label === 'Email') {
        valueCell = `<a href="mailto:${safeValue}" style="color: #2563eb;">${safeValue}</a>`;
      } else if (label === 'Phone') {
        const tel = value.replace(/[^\d+]/g, '');
        valueCell = `<a href="tel:${tel}" style="color: #2563eb;">${safeValue}</a>`;
      }
      return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333; vertical-align: top; width: 40%;">${safeLabel}:</td>
              <td style="padding: 12px 0; color: #666; white-space: pre-wrap;">${valueCell}</td>
            </tr>`;
    })
    .join('');
}

export function renderLeadNotificationText(rows: LeadNotificationDetailRow[]): string {
  return rows.map(({ label, value }) => `${label}: ${value}`).join('\n');
}
