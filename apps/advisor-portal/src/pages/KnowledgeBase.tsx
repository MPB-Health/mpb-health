import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button, GradientHeader, SkeletonCard } from '@mpbhealth/ui';
import {
  ticketService,
  type Ticket,
  type TicketPriority,
} from '@mpbhealth/advisor-core';
import { useTicketAuth } from '../components/TicketAuthWrapper';

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-neutral-100 text-neutral-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

interface KbTicket extends Ticket {
  origin?: string;
  submitter_name?: string;
  submitter_email?: string;
}

export default function KnowledgeBase() {
  const { executeWithAuth } = useTicketAuth();
  const [articles, setArticles] = useState<KbTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const perPage = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await executeWithAuth(() =>
        ticketService.getKnowledgeBase({
          search: searchDebounced || undefined,
          category: categoryFilter || undefined,
          page,
          perPage,
        })
      );
      if (result) {
        setArticles(result.tickets as KbTicket[]);
        setTotal(result.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, categoryFilter, page, executeWithAuth]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Load categories for filter
  useEffect(() => {
    executeWithAuth(() => ticketService.getCategories())
      .then((cats) => { if (cats) setCategories(cats); })
      .catch(() => {});
  }, [executeWithAuth]);

  const totalPages = Math.ceil(total / perPage);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Knowledge Base"
        subtitle="Search resolved cases and solutions from our support history"
        icon={<BookOpen className="w-6 h-6" />}
      />

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary" />
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-th-text-secondary">
          {total === 0
            ? 'No articles found'
            : `${total} article${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border">
          <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <h3 className="text-lg font-medium text-th-text-primary mb-1">No matching articles found</h3>
          <p className="text-sm text-th-text-secondary">
            {searchInput || categoryFilter
              ? 'Try adjusting your search or filters.'
              : 'No resolved cases have been imported yet.'}
          </p>
        </div>
      )}

      {/* Article cards */}
      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article) => {
            const pc = PRIORITY_CONFIG[article.priority] ?? PRIORITY_CONFIG.medium;
            const isExpanded = expandedId === article.id;
            const truncatedDesc = article.description
              ? article.description.slice(0, 200) + (article.description.length > 200 ? '…' : '')
              : null;

            return (
              <div
                key={article.id}
                className="bg-surface-primary rounded-xl border border-th-border overflow-hidden"
              >
                {/* Card header — always visible */}
                <button
                  type="button"
                  onClick={() => toggleExpand(article.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {article.category && (
                        <span className="text-xs bg-surface-tertiary text-th-text-secondary px-2 py-0.5 rounded border border-th-border-subtle">
                          {article.category}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.color}`}>
                        {pc.label}
                      </span>
                      <span className="text-xs text-th-text-tertiary">
                        {format(new Date(article.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-th-text-primary">{article.subject}</h4>
                    {!isExpanded && truncatedDesc && (
                      <p className="text-xs text-th-text-secondary mt-1 line-clamp-2">{truncatedDesc}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-th-text-tertiary" />
                      : <ChevronDown className="w-4 h-4 text-th-text-tertiary" />
                    }
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-th-border-subtle">
                    {article.description ? (
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wide mb-2">
                          Description
                        </p>
                        <p className="text-sm text-th-text-primary whitespace-pre-wrap leading-relaxed">
                          {article.description}
                        </p>
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <p className="text-sm text-th-text-secondary italic">No description available.</p>
                      </div>
                    )}
                    <div className="px-5 pb-4 flex items-center gap-1 text-xs text-th-text-tertiary">
                      <Loader2 className="w-3 h-3 hidden" aria-hidden />
                      <span>Status: </span>
                      <span className="font-medium text-th-text-secondary capitalize">{article.status}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-th-text-secondary">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-th-text-primary">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
