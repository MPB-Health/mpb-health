// ============================================================================
// Search Hooks — React hooks for global search and command palette
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  searchService,
  SearchResult,
  SearchResponse,
  RecentSearch,
  SavedSearch,
  SavedSearchInput,
  QuickAction,
  SearchEntityType,
  SEARCH_ENTITY_CONFIG,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

// ============================================================================
// Global Search Hook
// ============================================================================

export function useGlobalSearch(options: {
  debounceMs?: number;
  minQueryLength?: number;
  entityTypes?: SearchEntityType[];
  limit?: number;
} = {}) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const {
    debounceMs = 300,
    minQueryLength = 2,
    entityTypes,
    limit = 20,
  } = options;

  // Debounced search
  useEffect(() => {
    if (!advisorReady) {
      setResults([]);
      setDurationMs(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (!orgId || query.length < minQueryLength) {
      setResults([]);
      setDurationMs(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchService.globalSearch(orgId, {
          query,
          entity_types: entityTypes,
          limit,
        });

        setResults(response.results);
        setDurationMs(response.duration_ms);

        // Record search in recent searches
        if (userId && response.results.length > 0) {
          searchService.recordSearch(
            userId,
            orgId,
            query,
            entityTypes?.[0],
            response.results.length
          ).catch(console.error);
        }
      } catch (err) {
        console.error('[useGlobalSearch] Search failed:', err);
        setError('Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, orgId, userId, entityTypes, limit, debounceMs, minQueryLength, advisorReady]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setDurationMs(null);
  }, []);

  // Group results by entity type
  const groupedResults = useMemo(() => {
    return results.reduce(
      (groups, result) => {
        const type = result.entity_type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(result);
        return groups;
      },
      {} as Record<SearchEntityType, SearchResult[]>
    );
  }, [results]);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    loading,
    error,
    durationMs,
    clearSearch,
    hasResults: results.length > 0,
  };
}

// ============================================================================
// Recent Searches Hook
// ============================================================================

export function useRecentSearches(limit: number = 10) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentSearches = useCallback(async () => {
    if (!advisorReady) {
      setRecentSearches([]);
      setLoading(false);
      return;
    }

    if (!userId) {
      setRecentSearches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await searchService.getRecentSearches(userId, limit);
      setRecentSearches(data);
    } catch (err) {
      console.error('[useRecentSearches] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, advisorReady, limit]);

  useEffect(() => {
    fetchRecentSearches();
  }, [fetchRecentSearches]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    await searchService.clearRecentSearches(userId);
    setRecentSearches([]);
  }, [userId]);

  const deleteOne = useCallback(async (searchId: string) => {
    await searchService.deleteRecentSearch(searchId);
    setRecentSearches((prev) => prev.filter((s) => s.id !== searchId));
  }, []);

  return {
    recentSearches,
    loading,
    refresh: fetchRecentSearches,
    clearAll,
    deleteOne,
  };
}

// ============================================================================
// Saved Searches Hook
// ============================================================================

export function useSavedSearches() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const orgId = profile?.org_id;

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedSearches = useCallback(async () => {
    if (!advisorReady) {
      setSavedSearches([]);
      setLoading(false);
      return;
    }

    if (!userId) {
      setSavedSearches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await searchService.getSavedSearches(userId);
      setSavedSearches(data);
    } catch (err) {
      console.error('[useSavedSearches] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, advisorReady]);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  const createSavedSearch = useCallback(
    async (input: SavedSearchInput) => {
      if (!userId || !orgId) return null;
      const saved = await searchService.createSavedSearch(userId, orgId, input);
      setSavedSearches((prev) => [saved, ...prev]);
      return saved;
    },
    [userId, orgId]
  );

  const updateSavedSearch = useCallback(
    async (searchId: string, updates: Partial<SavedSearchInput>) => {
      const updated = await searchService.updateSavedSearch(searchId, updates);
      setSavedSearches((prev) =>
        prev.map((s) => (s.id === searchId ? updated : s))
      );
      return updated;
    },
    []
  );

  const deleteSavedSearch = useCallback(async (searchId: string) => {
    await searchService.deleteSavedSearch(searchId);
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
  }, []);

  const togglePin = useCallback(async (searchId: string, isPinned: boolean) => {
    await searchService.togglePinSavedSearch(searchId, isPinned);
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, is_pinned: isPinned } : s))
    );
  }, []);

  // Separate pinned and regular searches
  const pinnedSearches = useMemo(
    () => savedSearches.filter((s) => s.is_pinned),
    [savedSearches]
  );

  const regularSearches = useMemo(
    () => savedSearches.filter((s) => !s.is_pinned),
    [savedSearches]
  );

  return {
    savedSearches,
    pinnedSearches,
    regularSearches,
    loading,
    refresh: fetchSavedSearches,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    togglePin,
  };
}

// ============================================================================
// Quick Actions Hook
// ============================================================================

export function useQuickActions() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActions() {
      try {
        setLoading(true);
        const data = await searchService.getQuickActions(orgId);
        setActions(data);
      } catch (err) {
        console.error('[useQuickActions] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActions();
  }, [orgId]);

  const filterActions = useCallback(
    (query: string) => {
      return searchService.filterQuickActions(actions, query);
    },
    [actions]
  );

  const groupedActions = useMemo(
    () => searchService.groupQuickActionsByCategory(actions),
    [actions]
  );

  return {
    actions,
    groupedActions,
    loading,
    filterActions,
  };
}

// ============================================================================
// Command Palette State Hook
// ============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'commands'>('search');

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd+K or Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        setMode('search');
      }

      // Cmd+Shift+P or Ctrl+Shift+P for commands
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'p') {
        event.preventDefault();
        setIsOpen(true);
        setMode('commands');
      }

      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const open = useCallback((initialMode: 'search' | 'commands' = 'search') => {
    setMode(initialMode);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    mode,
    setMode,
    open,
    close,
    toggle,
  };
}

// ============================================================================
// Search Entity Config Helper
// ============================================================================

export function useSearchEntityConfig() {
  const getConfig = useCallback((entityType: SearchEntityType) => {
    return SEARCH_ENTITY_CONFIG[entityType];
  }, []);

  const getAllTypes = useCallback(() => {
    return Object.keys(SEARCH_ENTITY_CONFIG) as SearchEntityType[];
  }, []);

  return {
    getConfig,
    getAllTypes,
    allConfigs: SEARCH_ENTITY_CONFIG,
  };
}
