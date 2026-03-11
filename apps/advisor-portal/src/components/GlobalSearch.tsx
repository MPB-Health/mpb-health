import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Users,
  MessageSquare,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Workflow,
  Calendar,
  X,
} from 'lucide-react';
import { useGlobalSearch } from '../hooks/useSearch';
import type { SearchResult, SearchEntityType } from '@mpbhealth/champion-core';

const ENTITY_ICONS: Record<string, typeof Search> = {
  lead: Users,
  message: MessageSquare,
  task: CheckCircle,
  meeting: Calendar,
  document: BookOpen,
  training: GraduationCap,
  sequence: Workflow,
};

const ENTITY_COLORS: Record<string, string> = {
  lead: 'text-blue-500',
  message: 'text-indigo-500',
  task: 'text-green-500',
  meeting: 'text-orange-500',
  document: 'text-yellow-600',
  training: 'text-purple-500',
  sequence: 'text-cyan-500',
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { query, setQuery, results, loading, clearSearch } = useGlobalSearch({
    debounceMs: 150,
    minQueryLength: 2,
    limit: 8,
  });

  const showDropdown = isFocused && query.length >= 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.url);
      clearSearch();
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [navigate, clearSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSearch();
        setIsFocused(false);
        inputRef.current?.blur();
        return;
      }

      if (!showDropdown || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    },
    [showDropdown, results, selectedIndex, handleSelect, clearSearch],
  );

  // Group results by entity type for organized display
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    const type = result.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {});

  const groupOrder: SearchEntityType[] = ['lead', 'task', 'meeting', 'message', 'document', 'training', 'sequence'];
  const orderedGroups = groupOrder.filter((type) => groupedResults[type]);

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Search Input */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
          isFocused
            ? 'bg-surface-primary border-th-accent-500 shadow-sm ring-1 ring-th-accent-500/20'
            : 'bg-surface-secondary/50 border-transparent hover:border-th-border-primary hover:bg-surface-secondary/80'
        }`}
      >
        <Search className="w-4 h-4 text-th-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search leads, tasks, messages..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-th-text-primary placeholder:text-th-text-muted min-w-0"
        />
        {loading && <Loader2 className="w-4 h-4 text-th-accent-600 animate-spin shrink-0" />}
        {query && !loading && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              clearSearch();
              inputRef.current?.focus();
            }}
            className="p-0.5 text-th-text-muted hover:text-th-text-primary rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!isFocused && !query && (
          <kbd className="hidden md:inline-flex items-center text-[10px] text-th-text-muted bg-surface-secondary/80 border border-th-border-primary rounded px-1.5 py-0.5 font-mono shrink-0">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-primary rounded-xl border border-th-border-primary shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto py-1">
                {orderedGroups.map((entityType) => {
                  const group = groupedResults[entityType];
                  const label = entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's';

                  return (
                    <div key={entityType}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-th-text-muted uppercase tracking-wider">
                        {label}
                      </div>
                      {group.map((result) => {
                        flatIndex++;
                        const idx = flatIndex;
                        const Icon = ENTITY_ICONS[result.entity_type] || Search;
                        const colorClass = ENTITY_COLORS[result.entity_type] || 'text-gray-500';

                        return (
                          <button
                            type="button"
                            key={result.entity_id}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                              idx === selectedIndex
                                ? 'bg-th-accent-50 dark:bg-th-accent-900/20'
                                : 'hover:bg-surface-secondary'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                idx === selectedIndex
                                  ? 'bg-th-accent-100 dark:bg-th-accent-900/30'
                                  : 'bg-surface-secondary'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-th-text-primary truncate">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="text-xs text-th-text-muted truncate">
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 border-t border-th-border-primary bg-surface-secondary/50 flex items-center gap-3 text-[10px] text-th-text-muted">
                <span>
                  <kbd className="px-1 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                    ↵
                  </kbd>{' '}
                  open
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                    esc
                  </kbd>{' '}
                  close
                </span>
              </div>
            </>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-th-text-muted/50 mx-auto mb-2" />
              <p className="text-sm text-th-text-secondary">
                No results for &quot;<span className="font-medium">{query}</span>&quot;
              </p>
              <p className="text-xs text-th-text-muted mt-1">
                Try a different search term
              </p>
            </div>
          ) : loading ? (
            <div className="px-4 py-6 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-th-accent-600 animate-spin" />
              <p className="text-xs text-th-text-muted">Searching...</p>
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-th-text-muted">
                Type at least 2 characters to search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
