// ============================================================================
// Command Palette Hooks — CRM-specific search and quick actions
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface CRMSearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  extra_info: string | null;
  rank: number;
}

export interface QuickAction {
  id: string;
  name: string;
  description?: string;
  icon: string;
  shortcut?: string;
  category: 'navigation' | 'create' | 'help' | 'tools';
  action_type: 'navigate' | 'create' | 'toggle' | 'custom';
  action_data: {
    url?: string;
    entity?: string;
    modal?: string;
    action?: string;
  };
}

// ============================================================================
// CRM Quick Actions Configuration
// ============================================================================

const CRM_QUICK_ACTIONS: QuickAction[] = [
  // Navigation
  // Round 11 (2026-05-15): Accounts / Deals / Deal Pipeline / Campaigns
  // entries removed from the palette to match the sidebar removal.
  // /deal-pipeline still resolves (now redirects to /pipeline) so any
  // bookmarked palette workflows survive; we just don't surface them in
  // the picker. The Lead Pipeline (`/pipeline`) is the only pipeline
  // surface going forward.
  { id: 'nav-dashboard', name: 'Go to Dashboard', icon: 'layout-dashboard', category: 'navigation', action_type: 'navigate', action_data: { url: '/' } },
  { id: 'nav-leads', name: 'Go to Leads', icon: 'users', category: 'navigation', action_type: 'navigate', action_data: { url: '/leads' } },
  { id: 'nav-members', name: 'Go to Members', icon: 'user-circle', category: 'navigation', action_type: 'navigate', action_data: { url: '/members' } },
  { id: 'nav-tasks', name: 'Go to Tasks', icon: 'check-square', category: 'navigation', action_type: 'navigate', action_data: { url: '/tasks' } },
  { id: 'nav-calendar', name: 'Go to Calendar', icon: 'calendar-days', category: 'navigation', action_type: 'navigate', action_data: { url: '/calendar' } },
  { id: 'nav-reports', name: 'Go to Reports', icon: 'bar-chart-3', category: 'navigation', action_type: 'navigate', action_data: { url: '/reports' } },
  { id: 'nav-settings', name: 'Go to Settings', icon: 'settings', category: 'navigation', action_type: 'navigate', action_data: { url: '/settings' } },

  // Create
  { id: 'create-lead', name: 'Create Lead', description: 'Add a new lead', icon: 'user-plus', shortcut: 'L', category: 'create', action_type: 'create', action_data: { entity: 'lead' } },
  { id: 'create-member', name: 'Create Member', description: 'Add a new member', icon: 'user-circle', category: 'create', action_type: 'create', action_data: { entity: 'contact' } },
  { id: 'create-task', name: 'Create Task', description: 'Add a new task', icon: 'check-square', shortcut: 'T', category: 'create', action_type: 'create', action_data: { entity: 'task' } },

  // Navigation — Workspaces (Section 9: Today + Dashboard merged into /today.
  // Sales Activity tab removed in favor of /sales-daily-logs.)
  { id: 'nav-today', name: 'Go to Today', description: 'Your daily command center', icon: 'sun', category: 'navigation', action_type: 'navigate', action_data: { url: '/today' } },
  { id: 'nav-pipeline', name: 'Go to Pipeline Board', icon: 'git-branch', category: 'navigation', action_type: 'navigate', action_data: { url: '/pipeline' } },
  { id: 'nav-inbox', name: 'Go to Inbox', icon: 'inbox', category: 'navigation', action_type: 'navigate', action_data: { url: '/email/inbox' } },
  { id: 'nav-daily-log', name: 'Go to Sales Daily Logs', icon: 'activity', category: 'navigation', action_type: 'navigate', action_data: { url: '/sales-daily-logs' } },

  // Tools
  { id: 'tool-refresh', name: 'Refresh Data', description: 'Reload current page data', icon: 'refresh-cw', category: 'tools', action_type: 'custom', action_data: { action: 'refresh-data' } },
  { id: 'tool-export', name: 'Export Current View', description: 'Export data to CSV', icon: 'download', category: 'tools', action_type: 'custom', action_data: { action: 'export-view' } },
  { id: 'tool-copy-url', name: 'Copy Page URL', description: 'Copy current URL to clipboard', icon: 'link', category: 'tools', action_type: 'custom', action_data: { action: 'copy-page-url' } },

  // Insurance-specific quick actions
  { id: 'tool-hs-leads', name: 'HealthShare Leads', description: 'View HealthShare pipeline', icon: 'shield', category: 'tools', action_type: 'navigate', action_data: { url: '/leads?planType=healthshare' } },
  { id: 'tool-ti-leads', name: 'Traditional Insurance Leads', description: 'View Traditional pipeline', icon: 'shield-check', category: 'tools', action_type: 'navigate', action_data: { url: '/leads?planType=traditional_insurance' } },
  { id: 'tool-overdue', name: 'My Overdue Tasks', description: 'Tasks past due date', icon: 'alert-triangle', category: 'tools', action_type: 'navigate', action_data: { url: '/tasks?filter=overdue' } },
  { id: 'tool-followups', name: 'Follow-up Required', description: 'Leads needing follow-up', icon: 'phone-forwarded', category: 'tools', action_type: 'navigate', action_data: { url: '/leads?stage=follow_up' } },

  // Help
  { id: 'help-shortcuts', name: 'Keyboard Shortcuts', description: 'View all shortcuts', icon: 'keyboard', shortcut: '?', category: 'help', action_type: 'toggle', action_data: { modal: 'shortcuts' } },
  { id: 'help-docs', name: 'Documentation', description: 'Open help docs', icon: 'help-circle', category: 'help', action_type: 'custom', action_data: { action: 'open-docs' } },
  { id: 'help-learning-center', name: 'Learning Center', description: 'Browse guides and tutorials', icon: 'graduation-cap', category: 'help', action_type: 'navigate', action_data: { url: '/learning-center' } },
  { id: 'help-panel', name: 'Page Help', description: 'Open help for this page', icon: 'help-circle', shortcut: '/', category: 'help', action_type: 'custom', action_data: { action: 'open-help-panel' } },
];

// ============================================================================
// Command Palette State Hook
// ============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'commands'>('search');

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger if typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

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
// Global Search Hook (CRM-specific)
// ============================================================================

export function useCRMSearch(options: {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
} = {}) {
  const { activeOrgId } = useOrg();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CRMSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const {
    debounceMs = 300,
    minQueryLength = 2,
    limit = 10,
  } = options;

  // Debounced search
  useEffect(() => {
    if (!activeOrgId || query.length < minQueryLength) {
      setResults([]);
      setDurationMs(null);
      return;
    }

    const startTime = performance.now();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: searchError } = await supabase.rpc('crm_global_search', {
          p_org_id: activeOrgId,
          p_query: query,
          p_limit: limit,
        });

        if (searchError) {
          throw searchError;
        }

        setResults((data as unknown as CRMSearchResult[]) || []);
        setDurationMs(Math.round(performance.now() - startTime));
      } catch (err) {
        console.error('[useCRMSearch] Search failed:', err);
        setError('Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, activeOrgId, limit, debounceMs, minQueryLength]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setDurationMs(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    durationMs,
    clearSearch,
    hasResults: results.length > 0,
  };
}

// ============================================================================
// Quick Actions Hook
// ============================================================================

export function useQuickActions() {
  const { can } = useOrg();

  // Filter actions based on permissions
  const actions = useMemo(() => {
    return CRM_QUICK_ACTIONS.filter((action) => {
      // Permission checks for specific actions
      if (action.id.startsWith('nav-leads') || action.id === 'create-lead') {
        return can('leads.read');
      }
      if (action.id.startsWith('nav-accounts') || action.id === 'create-account') {
        return can('accounts.read');
      }
      if (action.id.startsWith('nav-contacts') || action.id === 'create-contact') {
        return can('contacts.read');
      }
      if (action.id.startsWith('nav-deals') || action.id.startsWith('nav-deal-pipeline') || action.id === 'create-deal') {
        return can('deals.read');
      }
      if (action.id.startsWith('nav-tasks') || action.id.startsWith('nav-calendar') || action.id === 'create-task') {
        return can('tasks.read');
      }
      if (action.id.startsWith('nav-quotes') || action.id === 'create-quote') {
        return can('quotes.read');
      }
      if (action.id.startsWith('nav-invoices') || action.id === 'create-invoice') {
        return can('invoices.read');
      }
      if (action.id.startsWith('nav-campaigns')) {
        return can('campaigns.read');
      }
      if (action.id.startsWith('nav-settings')) {
        return can('settings.manage');
      }
      return true;
    });
  }, [can]);

  const filterActions = useCallback(
    (searchQuery: string) => {
      const lowerQuery = searchQuery.toLowerCase();
      return actions.filter(
        (action) =>
          action.name.toLowerCase().includes(lowerQuery) ||
          action.description?.toLowerCase().includes(lowerQuery) ||
          action.category.toLowerCase().includes(lowerQuery)
      );
    },
    [actions]
  );

  const groupedActions = useMemo(() => {
    return actions.reduce((groups, action) => {
      const category = action.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
      return groups;
    }, {} as Record<string, QuickAction[]>);
  }, [actions]);

  return {
    actions,
    groupedActions,
    filterActions,
  };
}
