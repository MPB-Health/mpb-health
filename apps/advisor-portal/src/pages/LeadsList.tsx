import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { Users, Search, RefreshCw, Loader2, ChevronRight } from 'lucide-react';
import { Button, cn } from '@mpbhealth/ui';
import { supabase } from '@mpbhealth/database';
import { advisorLeadService, type AssignedLeadView } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { AdvisorPageLoader } from '../components/loading';

const PRIORITY_CLASS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200/60',
  medium: 'bg-amber-50 text-amber-800 border-amber-200/60',
  low: 'bg-green-50 text-green-700 border-green-200/60',
};

type SortKey = 'created_desc' | 'activity_desc';

export default function LeadsList() {
  useAdvisorPageDebugLog('LeadsList');
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('created_desc');

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['assignedLeads', userId],
    queryFn: () => advisorLeadService.getAssignedLeads(userId!),
    enabled: Boolean(advisorReady && userId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`assigned-leads-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_submissions',
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['assignedLeads', userId] });
          void queryClient.invalidateQueries({ queryKey: ['advisorOverview'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const filtered = useMemo(() => {
    let list = [...leads];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone ?? '').includes(q),
      );
    }
    if (priorityFilter) {
      list = list.filter((l) => (l.priority ?? '').toLowerCase() === priorityFilter);
    }
    list.sort((a, b) => {
      if (sort === 'activity_desc') {
        const at = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
        const bt = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
        return bt - at;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [leads, search, priorityFilter, sort]);

  if (!advisorReady || (isLoading && leads.length === 0)) {
    return <AdvisorPageLoader message="Loading assigned leads…" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary flex items-center gap-2">
            <Users className="w-7 h-7 text-th-accent-600" />
            Assigned leads
          </h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Leads assigned to you from MPB Health CRM
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="search"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-th-border bg-surface-primary text-sm"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="min-h-[42px] px-3 rounded-lg border border-th-border bg-surface-primary text-sm"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="min-h-[42px] px-3 rounded-lg border border-th-border bg-surface-primary text-sm"
        >
          <option value="created_desc">Newest first</option>
          <option value="activity_desc">Recent activity</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-th-border bg-surface-primary p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-th-text-tertiary mb-3" />
          <p className="text-th-text-primary font-medium">No assigned leads</p>
          <p className="text-sm text-th-text-secondary mt-1">
            {leads.length === 0
              ? 'When CRM assigns a lead to you, it will appear here.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: AssignedLeadView }) {
  const priorityKey = (lead.priority ?? '').toLowerCase();
  const activityLabel = lead.last_activity_at
    ? formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })
    : null;

  return (
    <Link
      to={`/leads/${lead.id}`}
      className="block rounded-xl border border-th-border bg-surface-primary p-4 hover:border-th-accent-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-th-text-primary truncate">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-sm text-th-text-secondary truncate">{lead.email}</p>
          {lead.phone && (
            <p className="text-sm text-th-text-tertiary mt-0.5">{lead.phone}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-th-text-tertiary shrink-0 group-hover:text-th-accent-600" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {lead.pipeline_stage && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-th-accent-50 text-th-accent-700 border border-th-accent-200/50">
            {lead.pipeline_stage}
          </span>
        )}
        {lead.priority && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full border',
              PRIORITY_CLASS[priorityKey] ?? 'bg-neutral-50 text-neutral-600 border-neutral-200/60',
            )}
          >
            {lead.priority}
          </span>
        )}
        {lead.lead_source && (
          <span className="text-xs text-th-text-tertiary">{lead.lead_source}</span>
        )}
        <span className="text-xs text-th-text-tertiary ml-auto">
          {activityLabel ? `Active ${activityLabel}` : `Added ${format(new Date(lead.created_at), 'MMM d, yyyy')}`}
        </span>
      </div>
    </Link>
  );
}
