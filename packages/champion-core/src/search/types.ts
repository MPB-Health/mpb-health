// ============================================================================
// Search Types — Type definitions for global search and command palette
// ============================================================================

export type SearchEntityType =
  | 'lead'
  | 'message'
  | 'task'
  | 'meeting'
  | 'document'
  | 'training'
  | 'sequence';

export type QuickActionType = 'navigate' | 'create' | 'toggle' | 'custom';
export type QuickActionCategory = 'navigation' | 'create' | 'settings' | 'help';

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  url: string;
  relevance: number;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  duration_ms: number;
}

// ============================================================================
// Recent & Saved Searches
// ============================================================================

export interface RecentSearch {
  id: string;
  query: string;
  entity_type: SearchEntityType | null;
  result_count: number;
  searched_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  query: string;
  entity_types: SearchEntityType[];
  filters: Record<string, unknown>;
  is_pinned: boolean;
  created_at: string;
  last_used_at: string | null;
  use_count: number;
}

export interface SavedSearchInput {
  name: string;
  query: string;
  entity_types?: SearchEntityType[];
  filters?: Record<string, unknown>;
  is_pinned?: boolean;
}

// ============================================================================
// Quick Actions (Command Palette)
// ============================================================================

export interface QuickAction {
  id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  action_type: QuickActionType;
  action_data: {
    url?: string;
    entity?: string;
    modal?: string;
    action?: string;
  };
  shortcut: string | null;
  category: QuickActionCategory;
  is_enabled: boolean;
  display_order: number;
}

// ============================================================================
// Search Parameters
// ============================================================================

export interface GlobalSearchParams {
  query: string;
  entity_types?: SearchEntityType[];
  limit?: number;
}

export interface SearchAnalyticsInput {
  query: string;
  entity_type?: SearchEntityType;
  result_count: number;
  clicked_result_id?: string;
  clicked_result_type?: SearchEntityType;
  search_duration_ms?: number;
}

// ============================================================================
// Command Palette State
// ============================================================================

export interface CommandPaletteState {
  isOpen: boolean;
  mode: 'search' | 'commands';
  query: string;
  selectedIndex: number;
}

// ============================================================================
// Keyboard Shortcut Types
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  description: string;
  category: string;
  action: () => void;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}
