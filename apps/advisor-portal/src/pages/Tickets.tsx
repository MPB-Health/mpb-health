import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useTicketAuth } from '../components/TicketAuthWrapper';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Button, cn } from '@mpbhealth/ui';
import {
  ticketService,
  type TicketPriority,
  type ListTicketsOptions,
} from '@mpbhealth/advisor-core';
import {
  subjectPreview,
  formatStatusLabel,
  STATUS_TABLE_CLASS,
  PRIORITY_TABLE_CLASS,
} from '../components/tickets/advisorTicketUi';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'updated_asc', label: 'Stale (least recent)' },
] as const;

type ListSort = (typeof SORT_OPTIONS)[number]['value'];

const SELECT_FIELD = cn(
  'min-h-[42px] w-full pl-3 pr-9 py-2.5 rounded-lg border border-th-border bg-surface-primary',
  'text-sm font-medium text-th-text-primary appearance-none cursor-pointer shadow-sm',
  'hover:border-th-accent-300 focus:outline-none focus:ring-2 focus:ring-th-accent-500/25 focus:border-th-accent-400',
);

function statusCellClass(status: string): string {
  return (
    STATUS_TABLE_CLASS[status] ??
    'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/30'
  );
}

function priorityCellClass(priority: string): string {
  return (
    PRIORITY_TABLE_CLASS[priority] ??
    'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/30'
  );
}

function shortUpdatedLabel(iso: string | undefined): { label: string; title: string } {
  if (!iso) return { label: '—', title: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: '—', title: '' };
  const abs = formatDistanceToNow(d, { addSuffix: true });
  const diff = Date.now() - d.getTime();
  if (diff < 0) {
    const label = format(d, 'MMM d');
    return { label, title: format(d, 'PPp') };
  }
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  let label: string;
  if (m < 1) label = 'now';
  else if (m < 60) label = `${m}m`;
  else if (h < 24) label = `${h}h`;
  else if (day < 7) label = `${day}d`;
  else label = format(d, 'MMM d');
  return { label, title: `${format(d, 'PPp')} · ${abs}` };
}

export default function Tickets() {
  useAdvisorPageDebugLog('Tickets');
  const navigate = useNavigate();
  const location = useLocation();
  const { advisorReady } = useAdvisorQueryReady();
  const { executeWithAuth } = useTicketAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listError, setListError] = useState('');
  const [slowListLoad, setSlowListLoad] = useState(false);

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') ?? '');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') ?? '');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const [searchDebounced, setSearchDebounced] = useState(() => searchParams.get('q') ?? '');
  const [sort, setSort] = useState<ListSort>(() => {
    const s = searchParams.get('sort') as ListSort | null;
    return s && SORT_OPTIONS.some((o) => o.value === s) ? s : 'created_desc';
  });

  const mountedRef = useRef(true);
  const categoriesRequestedRef = useRef(false);
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const queryClient = useQueryClient();

  const syncListParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, val] of Object.entries(patch)) {
            if (val == null || val === '') next.delete(key);
            else next.set(key, val);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const {
    data: ticketsPages,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: ticketsIsError,
    error: ticketsQueryError,
    refetch: refetchTickets,
    isFetching,
  } = useInfiniteQuery({
    queryKey: [
      'advisorTickets',
      statusFilter,
      priorityFilter,
      categoryFilter,
      searchDebounced,
      sort,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      executeWithAuth(() =>
        ticketService.getMyTickets(
          {
            status: (statusFilter || undefined) as ListTicketsOptions['status'],
            priority: (priorityFilter || undefined) as TicketPriority | undefined,
            search: searchDebounced.trim() || undefined,
            page: pageParam,
            perPage: PAGE_SIZE,
            sort,
            category: categoryFilter.trim() || undefined,
          },
          { signal },
        ),
      ),
    enabled: advisorReady,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
    getNextPageParam: (lastPage) =>
      lastPage.tickets.length < lastPage.per_page ? undefined : lastPage.page + 1,
  });

  const tickets = ticketsPages?.pages.flatMap((p) => p.tickets) ?? [];
  const totalCount = ticketsPages?.pages[0]?.total ?? 0;

  /** Session not ready yet, or list query in flight — avoid “Showing 0” while tickets are still loading. */
  const sessionGateLoading = !advisorReady;
  const listLoading = sessionGateLoading || loading;

  useEffect(() => {
    if (!ticketsIsError) {
      setListError('');
      return;
    }
    setListError(
      'We\u2019re having trouble loading your tickets right now. Please check your connection and try again.',
    );
  }, [ticketsIsError, ticketsQueryError]);

  useEffect(() => {
    if (!loading || listError) {
      setSlowListLoad(false);
      return;
    }
    const t = window.setTimeout(() => setSlowListLoad(true), 12_000);
    return () => {
      window.clearTimeout(t);
      setSlowListLoad(false);
    };
  }, [loading, listError]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    syncListParams({
      q: searchDebounced.trim() || null,
      status: statusFilter || null,
      priority: priorityFilter || null,
      category: categoryFilter.trim() || null,
      sort: sort === 'created_desc' ? null : sort,
    });
  }, [searchDebounced, statusFilter, priorityFilter, categoryFilter, sort, syncListParams]);

  const loadMore = useCallback(() => {
    if (hasNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    const el = loadSentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, loadMore, tickets.length]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        statusFilter ||
          priorityFilter ||
          categoryFilter.trim() ||
          searchInput.trim() ||
          sort !== 'created_desc',
      ),
    [statusFilter, priorityFilter, categoryFilter, searchInput, sort],
  );

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSearchInput('');
    setSearchDebounced('');
    setSort('created_desc');
  }, []);

  useEffect(() => {
    if (!advisorReady || loading || categoriesRequestedRef.current) return;

    categoriesRequestedRef.current = true;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      executeWithAuth(() => ticketService.getCategories())
        .then((nextCategories) => {
          if (!cancelled && mountedRef.current) setCategories(nextCategories);
        })
        .catch(() => {
          if (!cancelled) categoriesRequestedRef.current = false;
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [advisorReady, loading, executeWithAuth]);

  const refetchingList = isFetching && !loading;

  const openRow = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select')) return;
    if (e.ctrlKey || e.metaKey) {
      window.open(`/tickets/${id}`, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(`/tickets/${id}`, {
      state: { ticketsReturnTo: `${location.pathname}${location.search}` },
    });
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <header className="relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-th-border bg-surface-primary p-6 shadow-sm dark:border-neutral-700/60">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
              <Ticket size={24} className="text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-th-text-primary">Tickets</h1>
                {totalCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-th-accent-200/80 bg-th-accent-50 px-2 py-0.5 text-[11px] font-semibold text-th-accent-800 dark:border-th-accent-900/50 dark:bg-th-accent-950/40 dark:text-th-accent-200">
                    {totalCount.toLocaleString()} total
                  </span>
                ) : null}
                {refetchingList ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-th-text-tertiary">
                    <Loader2 size={12} className="animate-spin" />
                    Updating
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refetchTickets();
                queryClient.invalidateQueries({ queryKey: ['advisorTicketStats'] });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm font-medium text-th-text-primary hover:bg-surface-secondary"
            >
              <RefreshCw size={16} className={cn(refetchingList && 'animate-spin')} />
              Refresh
            </button>
            <Link
              to="/tickets/new"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white',
                'bg-th-accent-600 hover:bg-th-accent-700 shadow-md transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-500 focus-visible:ring-offset-2',
              )}
            >
              <Plus size={18} />
              New ticket
            </Link>
          </div>
        </div>
      </header>

      <div className="min-w-0 max-w-full space-y-3 rounded-xl border border-th-border bg-surface-primary p-4 dark:border-neutral-700/60">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end">
          <div className="group relative min-w-0 flex-1 xl:min-w-[12rem]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-th-text-tertiary transition-colors group-focus-within:text-th-accent-600"
              aria-hidden
            />
            <input
              id="tickets-search"
              type="search"
              enterKeyHint="search"
              placeholder="Search subject, description, or ticket number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-th-border bg-surface-primary py-2.5 pl-11 pr-4 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:border-th-accent-400 focus:outline-none focus:ring-2 focus:ring-th-accent-500/25"
              aria-label="Search tickets"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 sm:min-w-[10.5rem]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(SELECT_FIELD, 'w-full sm:w-[11.5rem]')}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active (new &amp; open)</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary"
                aria-hidden
              />
            </div>
            <div className="relative min-w-0 sm:min-w-[9.5rem]">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={cn(SELECT_FIELD, 'w-full sm:w-[10.5rem]')}
                aria-label="Filter by priority"
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary"
                aria-hidden
              />
            </div>
            <div className="relative min-w-0 sm:min-w-[11rem]">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ListSort)}
                className={cn(SELECT_FIELD, 'w-full sm:w-[12.5rem]')}
                aria-label="Sort tickets"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary"
                aria-hidden
              />
            </div>
            {categories.length > 0 ? (
              <div className="relative min-w-0 sm:min-w-[10rem]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={cn(SELECT_FIELD, 'w-full sm:w-[11rem]')}
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary"
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-th-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-th-text-tertiary">
            {listLoading && tickets.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-th-text-secondary">
                <Loader2 size={12} className="shrink-0 animate-spin text-th-accent-600" aria-hidden />
                {sessionGateLoading ? 'Waiting for your account…' : 'Loading ticket list…'}
              </span>
            ) : (
              <>
                Showing <span className="tabular-nums text-th-text-primary">{tickets.length.toLocaleString()}</span>
                {totalCount > 0 && tickets.length < totalCount
                  ? ` loaded · ${totalCount.toLocaleString()} match this view`
                  : totalCount > 0
                    ? ` of ${totalCount.toLocaleString()}`
                    : ''}
                .
                {hasNextPage ? ' Scroll for more.' : ''}
              </>
            )}
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {listError ? (
        <div
          className="rounded-xl border border-red-200/80 bg-red-50/90 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200"
          role="alert"
        >
          <p className="text-sm font-semibold">{listError}</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={() => {
              setListError('');
              void refetchTickets();
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!listError && listLoading ? (
        <div className="rounded-xl border border-th-border bg-surface-primary p-16 text-center dark:border-neutral-700/60">
          <Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-th-accent-600" />
          <p className="text-sm font-medium text-th-text-secondary">
            {sessionGateLoading ? 'Preparing your workspace…' : 'Loading tickets…'}
          </p>
          {slowListLoad && !sessionGateLoading ? (
            <div className="mt-4 space-y-2">
              <p className="mx-auto max-w-sm text-xs text-th-text-tertiary">
                This is taking longer than usual. Check your connection, or try again — the request will time out rather than hang indefinitely.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void refetchTickets();
                }}
              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      ) : !listError && !listLoading && tickets.length === 0 ? (
        <div className="rounded-xl border border-th-border bg-surface-primary p-16 text-center dark:border-neutral-700/60">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tertiary">
            <Filter className="text-th-text-tertiary" size={24} />
          </div>
          <p className="mb-1 font-semibold text-th-text-primary">No tickets match</p>
          <p className="text-sm text-th-text-secondary">
            Try clearing search or changing filters — or open a new request.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {hasActiveFilters ? (
              <Button type="button" variant="secondary" size="md" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-th-accent-700"
            >
              <Plus size={18} />
              New ticket
            </Link>
          </div>
        </div>
      ) : !listError && !listLoading ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-th-border bg-surface-primary dark:border-neutral-700/60">
          <div className="max-w-full overflow-x-auto overscroll-x-contain md:overflow-x-visible">
            <table className="w-full min-w-0 table-fixed md:min-w-0">
              <thead className="sticky top-0 z-10 border-b border-th-border bg-surface-secondary/90 backdrop-blur-sm dark:border-neutral-700/60">
                <tr>
                  <th
                    scope="col"
                    className="w-14 shrink-0 px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary sm:px-3"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="min-w-0 px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary sm:px-3"
                  >
                    Subject
                  </th>
                  <th
                    scope="col"
                    className="hidden px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary md:table-cell md:w-[12%] lg:w-[13%] sm:px-3"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="hidden px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary md:table-cell md:w-[11%] lg:w-[12%] sm:px-3"
                  >
                    Assigned
                  </th>
                  <th
                    scope="col"
                    className="w-[5.5rem] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary sm:w-24 sm:px-3"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="w-[4.75rem] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary sm:w-20 sm:px-3"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="w-[4.25rem] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary sm:w-28 sm:px-3"
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border dark:divide-neutral-700/50">
                {tickets.map((ticket) => {
                  const updated = shortUpdatedLabel(ticket.updated_at);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={(e) => openRow(ticket.id, e)}
                      onAuxClick={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/tickets/${ticket.id}`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-surface-secondary/80 dark:hover:bg-neutral-800/40"
                    >
                    <td className="w-14 shrink-0 px-2 py-2.5 font-mono text-[11px] text-th-text-tertiary tabular-nums sm:px-3 sm:py-3">
                      #{ticket.ticket_number}
                    </td>
                    <td className="min-w-0 px-2 py-2.5 sm:px-3 sm:py-3">
                      <span
                        className="block truncate text-left text-[13px] font-semibold text-th-accent-600 hover:text-th-accent-700 dark:text-th-accent-400"
                        title={ticket.subject}
                      >
                        {subjectPreview(ticket.subject, 34)}
                      </span>
                    </td>
                    <td
                      className="hidden max-w-0 truncate px-2 py-2.5 text-sm text-th-text-secondary md:table-cell sm:px-3 sm:py-3"
                      title={ticket.category ?? ''}
                    >
                      {ticket.category || '—'}
                    </td>
                    <td
                      className="hidden max-w-0 truncate px-2 py-2.5 text-left text-sm text-th-text-primary md:table-cell sm:px-3 sm:py-3"
                      title={
                        ticket.assignee_name?.trim()
                          ? ticket.assignee_name
                          : ticket.assignee_id
                            ? 'Assigned — support agent'
                            : 'Not assigned yet'
                      }
                    >
                      {ticket.assignee_name?.trim() || (ticket.assignee_id ? '—' : 'Unassigned')}
                    </td>
                    <td className="w-[5.5rem] px-2 py-2.5 sm:w-24 sm:px-3 sm:py-3">
                      <span
                        className={cn(
                          'inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-0.5 sm:text-[11px]',
                          statusCellClass(ticket.status),
                        )}
                      >
                        {formatStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="w-[4.75rem] px-2 py-2.5 sm:w-20 sm:px-3 sm:py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize sm:px-2 sm:py-0.5 sm:text-[11px]',
                          priorityCellClass(ticket.priority),
                        )}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td
                      className="w-[4.25rem] whitespace-nowrap px-2 py-2.5 text-left text-xs tabular-nums text-th-text-tertiary sm:w-28 sm:px-3 sm:py-3 sm:text-sm"
                      title={updated.title || undefined}
                    >
                      {updated.label}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && hasNextPage ? (
            <div
              ref={loadSentinelRef}
              className="flex h-12 items-center justify-center border-t border-th-border dark:border-neutral-700/60"
            >
              {isFetchingNextPage ? (
                <span className="inline-flex items-center gap-2 text-sm text-th-text-tertiary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more…
                </span>
              ) : null}
            </div>
          ) : null}
          {!loading && !hasNextPage && totalCount > 0 ? (
            <div className="border-t border-th-border px-4 py-2 text-center text-[11px] text-th-text-tertiary dark:border-neutral-700/60">
              End of list — {totalCount.toLocaleString()} in this view
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
