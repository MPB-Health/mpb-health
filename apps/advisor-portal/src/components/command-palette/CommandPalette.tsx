// ============================================================================
// Command Palette — Global search and quick actions (Cmd+K)
// ============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Command,
  Users,
  MessageSquare,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Workflow,
  Clock,
  Star,
  X,
  Loader2,
  LayoutDashboard,
  Zap,
  Inbox,
  BarChart3,
  Settings,
  UserPlus,
  Calendar,
  PlusCircle,
  Keyboard,
  HelpCircle,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import {
  useGlobalSearch,
  useRecentSearches,
  useQuickActions,
  useCommandPalette,
} from '../../hooks/useSearch';
import type { SearchResult, QuickAction, SearchEntityType } from '@mpbhealth/champion-core';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

// ============================================================================
// Icon Mapping
// ============================================================================

const ENTITY_ICONS: Record<SearchEntityType | string, typeof Search> = {
  lead: Users,
  message: MessageSquare,
  task: CheckCircle,
  document: BookOpen,
  training: GraduationCap,
  sequence: Workflow,
};

const ACTION_ICONS: Record<string, typeof Search> = {
  'layout-dashboard': LayoutDashboard,
  zap: Zap,
  inbox: Inbox,
  users: Users,
  'bar-chart-3': BarChart3,
  settings: Settings,
  'user-plus': UserPlus,
  'message-square-plus': MessageSquare,
  'plus-circle': PlusCircle,
  'calendar-plus': Calendar,
  workflow: Workflow,
  keyboard: Keyboard,
  'help-circle': HelpCircle,
  'message-circle': MessageCircle,
};

const ENTITY_COLORS: Record<SearchEntityType | string, string> = {
  lead: 'text-blue-500',
  message: 'text-blue-500',
  task: 'text-green-500',
  document: 'text-yellow-500',
  training: 'text-blue-500',
  sequence: 'text-cyan-500',
};

// ============================================================================
// Result Item Component
// ============================================================================

interface ResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function ResultItem({ result, isSelected, onSelect }: ResultItemProps) {
  const Icon = ENTITY_ICONS[result.entity_type] || Search;
  const colorClass = ENTITY_COLORS[result.entity_type] || 'text-gray-500';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-th-accent-50 border-l-2 border-th-accent-600'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${colorClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="text-xs text-th-text-muted truncate">{result.subtitle}</p>
        )}
      </div>
      <span className="text-xs text-th-text-muted capitalize bg-surface-secondary px-2 py-0.5 rounded">
        {result.entity_type}
      </span>
      {isSelected && <ArrowRight className="w-4 h-4 text-th-accent-600" />}
    </button>
  );
}

// ============================================================================
// Quick Action Item Component
// ============================================================================

interface ActionItemProps {
  action: QuickAction;
  isSelected: boolean;
  onSelect: () => void;
}

function ActionItem({ action, isSelected, onSelect }: ActionItemProps) {
  const Icon = ACTION_ICONS[action.icon] || Command;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-th-accent-50 border-l-2 border-th-accent-600'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 text-th-text-secondary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary">{action.name}</p>
        {action.description && (
          <p className="text-xs text-th-text-muted truncate">{action.description}</p>
        )}
      </div>
      {action.shortcut && (
        <kbd className="text-xs text-th-text-muted bg-surface-secondary px-2 py-0.5 rounded font-mono">
          {action.shortcut}
        </kbd>
      )}
    </button>
  );
}

// ============================================================================
// Command Palette Component
// ============================================================================

// Entity type to creation URL mapping
const CREATE_ENTITY_URLS: Record<string, string> = {
  lead: '/leads?action=create',
  task: '/power-list?action=create-task',
  sequence: '/sequences?action=create',
  message: '/inbox?action=compose',
};

// Custom action handlers
const CUSTOM_ACTION_HANDLERS: Record<string, () => void> = {
  'refresh-data': () => {
    window.location.reload();
  },
  'clear-cache': () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Cache cleared');
  },
  'copy-page-url': () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('URL copied to clipboard');
  },
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { isOpen, mode, setMode, close } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const { query, setQuery, results, loading, clearSearch, durationMs } = useGlobalSearch({
    debounceMs: 200,
    minQueryLength: 2,
    limit: 10,
  });

  const { recentSearches } = useRecentSearches(5);
  const { actions, filterActions } = useQuickActions();

  // Filter actions based on query when in commands mode
  const filteredActions = useMemo(() => {
    if (mode === 'commands') {
      return query ? filterActions(query) : actions;
    }
    return [];
  }, [mode, query, actions, filterActions]);

  // Combined items for navigation
  const items = useMemo(() => {
    if (mode === 'commands') {
      return filteredActions;
    }
    if (query.length >= 2) {
      return results;
    }
    return recentSearches;
  }, [mode, query, results, recentSearches, filteredActions]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen, setQuery]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (items.length > 0) {
            handleSelect(items[selectedIndex]);
          }
          break;
        case 'Tab':
          event.preventDefault();
          setMode(mode === 'search' ? 'commands' : 'search');
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, mode, setMode]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: SearchResult | QuickAction | { query: string }) => {
      close();

      // Search result
      if ('entity_type' in item) {
        navigate(item.url);
        return;
      }

      // Quick action
      if ('action_type' in item) {
        const action = item as unknown as QuickAction;
        switch (action.action_type) {
          case 'navigate':
            if (action.action_data.url) {
              navigate(action.action_data.url);
            }
            break;
          case 'create':
            // Navigate to create URL if provided, otherwise use entity mapping
            if (action.action_data.url) {
              navigate(action.action_data.url);
            } else if (action.action_data.entity) {
              const createUrl = CREATE_ENTITY_URLS[action.action_data.entity];
              if (createUrl) {
                navigate(createUrl);
                toast.success(`Creating new ${action.action_data.entity}...`);
              } else {
                toast.error(`Cannot create ${action.action_data.entity} from here`);
              }
            }
            break;
          case 'toggle':
            // Handle toggle actions (modals, panels, etc.)
            if (action.action_data.modal === 'shortcuts') {
              setShowShortcutsModal(true);
            } else if (action.action_data.modal) {
              toast(`${action.action_data.modal} not implemented yet`);
            }
            break;
          case 'custom':
            // Handle custom actions
            if (action.action_data.action) {
              const handler = CUSTOM_ACTION_HANDLERS[action.action_data.action];
              if (handler) {
                handler();
              } else {
                toast.error(`Unknown action: ${action.action_data.action}`);
              }
            }
            break;
        }
        return;
      }

      // Recent search
      if ('query' in item) {
        setQuery(item.query);
      }
    },
    [close, navigate, setQuery]
  );

  if (!isOpen && !showShortcutsModal) return null;

  // Show only shortcuts modal if open
  if (!isOpen && showShortcutsModal) {
    return (
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    );
  }

  return (
    <>
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
        <div className="bg-surface-primary rounded-xl shadow-2xl border border-th-border-primary overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border-primary">
            {mode === 'search' ? (
              <Search className="w-5 h-5 text-th-text-muted" />
            ) : (
              <Command className="w-5 h-5 text-th-text-muted" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'search'
                  ? 'Search leads, messages, tasks...'
                  : 'Type a command or search...'
              }
              className="flex-1 bg-transparent border-none outline-none text-th-text-primary placeholder:text-th-text-muted"
            />
            {loading && <Loader2 className="w-5 h-5 text-th-accent-600 animate-spin" />}
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="p-1 text-th-text-muted hover:text-th-text-primary rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-th-border-primary">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'search'
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-muted hover:text-th-text-primary'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </button>
            <button
              type="button"
              onClick={() => setMode('commands')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'commands'
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-muted hover:text-th-text-primary'
              }`}
            >
              <Command className="w-4 h-4 inline mr-2" />
              Commands
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-96 overflow-y-auto">
            {mode === 'search' && (
              <>
                {/* Search Results */}
                {query.length >= 2 && results.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-th-text-muted uppercase tracking-wider bg-surface-secondary">
                      Results
                      {durationMs && (
                        <span className="ml-2 font-normal">({durationMs}ms)</span>
                      )}
                    </div>
                    {results.map((result, index) => (
                      <div key={result.entity_id} data-selected={index === selectedIndex}>
                        <ResultItem
                          result={result}
                          isSelected={index === selectedIndex}
                          onSelect={() => handleSelect(result)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {query.length >= 2 && !loading && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                    <p className="text-th-text-secondary">No results found for &quot;{query}&quot;</p>
                    <p className="text-sm text-th-text-muted mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {/* Recent Searches */}
                {query.length < 2 && recentSearches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-th-text-muted uppercase tracking-wider bg-surface-secondary flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        type="button"
                        key={search.id}
                        onClick={() => setQuery(search.query)}
                        data-selected={index === selectedIndex}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-th-accent-50 border-l-2 border-th-accent-600'
                            : 'hover:bg-surface-secondary border-l-2 border-transparent'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-th-text-muted" />
                        <span className="text-sm text-th-text-primary">{search.query}</span>
                        {search.result_count > 0 && (
                          <span className="text-xs text-th-text-muted ml-auto">
                            {search.result_count} results
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {query.length < 2 && recentSearches.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                    <p className="text-th-text-secondary">Start typing to search</p>
                    <p className="text-sm text-th-text-muted mt-1">
                      Search across leads, messages, tasks, and more
                    </p>
                  </div>
                )}
              </>
            )}

            {mode === 'commands' && (
              <>
                {filteredActions.length > 0 ? (
                  <div>
                    {/* Group by category */}
                    {['navigation', 'create', 'help'].map((category) => {
                      const categoryActions = filteredActions.filter(
                        (a) => a.category === category
                      );
                      if (categoryActions.length === 0) return null;

                      const categoryLabels: Record<string, string> = {
                        navigation: 'Go to',
                        create: 'Create',
                        help: 'Help',
                      };

                      return (
                        <div key={category}>
                          <div className="px-4 py-2 text-xs font-medium text-th-text-muted uppercase tracking-wider bg-surface-secondary">
                            {categoryLabels[category] || category}
                          </div>
                          {categoryActions.map((action) => {
                            const globalIndex = filteredActions.indexOf(action);
                            return (
                              <div
                                key={action.id}
                                data-selected={globalIndex === selectedIndex}
                              >
                                <ActionItem
                                  action={action}
                                  isSelected={globalIndex === selectedIndex}
                                  onSelect={() => handleSelect(action)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Command className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                    <p className="text-th-text-secondary">No commands found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-th-border-primary bg-surface-secondary flex items-center justify-between text-xs text-th-text-muted">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                  Tab
                </kbd>{' '}
                Switch mode
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
