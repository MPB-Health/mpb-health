import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'page' | 'resource' | 'blog' | 'faq';
  icon?: string;
}

const searchableContent: SearchResult[] = [
  { id: '1', title: 'Individuals & Families', description: 'Health sharing plans for individuals', url: '/individuals-and-families', type: 'page' },
  { id: '2', title: 'Businesses & Organizations', description: 'Group health sharing solutions', url: '/businesses-and-organizations', type: 'page' },
  { id: '3', title: 'How It Works', description: 'Understanding health sharing', url: '/how-it-works', type: 'page' },
  { id: '4', title: 'Plans & Pricing', description: 'Compare our plans', url: '/plans', type: 'page' },
  { id: '5', title: 'Get a Quote', description: 'Calculate your savings', url: '/get-started', type: 'page' },
  { id: '6', title: 'Member Portal', description: 'Access your account', url: '/member', type: 'page' },
  { id: '7', title: 'Contact Us', description: 'Get in touch', url: '/contact', type: 'page' },
  { id: '8', title: 'FAQ', description: 'Frequently asked questions', url: '/faq', type: 'page' },
  { id: '9', title: 'Blog', description: 'Healthcare insights and news', url: '/blog', type: 'page' },
  { id: '10', title: 'Resources', description: 'Guides and helpful resources', url: '/resources', type: 'page' },
  { id: '11', title: 'About Us', description: 'Our mission and story', url: '/about-us', type: 'page' },
  { id: '12', title: 'Advisor Directory', description: 'Find an advisor', url: '/advisor-directory', type: 'page' },
];

const popularSearches = ['plans', 'pricing', 'quote', 'contact', 'how it works'];

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = searchableContent.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
    );

    setResults(filtered.slice(0, 6));
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    navigate(result.url);
  };

  const handlePopularSearchClick = (search: string) => {
    setQuery(search);
    performSearch(search);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors w-full lg:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 ml-auto px-1.5 py-0.5 text-xs font-mono bg-white border border-neutral-300 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" />
          <div className="fixed inset-x-4 top-20 lg:absolute lg:inset-x-auto lg:left-0 lg:top-full lg:mt-2 lg:w-[600px] bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 animate-slide-in-from-top max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for plans, resources, help..."
                  className="w-full pl-10 pr-10 py-3 text-base border-2 border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {query && results.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
                    Results
                  </h3>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Search className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-neutral-600 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 font-medium mb-1">No results found</p>
                  <p className="text-sm text-neutral-500">
                    Try searching with different keywords
                  </p>
                </div>
              )}

              {!query && (
                <>
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recent
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handlePopularSearchClick(search)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                          >
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2 px-3">
                      {popularSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => handlePopularSearchClick(search)}
                          className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-mono">↵</kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-mono">esc</kbd>
                    to close
                  </span>
                </div>
                <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium">
                  Need help?
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
