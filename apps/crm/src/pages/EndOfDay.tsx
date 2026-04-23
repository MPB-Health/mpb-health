import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { GradientHeader } from '@mpbhealth/ui';
import { Plus, Trash2, Send, CheckCircle2, Loader2, XCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { sanitizeSearchInput, type ActivityType } from '@mpbhealth/crm-core';
import { HelpBanner } from '../components/help';

// Sales Plan 2026 Phase 5: every PerformanceReport column has a matching
// activity_type row here, so a rep's EOD sheet can feed every metric the
// monthly report reads from `lead_activities`. Ordering roughly mirrors
// the deck's column order (inbound → outbound → LinkedIn → community →
// proposal), which makes the EOD form easier to skim at end of day.
const EOD_ACTIVITY_TYPES = [
  'call',
  'email',
  'meeting',
  'sms',
  'text',
  'live_chat',
  'linkedin_connection_sent',
  'linkedin_connection_accepted',
  'linkedin_message',
  'linkedin_post',
  'linkedin_engagement',
  'linkedin_short',
  'presentation',
  'networking_event',
  'community_outreach',
  'referral_requested',
  'note',
  'proposal_sent',
] as const satisfies readonly ActivityType[];

type EodActivityType = (typeof EOD_ACTIVITY_TYPES)[number];

const ACTIVITY_TYPE_LABELS: Record<EodActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  sms: 'SMS',
  text: 'Text message',
  live_chat: 'Live chat',
  linkedin_connection_sent: 'LinkedIn — connection sent',
  linkedin_connection_accepted: 'LinkedIn — connection accepted',
  linkedin_message: 'LinkedIn — message',
  linkedin_post: 'LinkedIn — original post',
  linkedin_engagement: 'LinkedIn — shared post',
  linkedin_short: 'LinkedIn — short / video',
  presentation: 'Presentation',
  networking_event: 'Networking event',
  community_outreach: 'Community outreach',
  referral_requested: 'Referral requested',
  note: 'Note',
  proposal_sent: 'Proposal sent',
};

function defaultTitleForType(type: EodActivityType): string {
  const labels: Record<EodActivityType, string> = {
    call: 'Phone call',
    email: 'Email',
    meeting: 'Meeting',
    sms: 'SMS text',
    text: 'Text message',
    live_chat: 'Live chat',
    linkedin_connection_sent: 'LinkedIn connection sent',
    linkedin_connection_accepted: 'LinkedIn connection accepted',
    linkedin_message: 'LinkedIn message',
    linkedin_post: 'LinkedIn original post',
    linkedin_engagement: 'LinkedIn shared post',
    linkedin_short: 'LinkedIn short/video',
    presentation: 'Presentation',
    networking_event: 'Networking event',
    community_outreach: 'Community outreach',
    referral_requested: 'Referral requested',
    note: 'Note',
    proposal_sent: 'Proposal sent',
  };
  return labels[type];
}

interface LeadSearchRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function formatLeadLabel(row: LeadSearchRow): string {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} · ${row.email}` : row.email;
}

function LeadSearchDropdown({
  rowKey,
  selectedId,
  selectedLabel,
  onSelect,
  disabled,
}: {
  rowKey: string;
  selectedId: string | null;
  selectedLabel: string;
  onSelect: (id: string | null, label: string) => void;
  disabled?: boolean;
}) {
  const { supabase } = useCRMService();
  const { activeOrgId } = useOrg();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 250);
  const rootRef = useRef<HTMLDivElement>(null);

  const safe = useMemo(() => sanitizeSearchInput(debounced), [debounced]);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['end-of-day', 'lead_submissions', activeOrgId, rowKey, safe],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      return (data ?? []) as unknown as LeadSearchRow[];
    },
    enabled: !!activeOrgId && open && safe.length >= 2,
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-[200px] flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          if (!open) setQuery('');
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-left text-sm text-th-text-primary hover:bg-th-accent-50/30 dark:hover:bg-th-accent-900/10 disabled:opacity-50"
      >
        <span className={selectedLabel ? 'truncate' : 'text-th-text-tertiary truncate'}>
          {selectedLabel || 'Search leads…'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-th-text-tertiary transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-lg border border-th-border bg-surface-primary py-1 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedId) onSelect(null, '');
            }}
            placeholder="Type 2+ characters…"
            className="w-full border-b border-th-border bg-transparent px-3 py-2 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none"
          />
          <div className="max-h-52 overflow-y-auto">
            {isFetching && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-th-text-tertiary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </div>
            )}
            {!isFetching && safe.length < 2 && (
              <p className="px-3 py-2 text-xs text-th-text-tertiary">Enter at least 2 characters to search.</p>
            )}
            {!isFetching &&
              safe.length >= 2 &&
              options.length === 0 && (
                <p className="px-3 py-2 text-xs text-th-text-tertiary">No leads found.</p>
              )}
            {options.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  onSelect(row.id, formatLeadLabel(row));
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full px-3 py-2 text-left text-sm text-th-text-primary hover:bg-th-accent-50/50 dark:hover:bg-th-accent-900/20"
              >
                <div className="font-medium truncate">{formatLeadLabel(row)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormRow {
  key: string;
  leadId: string | null;
  leadLabel: string;
  activityType: EodActivityType;
  title: string;
  description: string;
}

function createEmptyRow(activityType: EodActivityType = 'call'): FormRow {
  return {
    key: crypto.randomUUID(),
    leadId: null,
    leadLabel: '',
    activityType,
    title: defaultTitleForType(activityType),
    description: '',
  };
}

export default function EndOfDay() {
  const { activityService } = useCRMService();
  const { activeOrgId } = useOrg();
  const [rows, setRows] = useState<FormRow[]>(() => [createEmptyRow()]);
  const [lastResult, setLastResult] = useState<{ success: number; failed: number } | null>(null);

  const bulkMutation = useMutation({
    mutationFn: (
      entries: Array<{
        lead_id: string;
        activity_type: ActivityType;
        title: string;
        description?: string;
      }>
    ) => activityService.logBulkActivities(entries),
    onSuccess: (result) => {
      setLastResult(result);
      if (result.failed === 0) {
        toast.success(`Logged ${result.success} activit${result.success === 1 ? 'y' : 'ies'}.`);
        setRows([createEmptyRow()]);
      } else {
        toast.error(`${result.failed} entr${result.failed === 1 ? 'y' : 'ies'} failed to save.`);
      }
    },
    onError: () => {
      setLastResult(null);
      toast.error('Bulk log failed. Try again.');
    },
  });

  const updateRow = useCallback((key: string, patch: Partial<FormRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
    setLastResult(null);
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
    setLastResult(null);
  };

  const handleSubmitAll = () => {
    setLastResult(null);
    const entries = rows
      .filter((r) => r.leadId && r.title.trim())
      .map((r) => ({
        lead_id: r.leadId as string,
        activity_type: r.activityType as ActivityType,
        title: r.title.trim(),
        description: r.description.trim() || undefined,
      }));

    if (entries.length === 0) {
      toast.error('Add at least one row with a lead and title.');
      return;
    }

    const skipped = rows.length - entries.length;
    if (skipped > 0) {
      toast(`Skipping ${skipped} incomplete row${skipped === 1 ? '' : 's'}.`, { icon: 'ℹ️' });
    }

    bulkMutation.mutate(entries);
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="End of day"
        subtitle="Log multiple lead activities at once before you sign off."
      />
      <HelpBanner pageKey="end-of-day" title="Welcome to End of Day" tip="Complete your daily wrap-up here. Review today's activities, update lead statuses, log final notes, and plan tomorrow's priorities before you sign off." />

      {bulkMutation.isPending && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-th-border">
          <div className="h-full w-1/3 animate-[eod-progress_1s_ease-in-out_infinite] rounded-full bg-th-accent-500" />
        </div>
      )}

      {lastResult && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            lastResult.failed === 0
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
              : 'border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
          }`}
        >
          {lastResult.failed === 0 ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span>
            <strong>{lastResult.success}</strong> saved
            {lastResult.failed > 0 && (
              <>
                {' '}
                · <strong>{lastResult.failed}</strong> failed
              </>
            )}
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-th-border bg-surface-primary p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-th-text-secondary">One row per activity. Incomplete rows are ignored.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addRow}
              disabled={bulkMutation.isPending || !activeOrgId}
              className="inline-flex items-center gap-2 rounded-lg border border-th-border bg-surface-secondary px-3 py-2 text-sm font-medium text-th-text-primary hover:bg-th-accent-50/40 dark:hover:bg-th-accent-900/20 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add row
            </button>
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={bulkMutation.isPending || !activeOrgId}
              className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
            >
              {bulkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {bulkMutation.isPending ? 'Submitting…' : 'Submit all'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-xl border border-th-border bg-surface-secondary/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-th-text-tertiary">
                  Row {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1 || bulkMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-40"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <LeadSearchDropdown
                  rowKey={row.key}
                  selectedId={row.leadId}
                  selectedLabel={row.leadLabel}
                  disabled={bulkMutation.isPending}
                  onSelect={(id, label) =>
                    updateRow(row.key, { leadId: id, leadLabel: label })
                  }
                />

                <select
                  value={row.activityType}
                  disabled={bulkMutation.isPending}
                  onChange={(e) => {
                    const activityType = e.target.value as EodActivityType;
                    updateRow(row.key, {
                      activityType,
                      title: defaultTitleForType(activityType),
                    });
                  }}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary lg:max-w-[220px] focus:outline-none focus:ring-1 focus:ring-th-accent-500 disabled:opacity-50"
                >
                  {EOD_ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ACTIVITY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={row.title}
                disabled={bulkMutation.isPending}
                onChange={(e) => updateRow(row.key, { title: e.target.value })}
                placeholder="Title"
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500 disabled:opacity-50"
              />

              <textarea
                value={row.description}
                disabled={bulkMutation.isPending}
                onChange={(e) => updateRow(row.key, { description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full resize-y rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes eod-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
