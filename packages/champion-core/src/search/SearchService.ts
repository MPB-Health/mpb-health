// ============================================================================
// Search Service — Global search and command palette functionality
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  SearchResult,
  SearchResponse,
  RecentSearch,
  SavedSearch,
  SavedSearchInput,
  QuickAction,
  GlobalSearchParams,
  SearchEntityType,
} from './types';

// ============================================================================
// Entity Type Configuration
// ============================================================================

export const SEARCH_ENTITY_CONFIG: Record<
  SearchEntityType,
  { label: string; icon: string; color: string }
> = {
  lead: { label: 'Leads', icon: 'users', color: 'purple' },
  message: { label: 'Messages', icon: 'message-square', color: 'blue' },
  task: { label: 'Tasks', icon: 'check-circle', color: 'green' },
  meeting: { label: 'Meetings', icon: 'video', color: 'orange' },
  document: { label: 'Documents', icon: 'book-open', color: 'yellow' },
  training: { label: 'Training', icon: 'graduation-cap', color: 'indigo' },
  sequence: { label: 'Sequences', icon: 'workflow', color: 'cyan' },
};

class SearchService {
  // ============================================================================
  // Global Search
  // ============================================================================

  /**
   * Perform a global search across all entity types
   */
  async globalSearch(orgId: string, params: GlobalSearchParams): Promise<SearchResponse> {
    const startTime = performance.now();

    const { data, error } = await supabase.rpc('global_search', {
      p_org_id: orgId,
      p_query: params.query,
      p_entity_types: params.entity_types || null,
      p_limit: params.limit || 20,
    });

    if (error) {
      console.error('[SearchService] Global search failed:', error);
      throw error;
    }

    const duration = Math.round(performance.now() - startTime);

    return {
      results: (data || []) as SearchResult[],
      query: params.query,
      total: data?.length || 0,
      duration_ms: duration,
    };
  }

  /**
   * Search within a specific entity type
   */
  async searchEntity(
    orgId: string,
    entityType: SearchEntityType,
    query: string,
    limit: number = 20
  ): Promise<SearchResult[]> {
    const response = await this.globalSearch(orgId, {
      query,
      entity_types: [entityType],
      limit,
    });
    return response.results;
  }

  // ============================================================================
  // Recent Searches
  // ============================================================================

  /**
   * Get recent searches for the current user
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<RecentSearch[]> {
    const { data, error } = await supabase.rpc('get_recent_searches', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error('[SearchService] Get recent searches failed:', error);
      throw error;
    }

    return (data || []) as RecentSearch[];
  }

  /**
   * Record a search in recent searches
   */
  async recordSearch(
    userId: string,
    orgId: string,
    query: string,
    entityType?: SearchEntityType,
    resultCount: number = 0
  ): Promise<string> {
    const { data, error } = await supabase.rpc('record_search', {
      p_user_id: userId,
      p_org_id: orgId,
      p_query: query,
      p_entity_type: entityType || null,
      p_result_count: resultCount,
    });

    if (error) {
      console.error('[SearchService] Record search failed:', error);
      throw error;
    }

    return data as string;
  }

  /**
   * Clear all recent searches for a user
   */
  async clearRecentSearches(userId: string): Promise<void> {
    const { error } = await supabase
      .from('recent_searches')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[SearchService] Clear recent searches failed:', error);
      throw error;
    }
  }

  /**
   * Delete a specific recent search
   */
  async deleteRecentSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('recent_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('[SearchService] Delete recent search failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Saved Searches
  // ============================================================================

  /**
   * Get all saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('use_count', { ascending: false });

    if (error) {
      console.error('[SearchService] Get saved searches failed:', error);
      throw error;
    }

    return (data || []) as SavedSearch[];
  }

  /**
   * Create a new saved search
   */
  async createSavedSearch(
    userId: string,
    orgId: string,
    input: SavedSearchInput
  ): Promise<SavedSearch> {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        org_id: orgId,
        name: input.name,
        query: input.query,
        entity_types: input.entity_types || [],
        filters: input.filters || {},
        is_pinned: input.is_pinned || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[SearchService] Create saved search failed:', error);
      throw error;
    }

    return data as SavedSearch;
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    searchId: string,
    updates: Partial<SavedSearchInput>
  ): Promise<SavedSearch> {
    const { data, error } = await supabase
      .from('saved_searches')
      .update({
        ...updates,
        ...(updates.entity_types && { entity_types: updates.entity_types }),
        ...(updates.filters && { filters: updates.filters }),
      })
      .eq('id', searchId)
      .select()
      .single();

    if (error) {
      console.error('[SearchService] Update saved search failed:', error);
      throw error;
    }

    return data as SavedSearch;
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('[SearchService] Delete saved search failed:', error);
      throw error;
    }
  }

  /**
   * Toggle pin status of a saved search
   */
  async togglePinSavedSearch(searchId: string, isPinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .update({ is_pinned: isPinned })
      .eq('id', searchId);

    if (error) {
      console.error('[SearchService] Toggle pin failed:', error);
      throw error;
    }
  }

  /**
   * Record usage of a saved search
   */
  async useSavedSearch(searchId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_saved_search_use_count', {
      search_id: searchId,
    });

    if (error) {
      // Fallback: fetch current count and update
      const { data } = await supabase
        .from('saved_searches')
        .select('use_count')
        .eq('id', searchId)
        .single();
      const newCount = (data?.use_count ?? 0) + 1;
      await supabase
        .from('saved_searches')
        .update({
          use_count: newCount,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', searchId);
    }
  }

  // ============================================================================
  // Quick Actions (Command Palette)
  // ============================================================================

  /**
   * Get all quick actions available to the user
   */
  async getQuickActions(orgId?: string): Promise<QuickAction[]> {
    let query = supabase
      .from('quick_actions')
      .select('*')
      .eq('is_enabled', true)
      .order('category')
      .order('display_order');

    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SearchService] Get quick actions failed:', error);
      throw error;
    }

    return (data || []) as QuickAction[];
  }

  /**
   * Filter quick actions by search query
   */
  filterQuickActions(actions: QuickAction[], query: string): QuickAction[] {
    if (!query.trim()) return actions;

    const lowerQuery = query.toLowerCase();
    return actions.filter(
      (action) =>
        action.name.toLowerCase().includes(lowerQuery) ||
        action.description?.toLowerCase().includes(lowerQuery) ||
        action.shortcut?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Group quick actions by category
   */
  groupQuickActionsByCategory(actions: QuickAction[]): Record<string, QuickAction[]> {
    return actions.reduce(
      (groups, action) => {
        const category = action.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(action);
        return groups;
      },
      {} as Record<string, QuickAction[]>
    );
  }

  // ============================================================================
  // Search Analytics
  // ============================================================================

  /**
   * Log search analytics
   */
  async logSearchAnalytics(
    orgId: string,
    query: string,
    entityType?: SearchEntityType,
    resultCount: number = 0,
    clickedResultId?: string,
    clickedResultType?: SearchEntityType,
    durationMs?: number
  ): Promise<void> {
    const { error } = await supabase.from('search_analytics').insert({
      org_id: orgId,
      query,
      entity_type: entityType || null,
      result_count: resultCount,
      clicked_result_id: clickedResultId || null,
      clicked_result_type: clickedResultType || null,
      search_duration_ms: durationMs || null,
    });

    if (error) {
      console.error('[SearchService] Log search analytics failed:', error);
      // Don't throw - analytics failure shouldn't break search
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get entity type configuration
   */
  getEntityConfig(entityType: SearchEntityType) {
    return SEARCH_ENTITY_CONFIG[entityType];
  }

  /**
   * Get all entity types
   */
  getAllEntityTypes(): SearchEntityType[] {
    return Object.keys(SEARCH_ENTITY_CONFIG) as SearchEntityType[];
  }

  /**
   * Parse shortcut string to key combination
   */
  parseShortcut(shortcut: string): { key: string; modifiers: string[] } {
    const parts = shortcut.toLowerCase().split('+').map((p) => p.trim());
    const modifiers: string[] = [];
    let key = '';

    for (const part of parts) {
      if (['ctrl', 'control', 'cmd', 'meta', 'shift', 'alt', 'option'].includes(part)) {
        modifiers.push(part === 'cmd' || part === 'meta' ? 'meta' : part);
      } else {
        key = part;
      }
    }

    return { key, modifiers };
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: string): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

    return shortcut
      .replace(/ctrl/gi, isMac ? '⌃' : 'Ctrl')
      .replace(/cmd|meta/gi, isMac ? '⌘' : 'Win')
      .replace(/shift/gi, isMac ? '⇧' : 'Shift')
      .replace(/alt|option/gi, isMac ? '⌥' : 'Alt')
      .replace(/\+/g, isMac ? '' : '+')
      .replace(/\s+/g, ' ');
  }
}

export const searchService = new SearchService();
