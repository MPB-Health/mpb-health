import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { searchArticles } from '../../help/registry';
import { MODULE_META } from '../../help/types';

interface HelpSearchProps {
  onSelectArticle: (articleId: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function HelpSearch({
  onSelectArticle,
  className,
  placeholder = 'Search help articles...',
  autoFocus = false,
}: HelpSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchArticles(query).slice(0, 8);
  }, [query]);

  const showDropdown = focused && query.trim().length > 0 && results.length > 0;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getModuleLabel = (moduleKey: string) =>
    MODULE_META.find((m) => m.key === moduleKey)?.label ?? moduleKey;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500/40 focus:border-th-accent-500 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-th-text-tertiary hover:text-th-text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-xl overflow-hidden">
          {results.map((article) => (
            <button
              key={article.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelectArticle(article.id);
                setQuery('');
              }}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors"
            >
              <FileText className="w-4 h-4 text-th-accent-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-th-text-primary truncate">
                  {article.title}
                </p>
                <p className="text-xs text-th-text-tertiary truncate">
                  {getModuleLabel(article.module)} &middot;{' '}
                  <span className="capitalize">{article.difficulty}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
