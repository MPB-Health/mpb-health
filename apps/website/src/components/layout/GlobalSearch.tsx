import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { safeLocalStorage } from '../../lib/safeStorage';

interface SearchResult {
  id: string;
  title: string;
  href: string;
  type: 'page' | 'blog' | 'resource' | 'event';
  excerpt?: string;
}

interface GlobalSearchProps {
  className?: string;
  onResultClick?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className, onResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = safeLocalStorage.getItem<string[]>('recent_searches', []);
    if (saved && Array.isArray(saved)) {
      setRecentSearches(saved);
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Safely query blog_articles - may not exist yet
      let blogData: { id: string; title: string; slug: string; excerpt: string }[] = [];
      const blogResult = await supabase
        .from('blog_articles')
        .select('id, title, slug, excerpt')
        .ilike('title', `%${searchQuery}%`)
        .eq('published', true)
        .limit(5);
      if (!blogResult.error?.message?.includes('schema cache')) {
        blogData = blogResult.data || [];
      }

      // Safely query resources - may not exist yet
      let resourceData: { id: string; title: string; slug: string; description: string }[] = [];
      const resourceResult = await supabase
        .from('resources')
        .select('id, title, slug, description')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);
      if (!resourceResult.error?.message?.includes('schema cache')) {
        resourceData = resourceResult.data || [];
      }

      const searchResults: SearchResult[] = [
        ...blogData.map(item => ({
          id: item.id,
          title: item.title,
          href: `/blog/${item.slug}`,
          type: 'blog' as const,
          excerpt: item.excerpt,
        })),
        ...resourceData.map(item => ({
          id: item.id,
          title: item.title,
          href: `/resources/${item.slug}`,
          type: 'resource' as const,
          excerpt: item.description,
        })),
      ];

      const staticPages: SearchResult[] = [
        { id: 'plans', title: 'Plans & Pricing', href: '/plans', type: 'page' as const },
        { id: 'how-it-works', title: 'How It Works', href: '/how-it-works', type: 'page' as const },
        { id: 'features', title: 'Features', href: '/features', type: 'page' as const },
        { id: 'individuals', title: 'Individuals & Families', href: '/individuals-and-families', type: 'page' as const },
        { id: 'business', title: 'Businesses & Organizations', href: '/businesses-and-organizations', type: 'page' as const },
        { id: 'about', title: 'About Us', href: '/about-us', type: 'page' as const },
        { id: 'contact', title: 'Contact', href: '/contact', type: 'page' as const },
        { id: 'faq', title: 'FAQ', href: '/faq', type: 'page' as const },
      ].filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults([...staticPages, ...searchResults].slice(0, 8));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
    onResultClick?.();
  };

  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;

    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    safeLocalStorage.setItem('recent_searches', updated, { ttl: 30 * 24 * 60 * 60 * 1000 });
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    safeLocalStorage.removeItem('recent_searches');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      page: 'Page',
      blog: 'Blog',
      resource: 'Resource',
      event: 'Event',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      page: 'bg-blue-100 text-blue-700',
      blog: 'bg-green-100 text-green-700',
      resource: 'bg-purple-100 text-purple-700',
      event: 'bg-orange-100 text-orange-700',
    };
    return colors[type as keyof typeof colors] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-neutral-500 text-sm">
              Searching...
            </div>
          )}

          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-neutral-500 text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {result.title}
                      </div>
                      {result.excerpt && (
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded flex-shrink-0',
                      getTypeBadgeColor(result.type)
                    )}>
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && (
            <div className="border-t border-neutral-200 p-3 bg-neutral-50">
              <p className="text-xs text-neutral-500 text-center">
                Can't find what you're looking for? <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact us</a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
