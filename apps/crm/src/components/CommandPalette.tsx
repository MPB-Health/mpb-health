// ============================================================================
// Command Palette — Global search and quick actions (Cmd+K)
// CRM-specific implementation
// ============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Command,
  Users,
  Building2,
  UserCircle,
  DollarSign,
  GitBranch,
  CheckSquare,
  CalendarDays,
  FileCheck,
  Receipt,
  Megaphone,
  Package,
  BarChart3,
  Settings,
  LayoutDashboard,
  UserPlus,
  RefreshCw,
  Download,
  Link,
  Keyboard,
  HelpCircle,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import {
  useCommandPalette,
  useCRMSearch,
  useQuickActions,
  type CRMSearchResult,
  type QuickAction,
} from '../hooks/useCommandPalette';

// ============================================================================
// Icon Mapping
// ============================================================================

const ENTITY_ICONS: Record<string, typeof Search> = {
  lead: Users,
  account: Building2,
  contact: UserCircle,
  deal: DollarSign,
  product: Package,
  quote: FileCheck,
  invoice: Receipt,
  campaign: Megaphone,
  task: CheckSquare,
};

const ACTION_ICONS: Record<string, typeof Search> = {
  'layout-dashboard': LayoutDashboard,
  'users': Users,
  'building-2': Building2,
  'user-circle': UserCircle,
  'dollar-sign': DollarSign,
  'git-branch': GitBranch,
  'check-square': CheckSquare,
  'calendar-days': CalendarDays,
  'file-check': FileCheck,
  'receipt': Receipt,
  'megaphone': Megaphone,
  'bar-chart-3': BarChart3,
  'settings': Settings,
  'user-plus': UserPlus,
  'refresh-cw': RefreshCw,
  'download': Download,
  'link': Link,
  'keyboard': Keyboard,
  'help-circle': HelpCircle,
};

const ENTITY_COLORS: Record<string, string> = {
  lead: 'text-blue-500',
  account: 'text-blue-500',
  contact: 'text-green-500',
  deal: 'text-amber-500',
  product: 'text-cyan-500',
  quote: 'text-blue-500',
  invoice: 'text-rose-500',
  campaign: 'text-orange-500',
  task: 'text-green-500',
};

// ============================================================================
// Entity path mapping
// ============================================================================

function getEntityPath(entityType: string, entityId: string): string {
  const pathMap: Record<string, string> = {
    lead: `/leads/${entityId}`,
    account: `/accounts/${entityId}`,
    contact: `/contacts/${entityId}`,
    deal: `/deals/${entityId}`,
    product: `/products/${entityId}`,
    quote: `/quotes/${entityId}`,
    invoice: `/invoices/${entityId}`,
    campaign: `/campaigns/${entityId}`,
    task: `/tasks`,
  };
  return pathMap[entityType] || '/';
}

// ============================================================================
// Create entity URLs
// ============================================================================

const CREATE_ENTITY_MODALS: Record<string, string> = {
  lead: 'addLead',
  account: 'addAccount',
  contact: 'addContact',
  deal: 'addDeal',
  task: 'addTask',
  quote: 'addQuote',
  invoice: 'addInvoice',
};

// ============================================================================
// Result Item Component
// ============================================================================

interface ResultItemProps {
  result: CRMSearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function ResultItem({ result, isSelected, onSelect }: ResultItemProps) {
  const Icon = ENTITY_ICONS[result.entity_type] || Search;
  const colorClass = ENTITY_COLORS[result.entity_type] || 'text-th-text-secondary';

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${colorClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="text-xs text-th-text-secondary truncate">{result.subtitle}</p>
        )}
      </div>
      <span className="text-xs text-th-text-secondary capitalize bg-surface-tertiary px-2 py-0.5 rounded">
        {result.entity_type}
      </span>
      {isSelected && <ArrowRight className="w-4 h-4 text-blue-600" />}
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
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 text-th-text-secondary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary">{action.name}</p>
        {action.description && (
          <p className="text-xs text-th-text-secondary truncate">{action.description}</p>
        )}
      </div>
      {action.shortcut && (
        <kbd className="text-xs text-th-text-secondary bg-surface-tertiary px-2 py-0.5 rounded font-mono">
          {action.shortcut}
        </kbd>
      )}
    </button>
  );
}

// ============================================================================
// Command Palette Component
// ============================================================================

interface CommandPaletteProps {
  onCreateEntity?: (entityType: string) => void;
}

export default function CommandPalette({ onCreateEntity }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { isOpen, mode, setMode, close } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { query, setQuery, results, loading, durationMs } = useCRMSearch({
    debounceMs: 200,
    minQueryLength: 2,
    limit: 10,
  });

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
    return [];
  }, [mode, query, results, filteredActions]);

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
    (item: CRMSearchResult | QuickAction) => {
      close();

      // Search result
      if ('entity_type' in item) {
        const path = getEntityPath(item.entity_type, item.entity_id);
        navigate(path);
        return;
      }

      // Quick action
      const action = item as QuickAction;
      switch (action.action_type) {
        case 'navigate':
          if (action.action_data.url) {
            navigate(action.action_data.url);
          }
          break;
        case 'create':
          if (action.action_data.entity && onCreateEntity) {
            onCreateEntity(action.action_data.entity);
          } else if (action.action_data.entity) {
            // Fallback: navigate to list page with create param
            const entityPaths: Record<string, string> = {
              lead: '/leads?action=create',
              account: '/accounts?action=create',
              contact: '/contacts?action=create',
              deal: '/deals?action=create',
              task: '/tasks?action=create',
              quote: '/quotes?action=create',
              invoice: '/invoices?action=create',
            };
            const path = entityPaths[action.action_data.entity];
            if (path) {
              navigate(path);
              toast.success(`Creating new ${action.action_data.entity}...`);
            }
          }
          break;
        case 'toggle':
          if (action.action_data.modal === 'shortcuts') {
            toast('Press Cmd+K for search, Tab to switch modes, arrow keys to navigate, Enter to select.');
          }
          break;
        case 'custom':
          handleCustomAction(action.action_data.action);
          break;
      }
    },
    [close, navigate, onCreateEntity]
  );

  const handleCustomAction = (actionId?: string) => {
    switch (actionId) {
      case 'refresh-data':
        window.location.reload();
        break;
      case 'copy-page-url':
        navigator.clipboard.writeText(window.location.href);
        toast.success('URL copied to clipboard');
        break;
      case 'export-view':
        // Trigger CSV export of the current page's data
        window.dispatchEvent(new CustomEvent('crm:export-view'));
        toast.success('Export initiated');
        break;
      case 'open-docs':
        window.open('https://docs.mpbhealth.com', '_blank');
        break;
      default:
        toast.error(`Unknown action: ${actionId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
        <div className="bg-surface-primary rounded-xl shadow-2xl border border-th-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border">
            {mode === 'search' ? (
              <Search className="w-5 h-5 text-th-text-tertiary" />
            ) : (
              <Command className="w-5 h-5 text-th-text-tertiary" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'search'
                  ? 'Search leads, accounts, contacts, deals...'
                  : 'Type a command or action...'
              }
              className="flex-1 bg-transparent border-none outline-none text-th-text-primary placeholder:text-th-text-tertiary"
            />
            {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            <button
              onClick={close}
              className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
              title="Close (Esc)"
              aria-label="Close command palette"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-th-border">
            <button
              onClick={() => setMode('search')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-th-text-secondary hover:text-th-text-primary'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </button>
            <button
              onClick={() => setMode('commands')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'commands'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-th-text-secondary hover:text-th-text-primary'
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
                    <div className="px-4 py-2 text-xs font-medium text-th-text-secondary uppercase tracking-wider bg-surface-secondary">
                      Results
                      {durationMs && (
                        <span className="ml-2 font-normal">({durationMs}ms)</span>
                      )}
                    </div>
                    {results.map((result, index) => (
                      <div key={`${result.entity_type}-${result.entity_id}`} data-selected={index === selectedIndex}>
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
                    <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
                    <p className="text-th-text-secondary">No results found for &quot;{query}&quot;</p>
                    <p className="text-sm text-th-text-tertiary mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {query.length < 2 && (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
                    <p className="text-th-text-secondary">Start typing to search</p>
                    <p className="text-sm text-th-text-tertiary mt-1">
                      Search across leads, accounts, contacts, deals, and more
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
                    {['navigation', 'create', 'tools', 'help'].map((category) => {
                      const categoryActions = filteredActions.filter(
                        (a) => a.category === category
                      );
                      if (categoryActions.length === 0) return null;

                      const categoryLabels: Record<string, string> = {
                        navigation: 'Go to',
                        create: 'Create',
                        tools: 'Tools',
                        help: 'Help',
                      };

                      return (
                        <div key={category}>
                          <div className="px-4 py-2 text-xs font-medium text-th-text-secondary uppercase tracking-wider bg-surface-secondary">
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
                    <Command className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
                    <p className="text-th-text-secondary">No commands found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-th-border bg-surface-secondary flex items-center justify-between text-xs text-th-text-secondary">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">
                  Tab
                </kbd>{' '}
                Switch mode
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">
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

export { useCommandPalette };
