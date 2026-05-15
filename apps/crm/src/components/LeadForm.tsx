import { useState, useEffect, useMemo, useRef } from 'react';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { SaveIndicator } from './SaveIndicator';
import { useForm } from '../hooks/useForm';
import { supabase } from '../lib/supabase';
import { AlertCircle, RotateCcw, Building2, Check, Loader2, X } from 'lucide-react';
import {
  createCarrierService,
  createLeadSourceService,
  PLAN_TYPE_LABELS,
  TOBACCO_STATUS_LABELS,
  GROUP_TYPE_LABELS,
  type InsuranceCarrier,
  type LeadSourceType,
} from '@mpbhealth/crm-core';
import type { SaveStatus } from '../hooks/useSaveStatus';
import { useCRMService } from '../contexts/CRMServiceContext';

const carrierService = createCarrierService(supabase);
const leadSourceService = createLeadSourceService(supabase);

interface LeadFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size: string;
  zip_code: string;
  state: string;
  city: string;
  current_insurance: string;
  monthly_premium: string;
  coverage_preference: string;
  primary_concern: string;
  contact_preference: string;
  source_cta: string;
  tags: string;
  plan_type: string;
  carrier_id: string;
  tobacco_status: string;
  group_type: string;
  original_effective_date: string;
  premium_amount: string;
  subsidy_amount: string;
  member_responsibility: string;
  priority: string;
  lead_score: string;
  next_followup_at: string;
  // Sales Plan 2026: required picklist; attribution IDs are optional and
  // conditionally surfaced when the matching source is selected.
  lead_source: string;
  outside_advisor_id: string;
  referral_partner_id: string;
  // Round 10 Addendum (Section 17 — Coverage Preferred = Group):
  // Business Name (required), Website (optional), and an optional auto-link
  // to an existing crm_accounts row via typeahead (Section 15). Persisted
  // into form_data by the Add/Edit modals until a column-level migration
  // lands so reporting + the Convert-to-Account flow can hydrate from a
  // dedicated field instead of jsonb.
  business_name: string;
  website: string;
  account_id: string;
}

interface LeadFormProps {
  initialValues?: Partial<LeadFormValues>;
  onSubmit: (values: LeadFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEdit?: boolean;
  onDirty?: () => void;
  saveStatus?: SaveStatus;
  saveErrorMessage?: string | null;
}

// Round 10 Addendum (Section 17): Coverage Preferred drops Medicare,
// Medicaid, and Life. Group is the trigger for the conditional Business
// Name + Website fields and the Company auto-link.
const COVERAGE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
  { value: 'group', label: 'Group' },
  { value: 'dental', label: 'Dental' },
  { value: 'vision', label: 'Vision' },
  { value: 'other', label: 'Other' },
];

const CONCERN_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'cost', label: 'Cost / Affordability' },
  { value: 'coverage', label: 'Coverage Quality' },
  { value: 'dental_vision', label: 'Dental & Vision' },
  { value: 'prescription', label: 'Prescription Costs' },
  { value: 'network', label: 'Provider Network' },
  { value: 'switching', label: 'Switching Plans' },
  { value: 'enrollment', label: 'Enrollment Help' },
  { value: 'other', label: 'Other' },
];

const CONTACT_PREF_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS/Text' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PLAN_TYPE_OPTIONS = [
  { value: '', label: 'Select Plan Type...' },
  ...Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => ({ value, label: String(label) })),
];

const TOBACCO_OPTIONS = [
  { value: '', label: 'Select...' },
  ...Object.entries(TOBACCO_STATUS_LABELS).map(([value, label]) => ({ value, label: String(label) })),
];

const GROUP_TYPE_OPTIONS = [
  { value: '', label: 'Select...' },
  ...Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => ({ value, label: String(label) })),
];

const defaultValues: LeadFormValues = {
  first_name: '', last_name: '', email: '', phone: '',
  household_size: '', zip_code: '', state: '', city: '',
  current_insurance: '', monthly_premium: '', coverage_preference: '',
  primary_concern: '', contact_preference: 'phone', source_cta: '', tags: '',
  plan_type: '', carrier_id: '', tobacco_status: '', group_type: '',
  original_effective_date: '', premium_amount: '', subsidy_amount: '',
  member_responsibility: '', priority: 'medium', lead_score: '0', next_followup_at: '',
  // Sales Plan 2026 attribution. Default to the pipeline source so validation
  // never blocks a hurried rep; they can override from the picker.
  lead_source: 'inhouse_round_robin',
  outside_advisor_id: '',
  referral_partner_id: '',
  // Round 10 Addendum (Section 17 / Section 15) — populated only when
  // Coverage Preferred = Group; account_id is set by the Company typeahead.
  business_name: '',
  website: '',
  account_id: '',
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="pt-2">
      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-th-border" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-th-border" />
      </h3>
    </div>
  );
}

// ─── CompanyTypeaheadField ──────────────────────────────────────────────
// Round 10 Addendum (Section 15 + Section 17). Live search against
// crm_accounts (debounced) so reps can auto-link a Group lead to an
// existing Company. Picking a row stamps `account_id` and autofills
// `website`; typing a brand-new business name leaves `account_id` empty
// (a fresh crm_accounts row will be created downstream during convert).
interface CompanyMatch { id: string; name: string; website: string | null }
interface CompanyTypeaheadFieldProps {
  label: string;
  required?: boolean;
  value: string;
  selectedAccountId: string;
  onValueChange: (next: string) => void;
  onPickAccount: (account: CompanyMatch | null) => void;
  search: (q: string) => Promise<CompanyMatch[]>;
  error?: string;
  placeholder?: string;
}

function CompanyTypeaheadField({
  label,
  required,
  value,
  selectedAccountId,
  onValueChange,
  onPickAccount,
  search,
  error,
  placeholder,
}: CompanyTypeaheadFieldProps) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Outside-click closes the menu — keeps the rest of the form clickable.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced search (~250ms). When the picker is closed we never query.
  useEffect(() => {
    if (!open) return;
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(() => {
      search(trimmed)
        .then((rows) => setMatches(rows))
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [value, open, search]);

  const linked = Boolean(selectedAccountId);

  return (
    <div ref={wrapRef}>
      <label className="block text-sm font-medium text-th-text-secondary mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
          <Building2 className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            // Editing the name after a link breaks the link — reps
            // shouldn't keep an account_id pinned to a different name.
            if (linked) onPickAccount(null);
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          required={required}
          placeholder={placeholder}
          className={`w-full border rounded-lg pl-10 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-th-border'
          }`}
        />
        {linked && (
          <button
            type="button"
            onClick={() => {
              onPickAccount(null);
              onValueChange('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-th-text-tertiary hover:text-th-text-primary"
            aria-label="Unlink company"
            title="Unlink company"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {linked && (
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <Check className="w-3 h-3" /> Linked to existing Company
        </p>
      )}
      {open && value.trim().length >= 2 && (
        <div className="relative">
          <div className="absolute z-20 mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-lg overflow-hidden">
            {loading && (
              <div className="px-3 py-2 text-xs text-th-text-tertiary flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching companies…
              </div>
            )}
            {!loading && matches.length === 0 && (
              <div className="px-3 py-2 text-xs text-th-text-tertiary">
                No matches — saving will create a new Company.
              </div>
            )}
            {!loading &&
              matches.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    onPickAccount(m);
                    onValueChange(m.name);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-secondary border-t border-th-border first:border-t-0"
                >
                  <div className="text-sm text-th-text-primary">{m.name}</div>
                  {m.website && (
                    <div className="text-xs text-th-text-tertiary truncate">{m.website}</div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function LeadForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isEdit,
  onDirty,
  saveStatus = 'idle',
  saveErrorMessage,
}: LeadFormProps) {
  const { referralService, outsideAdvisorService, accountService, orgId } = useCRMService();
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [leadSources, setLeadSources] = useState<LeadSourceType[]>([]);
  const [loadingLeadSources, setLoadingLeadSources] = useState(true);
  const [referralPartners, setReferralPartners] = useState<{ id: string; name: string }[]>([]);
  const [outsideAdvisors, setOutsideAdvisors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Round 13 follow-up (2026-05-15): the global carrier seed is narrowed
    // to Sedera + Zion Health by `20260620560000_crm_p7_carriers_zion_sedera_only.sql`.
    // Per-org carriers (org_id IS NOT NULL) are still surfaced if an admin
    // added them; this fetch just relays the active set.
    carrierService.getCarriers({ is_active: true }).then((data: InsuranceCarrier[]) => {
      setCarriers(data);
      setLoadingCarriers(false);
    }).catch(() => setLoadingCarriers(false));

    leadSourceService.listActive().then((data: LeadSourceType[]) => {
      setLeadSources(data);
      setLoadingLeadSources(false);
    }).catch(() => setLoadingLeadSources(false));
  }, []);

  // Load attribution pickers lazily once the org is known. Both queries are
  // cheap (<1KB payload) but we still gate on orgId so CRMContext-less previews
  // don't explode.
  useEffect(() => {
    if (!orgId) return;
    referralService.getPartners(true).then((rows) => {
      setReferralPartners(rows.map((r) => ({ id: r.id, name: r.name })));
    }).catch(() => setReferralPartners([]));
    outsideAdvisorService.getAdvisors(true).then((rows) => {
      setOutsideAdvisors(rows.map((r) => ({ id: r.id, name: r.name })));
    }).catch(() => setOutsideAdvisors([]));
  }, [orgId, referralService, outsideAdvisorService]);

  const carrierOptions = [
    { value: '', label: loadingCarriers ? 'Loading carriers...' : 'Select Carrier...' },
    ...carriers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const leadSourceOptions = loadingLeadSources
    ? [{ value: '', label: 'Loading lead sources...' }]
    : leadSources.map((s) => ({ value: s.slug, label: s.label }));

  const referralPartnerOptions = [
    { value: '', label: referralPartners.length ? 'Select referral partner...' : 'No partners yet' },
    ...referralPartners.map((p) => ({ value: p.id, label: p.name })),
  ];
  const outsideAdvisorOptions = [
    { value: '', label: outsideAdvisors.length ? 'Select outside advisor...' : 'No advisors yet' },
    ...outsideAdvisors.map((p) => ({ value: p.id, label: p.name })),
  ];

  const { values, errors, loading, submitError, handleChange, handleSubmit, setFieldValue, retry } = useForm<LeadFormValues>({
    initialValues: { ...defaultValues, ...initialValues } as LeadFormValues,
    validate: (vals) => {
      const errs: Partial<Record<keyof LeadFormValues, string>> = {};
      if (!vals.first_name.trim()) errs.first_name = 'First name is required';
      if (!vals.last_name.trim()) errs.last_name = 'Last name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Invalid email format';
      if (!vals.lead_source.trim()) errs.lead_source = 'Lead source is required';
      // Round 10 Addendum (Section 17): Group requires Business Name.
      if (vals.coverage_preference === 'group' && !vals.business_name.trim()) {
        errs.business_name = 'Business name is required for Group coverage';
      }
      return errs;
    },
    onSubmit,
  });

  const wrappedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onDirty?.();
    handleChange(e);
  };

  const isGroup = values.coverage_preference === 'group';

  // Live company search bound to the current org. Returns the top 8 matches
  // ordered by recency from `crm_accounts` (Section 15 typeahead source).
  const searchCompanies = useMemo(
    () => async (q: string): Promise<CompanyMatch[]> => {
      if (!orgId) return [];
      const { accounts } = await accountService.getAccounts({ search: q }, 8, 0);
      return accounts.map((a) => ({
        id: a.id,
        name: a.name,
        website: a.website ?? null,
      }));
    },
    [accountService, orgId],
  );

  // Reset the Group-only fields if the rep flips Coverage Preferred away
  // from Group — leaving stale business_name / website / account_id behind
  // would silently leak into form_data on submit.
  useEffect(() => {
    if (isGroup) return;
    if (values.business_name || values.website || values.account_id) {
      setFieldValue('business_name', '');
      setFieldValue('website', '');
      setFieldValue('account_id', '');
    }
  }, [isGroup, values.business_name, values.website, values.account_id, setFieldValue]);

  const displayError = submitError || (saveStatus === 'error' ? saveErrorMessage : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ─── Identity ─── */}
      <SectionDivider label="Identity" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" name="first_name" value={values.first_name} onChange={wrappedChange} error={errors.first_name} required placeholder="John" />
        <InputField label="Last Name" name="last_name" value={values.last_name} onChange={wrappedChange} error={errors.last_name} required placeholder="Doe" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Email" name="email" type="email" value={values.email} onChange={wrappedChange} error={errors.email} required placeholder="john@example.com" />
        <InputField label="Phone" name="phone" type="tel" value={values.phone} onChange={wrappedChange} placeholder="(555) 123-4567" />
      </div>

      {/* ─── Location ─── */}
      <SectionDivider label="Location" />
      <div className="grid grid-cols-3 gap-4">
        <InputField label="City" name="city" value={values.city} onChange={wrappedChange} placeholder="Denver" />
        <InputField label="State" name="state" value={values.state} onChange={wrappedChange} placeholder="CO" />
        <InputField label="Zip Code" name="zip_code" value={values.zip_code} onChange={wrappedChange} placeholder="80202" />
      </div>

      {/* ─── Plan & Coverage ─── */}
      <SectionDivider label="Plan & Coverage" />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Plan Type" name="plan_type" value={values.plan_type} onChange={wrappedChange} options={PLAN_TYPE_OPTIONS} />
        <SelectField label="Carrier" name="carrier_id" value={values.carrier_id} onChange={wrappedChange} options={carrierOptions} disabled={loadingCarriers} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Coverage Preferred" name="coverage_preference" value={values.coverage_preference} onChange={wrappedChange} options={COVERAGE_OPTIONS} />
        <SelectField label="Group Type" name="group_type" value={values.group_type} onChange={wrappedChange} options={GROUP_TYPE_OPTIONS} />
      </div>
      {isGroup && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-th-accent-500/30 bg-th-accent-500/5 p-3">
          <CompanyTypeaheadField
            label="Business Name"
            required
            value={values.business_name}
            selectedAccountId={values.account_id}
            onValueChange={(next) => {
              onDirty?.();
              setFieldValue('business_name', next);
            }}
            onPickAccount={(account) => {
              onDirty?.();
              setFieldValue('account_id', account?.id ?? '');
              if (account?.website && !values.website) {
                setFieldValue('website', account.website);
              }
            }}
            search={searchCompanies}
            error={errors.business_name}
            placeholder="Start typing a company…"
          />
          <InputField
            label="Website"
            name="website"
            value={values.website}
            onChange={wrappedChange}
            placeholder="https://example.com"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Current Insurance" name="current_insurance" value={values.current_insurance} onChange={wrappedChange} placeholder="e.g. Blue Cross" />
        <InputField label="Monthly Premium" name="monthly_premium" value={values.monthly_premium} onChange={wrappedChange} placeholder="e.g. $350" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Tobacco Status" name="tobacco_status" value={values.tobacco_status} onChange={wrappedChange} options={TOBACCO_OPTIONS} />
        <InputField label="Original Effective Date" name="original_effective_date" type="date" value={values.original_effective_date} onChange={wrappedChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Household Size" name="household_size" type="number" value={values.household_size} onChange={wrappedChange} placeholder="1" />
        <SelectField label="Primary Concern" name="primary_concern" value={values.primary_concern} onChange={wrappedChange} options={CONCERN_OPTIONS} />
      </div>

      {/* ─── Financial (for edit) ─── */}
      {isEdit && (
        <>
          <SectionDivider label="Financial" />
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Full Premium" name="premium_amount" type="number" value={values.premium_amount} onChange={wrappedChange} placeholder="0.00" />
            <InputField label="Subsidy Amount" name="subsidy_amount" type="number" value={values.subsidy_amount} onChange={wrappedChange} placeholder="0.00" />
            <InputField label="Member Responsibility" name="member_responsibility" type="number" value={values.member_responsibility} onChange={wrappedChange} placeholder="0.00" />
          </div>
        </>
      )}

      {/* ─── Preferences ─── */}
      <SectionDivider label="Preferences" />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Contact Preference" name="contact_preference" value={values.contact_preference} onChange={wrappedChange} options={CONTACT_PREF_OPTIONS} />
        <InputField label="Source / CTA" name="source_cta" value={values.source_cta} onChange={wrappedChange} placeholder="e.g. Website Hero Banner" />
      </div>
      <InputField label="Tags" name="tags" value={values.tags} onChange={wrappedChange} placeholder="Comma-separated tags" />

      {/* ─── Sales Plan 2026 Attribution ───
          Required picklist — drives the Inhouse vs Self-Generated split in every 2026 report.
          Server-side trigger crm_validate_lead_source rejects unknown slugs and derives
          is_self_generated from the lookup so reporting cannot drift from this picker. */}
      <SectionDivider label="Attribution" />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Lead Source"
          name="lead_source"
          value={values.lead_source}
          onChange={wrappedChange}
          options={leadSourceOptions}
          error={errors.lead_source}
          required
          disabled={loadingLeadSources}
        />
        {values.lead_source === 'referrals' && (
          <SelectField
            label="Referral Partner"
            name="referral_partner_id"
            value={values.referral_partner_id}
            onChange={wrappedChange}
            options={referralPartnerOptions}
          />
        )}
        {values.lead_source === 'outside_advisors' && (
          <SelectField
            label="Outside Advisor"
            name="outside_advisor_id"
            value={values.outside_advisor_id}
            onChange={wrappedChange}
            options={outsideAdvisorOptions}
          />
        )}
      </div>

      {/* ─── Admin (edit-only) ─── */}
      {isEdit && (
        <>
          <SectionDivider label="Admin" />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Priority" name="priority" value={values.priority} onChange={wrappedChange} options={PRIORITY_OPTIONS} />
            <InputField label="Lead Score" name="lead_score" type="number" value={values.lead_score} onChange={wrappedChange} placeholder="0-100" />
          </div>
          <InputField label="Next Follow-up" name="next_followup_at" type="datetime-local" value={values.next_followup_at} onChange={wrappedChange} />
        </>
      )}

      {/* ─── Error Recovery ─── */}
      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{displayError}</p>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* ─── Actions ─── */}
      <div className="flex items-center gap-3 pt-4 border-t border-th-border sticky bottom-0 bg-surface-primary pb-2 z-10">
        <SubmitButton loading={loading} label={submitLabel} loadingLabel="Saving..." />
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
        >
          Cancel
        </button>
        <SaveIndicator status={saveStatus} errorMessage={saveErrorMessage} />
      </div>
    </form>
  );
}
