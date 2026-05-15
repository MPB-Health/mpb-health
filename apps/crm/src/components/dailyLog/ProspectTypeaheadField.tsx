import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, User, Building2, X, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';

// ---------------------------------------------------------------------------
// CRM rebuild Round 12 (2026-05-14) — Section 15 Round 8 reinforcement
// ---------------------------------------------------------------------------
// Daily Log manual conversation rows MUST capture the Person / Company
// spoken with. Spec is explicit: typeahead, not free text. This component
// queries crm_leads (lead_submissions) + crm_contacts + crm_recruiting_records
// + crm_accounts in parallel and hands the picked record (id + type +
// resolved company name) back to the caller.
//
// The selected record powers Round 12 search ranking and the
// anti-fabrication corroboration view: a manual `call` row tagged with
// linked_record_id = <lead.id> can be cross-checked against same-day
// auto-captured calls/emails/SMS for the same lead.
//
// Anti-fabrication note: we deliberately do NOT show a "create new"
// fallback in this picker. If the rep can't find the prospect in the
// CRM, they should add the lead first via /leads/new (Section 15 spec).

export type ProspectRecordType = 'lead' | 'contact' | 'recruit' | 'account';

export interface ProspectMatch {
  id: string;
  type: ProspectRecordType;
  name: string;
  company: string | null;
  subtitle?: string;
}

interface Props {
  value: ProspectMatch | null;
  onChange: (match: ProspectMatch | null) => void;
  /** Spec: typeahead is required for conversation rows. Renders the * marker. */
  required?: boolean;
  placeholder?: string;
}

const TYPE_ICON: Record<ProspectRecordType, typeof User> = {
  lead: User,
  contact: User,
  recruit: Briefcase,
  account: Building2,
};

const TYPE_LABEL: Record<ProspectRecordType, string> = {
  lead: 'Lead',
  contact: 'Member',
  recruit: 'Recruit',
  account: 'Company',
};

export function ProspectTypeaheadField({ value, onChange, required, placeholder }: Props) {
  const { activeOrgId } = useOrg();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ProspectMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open || !activeOrgId) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const safe = trimmed.replace(/[%_,]/g, '\\$&');
        // Four parallel scoped queries. Each one is small (limit 5).
        const [leadsRes, contactsRes, recruitsRes, accountsRes] = await Promise.all([
          supabase
            .from('lead_submissions')
            .select('id, first_name, last_name, email, phone, company:metadata->>company')
            .eq('org_id', activeOrgId)
            .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
            .limit(5),
          supabase
            .from('crm_contacts')
            .select('id, first_name, last_name, email, account_id, account:crm_accounts(name)')
            .eq('org_id', activeOrgId)
            .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
            .limit(5),
          supabase
            .from('crm_recruiting_records')
            .select('id, first_name, last_name, email, agency_name')
            .eq('org_id', activeOrgId)
            .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%,agency_name.ilike.%${safe}%`)
            .limit(5),
          supabase
            .from('crm_accounts')
            .select('id, name, industry, website')
            .eq('org_id', activeOrgId)
            .ilike('name', `%${safe}%`)
            .limit(5),
        ]);

        const next: ProspectMatch[] = [];
        type LeadRow = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; company?: string | null };
        for (const row of (leadsRes.data ?? []) as LeadRow[]) {
          next.push({
            id: row.id,
            type: 'lead',
            name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Unnamed lead',
            company: row.company ?? null,
            subtitle: row.email || row.phone || undefined,
          });
        }
        // Supabase's generic types treat embedded joins as arrays even when
        // the underlying FK is many-to-one (crm_contacts.account_id → crm_accounts.id),
        // so PostgREST returns a single object at runtime. Cast through `unknown` to
        // bypass the conservative inferred shape.
        type ContactRow = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; account?: { name: string | null } | null };
        for (const row of (contactsRes.data ?? []) as unknown as ContactRow[]) {
          next.push({
            id: row.id,
            type: 'contact',
            name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Unnamed member',
            company: row.account?.name ?? null,
            subtitle: row.email || undefined,
          });
        }
        type RecruitRow = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; agency_name?: string | null };
        for (const row of (recruitsRes.data ?? []) as RecruitRow[]) {
          next.push({
            id: row.id,
            type: 'recruit',
            name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Unnamed recruit',
            company: row.agency_name ?? null,
            subtitle: row.email || undefined,
          });
        }
        type AccountRow = { id: string; name: string; industry?: string | null; website?: string | null };
        for (const row of (accountsRes.data ?? []) as AccountRow[]) {
          next.push({
            id: row.id,
            type: 'account',
            name: row.name,
            company: row.name,
            subtitle: row.industry || row.website || undefined,
          });
        }
        setMatches(next);
      } catch (e) {
        console.warn('[ProspectTypeahead] query failed', e);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, activeOrgId]);

  const inputValue = value ? value.name : query;

  return (
    <div ref={wrapRef}>
      <label className="block text-xs font-medium text-th-text-secondary mb-1">
        Person / Company spoken with
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            if (value) onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!value) setOpen(true);
          }}
          required={required}
          placeholder={placeholder ?? 'Search leads, members, recruits, or companies…'}
          className="w-full border border-th-border rounded-lg pl-10 pr-9 py-2 text-sm bg-surface-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-th-text-tertiary hover:text-th-text-primary"
            aria-label="Clear"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="mt-1 text-[11px] text-th-text-tertiary">
          {TYPE_LABEL[value.type]}
          {value.company ? ` · ${value.company}` : ''}
        </p>
      )}
      {open && query.trim().length >= 2 && (
        <div className="relative">
          <div className="absolute z-20 mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-xs text-th-text-tertiary flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching CRM…
              </div>
            )}
            {!loading && matches.length === 0 && (
              <div className="px-3 py-2 text-xs text-th-text-tertiary">
                No matches. Add the prospect under Leads first (typeahead is
                required — Section 15 anti-fabrication).
              </div>
            )}
            {!loading &&
              matches.map((m) => {
                const Icon = TYPE_ICON[m.type];
                return (
                  <button
                    type="button"
                    key={`${m.type}:${m.id}`}
                    onClick={() => {
                      onChange(m);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-secondary border-t border-th-border first:border-t-0 flex items-start gap-2"
                  >
                    <Icon className="w-4 h-4 mt-0.5 text-th-text-tertiary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-th-text-primary truncate">
                        {m.name}
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-th-text-tertiary">
                          {TYPE_LABEL[m.type]}
                        </span>
                      </div>
                      {(m.company || m.subtitle) && (
                        <div className="text-xs text-th-text-tertiary truncate">
                          {[m.company, m.subtitle].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProspectTypeaheadField;
