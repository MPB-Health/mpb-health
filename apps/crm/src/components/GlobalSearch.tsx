import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Building2,
  UserCircle,
  DollarSign,
  Package,
  FileCheck,
  Receipt,
  Megaphone,
  CheckSquare,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  extra_info: string | null;
  rank: number;
}

const ENTITY_CONFIG: Record<
  string,
  { icon: typeof Users; label: string; color: string; bg: string; path: (id: string) => string }
> = {
  lead: {
    icon: Users,
    label: 'Lead',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    path: (id) => `/leads/${id}`,
  },
  account: {
    icon: Building2,
    label: 'Account',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    path: (id) => `/accounts/${id}`,
  },
  contact: {
    icon: UserCircle,
    label: 'Contact',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    path: (id) => `/contacts/${id}`,
  },
  deal: {
    icon: DollarSign,
    label: 'Deal',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    path: (id) => `/deals/${id}`,
  },
  product: {
    icon: Package,
    label: 'Product',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    path: (id) => `/products/${id}`,
  },
  quote: {
    icon: FileCheck,
    label: 'Quote',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    path: (id) => `/quotes/${id}`,
  },
  invoice: {
    icon: Receipt,
    label: 'Invoice',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    path: (id) => `/invoices/${id}`,
  },
  campaign: {
    icon: Megaphone,
    label: 'Campaign',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    path: (id) => `/campaigns/${id}`,
  },
  task: {
    icon: CheckSquare,
    label: 'Task',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    path: () => '/tasks',
  },
};

const DEFAULT_CONFIG = {
  icon: FileText,
  label: 'Record',
  color: 'text-gray-500',
  bg: 'bg-gray-50 dark:bg-gray-500/10',
  path: () => '/',
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      if (!activeOrg?.id) return;
      try {
        const { data, error } = await supabase.rpc('crm_global_search', {
          p_org_id: activeOrg.id,
          p_query: query,
          p_limit: 12,
        });
        if (!error && data) {
          setResults(data as SearchResult[]);
          setOpen(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, activeOrg?.id]);

  // "/" shortcut to focus the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll the active result into view
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll('[data-search-item]');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const config = ENTITY_CONFIG[result.entity_type] || DEFAULT_CONFIG;
      navigate(config.path(result.entity_id));
      setQuery('');
      setResults([]);
      setOpen(false);
      inputRef.current?.blur();
    },
    [navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
        setOpen(false);
        inputRef.current?.blur();
        return;
      }

      if (!open || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex]);
          }
          break;
      }
    },
    [open, results, activeIndex, handleSelect],
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  // Group results by entity type for section headers
  const grouped: { type: string; items: SearchResult[] }[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (!seen.has(r.entity_type)) {
      seen.add(r.entity_type);
      grouped.push({ type: r.entity_type, items: results.filter((x) => x.entity_type === r.entity_type) });
    }
  }

  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search input */}
      <div
        className={[
          'flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200',
          open
            ? 'bg-surface-primary border-th-accent-500/50 shadow-lg shadow-th-accent-500/5 ring-1 ring-th-accent-500/20'
            : 'bg-surface-tertiary border-transparent hover:bg-surface-secondary hover:border-th-border',
        ].join(' ')}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-th-accent-500 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-th-text-tertiary shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search leads, contacts, deals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm w-full text-th-text-primary placeholder-th-text-tertiary"
        />
        {query ? (
          <button
            onClick={clearSearch}
            className="p-0.5 rounded text-th-text-tertiary hover:text-th-text-secondary transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-th-text-tertiary bg-surface-tertiary rounded border border-th-border shrink-0">
            /
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {open && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 w-full bg-surface-primary border border-th-border rounded-xl shadow-2xl z-50 max-h-[420px] overflow-y-auto"
        >
          {results.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-th-text-secondary">No results found</p>
              <p className="text-xs text-th-text-tertiary mt-1">Try a different search term</p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Loader2 className="w-5 h-5 text-th-accent-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-th-text-tertiary">Searching...</p>
            </div>
          ) : (
            <div className="py-1">
              {grouped.map(({ type, items }) => {
                const config = ENTITY_CONFIG[type] || DEFAULT_CONFIG;
                return (
                  <div key={type}>
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">
                      {config.label}s
                    </div>
                    {items.map((result) => {
                      const idx = flatIdx++;
                      const isActive = idx === activeIndex;
                      const Icon = config.icon;
                      return (
                        <button
                          key={`${result.entity_type}-${result.entity_id}`}
                          data-search-item
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={[
                            'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                            isActive
                              ? 'bg-th-accent-500/8 dark:bg-th-accent-500/10'
                              : 'hover:bg-surface-secondary',
                          ].join(' ')}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${config.bg} ${config.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-th-text-primary truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-th-text-tertiary truncate">{result.subtitle}</p>
                            )}
                          </div>
                          {result.extra_info && (
                            <span className="text-[10px] text-th-text-tertiary shrink-0 hidden sm:block">
                              {result.extra_info}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Keyboard hints */}
              <div className="px-3 py-2 border-t border-th-border mt-1">
                <p className="text-[10px] text-th-text-tertiary text-center">
                  <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">
                    ↑↓
                  </kbd>{' '}
                  navigate
                  <span className="mx-2 opacity-30">·</span>
                  <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">
                    ↵
                  </kbd>{' '}
                  open
                  <span className="mx-2 opacity-30">·</span>
                  <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">
                    esc
                  </kbd>{' '}
                  close
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
