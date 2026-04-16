import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Clock,
  Phone,
} from 'lucide-react';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  extra_info: string | null;
  rank: number;
}

interface RecentRecord {
  entity_type: string;
  entity_id: string;
  title: string;
  timestamp: number;
}

const RECENT_KEY = 'mpb_crm_recent_records';
const MAX_RECENT = 8;

function getRecentRecords(): RecentRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRecentRecord(record: Omit<RecentRecord, 'timestamp'>) {
  const existing = getRecentRecords().filter(
    (r) => !(r.entity_type === record.entity_type && r.entity_id === record.entity_id)
  );
  const updated = [{ ...record, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

const ENTITY_CONFIG: Record<
  string,
  { icon: typeof Users; label: string; color: string; bg: string; path: (id: string) => string }
> = {
  lead: { icon: Users, label: 'Lead', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', path: (id) => `/leads/${id}` },
  account: { icon: Building2, label: 'Account', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', path: (id) => `/accounts/${id}` },
  contact: { icon: UserCircle, label: 'Contact', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', path: (id) => `/contacts/${id}` },
  deal: { icon: DollarSign, label: 'Deal', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', path: (id) => `/deals/${id}` },
  product: { icon: Package, label: 'Product', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', path: (id) => `/products/${id}` },
  quote: { icon: FileCheck, label: 'Quote', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', path: (id) => `/quotes/${id}` },
  invoice: { icon: Receipt, label: 'Invoice', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', path: (id) => `/invoices/${id}` },
  campaign: { icon: Megaphone, label: 'Campaign', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', path: (id) => `/campaigns/${id}` },
  task: { icon: CheckSquare, label: 'Task', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', path: () => '/tasks' },
};

const DEFAULT_CONFIG = { icon: FileText, label: 'Record', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-500/10', path: () => '/' };

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounce(rawQuery, 200);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);

  useEffect(() => {
    setRecentRecords(getRecentRecords());
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      if (rawQuery.length < 2 && open && recentRecords.length === 0) setOpen(false);
      return;
    }

    if (!activeOrg?.id) return;
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.rpc('crm_global_search', {
          p_org_id: activeOrg.id,
          p_query: query,
          p_limit: 15,
        });
        if (!cancelled && !error && data) {
          setResults(data as unknown as SearchResult[]);
          setOpen(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [query, activeOrg?.id]);

  // "/" shortcut
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

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll active into view
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll('[data-search-item]');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (result: SearchResult | RecentRecord) => {
      const entityType = result.entity_type;
      const entityId = result.entity_id;
      const config = ENTITY_CONFIG[entityType] || DEFAULT_CONFIG;

      addRecentRecord({ entity_type: entityType, entity_id: entityId, title: result.title });

      navigate(config.path(entityId));
      setRawQuery('');
      setResults([]);
      setOpen(false);
      inputRef.current?.blur();
    },
    [navigate],
  );

  const totalItems = rawQuery.length >= 2 ? results.length : recentRecords.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setRawQuery('');
        setOpen(false);
        inputRef.current?.blur();
        return;
      }

      if (!open || totalItems === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < totalItems) {
            if (rawQuery.length >= 2) {
              handleSelect(results[activeIndex]);
            } else {
              handleSelect(recentRecords[activeIndex]);
            }
          }
          break;
      }
    },
    [open, totalItems, activeIndex, handleSelect, results, recentRecords, rawQuery],
  );

  const clearSearch = () => {
    setRawQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (results.length > 0 || recentRecords.length > 0) {
      setOpen(true);
    } else {
      const recent = getRecentRecords();
      setRecentRecords(recent);
      if (recent.length > 0) setOpen(true);
    }
  };

  const isSearching = rawQuery.length >= 2;
  const showRecents = !isSearching && recentRecords.length > 0;

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const existing = map.get(r.entity_type);
      if (existing) {
        existing.push(r);
      } else {
        map.set(r.entity_type, [r]);
      }
    }
    return Array.from(map, ([type, items]) => ({ type, items }));
  }, [results]);

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
          placeholder="Search leads, contacts, family members..."
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm w-full text-th-text-primary placeholder-th-text-tertiary"
        />
        {rawQuery ? (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
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
      {open && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 w-full bg-surface-primary border border-th-border rounded-xl shadow-2xl z-50 max-h-[480px] overflow-y-auto"
        >
          {/* Recent records (when no search query) */}
          {showRecents && (
            <div className="py-1">
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Recent Records
              </div>
              {recentRecords.map((record, idx) => {
                const config = ENTITY_CONFIG[record.entity_type] || DEFAULT_CONFIG;
                const Icon = config.icon;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={`${record.entity_type}-${record.entity_id}`}
                    data-search-item
                    onClick={() => handleSelect(record)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-th-accent-500/8' : 'hover:bg-surface-secondary',
                    ].join(' ')}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${config.bg} ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-th-text-primary truncate">{record.title}</p>
                    </div>
                    <span className="text-[10px] text-th-text-tertiary shrink-0 capitalize">{config.label}</span>
                  </button>
                );
              })}
              <div className="px-3 py-2 border-t border-th-border mt-1">
                <p className="text-[10px] text-th-text-tertiary text-center">
                  Type to search across all records, family members, and phone numbers
                </p>
              </div>
            </div>
          )}

          {/* Search results */}
          {isSearching && (
            results.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-th-text-secondary">No results for &quot;{rawQuery}&quot;</p>
                <p className="text-xs text-th-text-tertiary mt-1">Try searching by name, email, phone, or family member name</p>
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
                        const isFamilyMatch = result.subtitle?.startsWith('Family of ');
                        const isPhoneMatch = result.subtitle?.startsWith('Phone for ');
                        return (
                          <button
                            key={`${result.entity_type}-${result.entity_id}-${idx}`}
                            data-search-item
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={[
                              'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                              isActive ? 'bg-th-accent-500/8' : 'hover:bg-surface-secondary',
                            ].join(' ')}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${config.bg} ${config.color}`}>
                              {isPhoneMatch ? <Phone className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-th-text-primary truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className={`text-xs truncate ${
                                  isFamilyMatch || isPhoneMatch
                                    ? 'text-th-accent-600 font-medium'
                                    : 'text-th-text-tertiary'
                                }`}>
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                            {result.extra_info && (
                              <span className="text-[10px] text-th-text-tertiary shrink-0 hidden sm:block max-w-[80px] truncate">
                                {result.extra_info}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Footer */}
                <div className="px-3 py-2 border-t border-th-border mt-1">
                  <p className="text-[10px] text-th-text-tertiary text-center">
                    <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">↑↓</kbd>
                    {' '}navigate{' '}
                    <span className="mx-1.5 opacity-30">·</span>
                    <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">↵</kbd>
                    {' '}open{' '}
                    <span className="mx-1.5 opacity-30">·</span>
                    <kbd className="px-1 py-0.5 bg-surface-tertiary rounded text-[9px] font-mono border border-th-border">esc</kbd>
                    {' '}close
                  </p>
                </div>
              </div>
            )
          )}

          {/* Empty state: no query, no recents */}
          {!isSearching && !showRecents && (
            <div className="px-4 py-6 text-center">
              <Search className="w-7 h-7 text-th-text-tertiary mx-auto mb-2 opacity-40" />
              <p className="text-xs text-th-text-tertiary">Start typing to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
