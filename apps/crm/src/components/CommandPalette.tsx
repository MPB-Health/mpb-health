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
  Clock,
  Phone,
} from 'lucide-react';
import {
  useCommandPalette,
  useCRMSearch,
  useQuickActions,
  type CRMSearchResult,
  type QuickAction,
} from '../hooks/useCommandPalette';

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
  account: 'text-purple-500',
  contact: 'text-emerald-500',
  deal: 'text-amber-500',
  product: 'text-indigo-500',
  quote: 'text-cyan-500',
  invoice: 'text-orange-500',
  campaign: 'text-rose-500',
  task: 'text-teal-500',
};

const ENTITY_BGS: Record<string, string> = {
  lead: 'bg-blue-50 dark:bg-blue-500/10',
  account: 'bg-purple-50 dark:bg-purple-500/10',
  contact: 'bg-emerald-50 dark:bg-emerald-500/10',
  deal: 'bg-amber-50 dark:bg-amber-500/10',
  product: 'bg-indigo-50 dark:bg-indigo-500/10',
  quote: 'bg-cyan-50 dark:bg-cyan-500/10',
  invoice: 'bg-orange-50 dark:bg-orange-500/10',
  campaign: 'bg-rose-50 dark:bg-rose-500/10',
  task: 'bg-teal-50 dark:bg-teal-500/10',
};

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

interface RecentRecord {
  entity_type: string;
  entity_id: string;
  title: string;
  timestamp: number;
}

const RECENT_KEY = 'mpb_crm_recent_records';

function getRecentRecords(): RecentRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRecentRecord(record: Omit<RecentRecord, 'timestamp'>) {
  const existing = getRecentRecords().filter(
    (r) => !(r.entity_type === record.entity_type && r.entity_id === record.entity_id)
  );
  const updated = [{ ...record, timestamp: Date.now() }, ...existing].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

// ────────────────────────────────────────────────────────────────────────────

interface ResultItemProps {
  result: CRMSearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function ResultItem({ result, isSelected, onSelect }: ResultItemProps) {
  const Icon = ENTITY_ICONS[result.entity_type] || Search;
  const colorClass = ENTITY_COLORS[result.entity_type] || 'text-th-text-secondary';
  const bgClass = ENTITY_BGS[result.entity_type] || 'bg-gray-50 dark:bg-gray-500/10';
  const isFamilyMatch = result.subtitle?.startsWith('Family of ');
  const isPhoneMatch = result.subtitle?.startsWith('Phone for ');

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-th-accent-500/8 border-l-2 border-th-accent-500'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${bgClass} ${colorClass}`}>
        {isPhoneMatch ? <Phone className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{result.title}</p>
        {result.subtitle && (
          <p className={`text-xs truncate ${
            isFamilyMatch || isPhoneMatch ? 'text-th-accent-600 font-medium' : 'text-th-text-tertiary'
          }`}>
            {result.subtitle}
          </p>
        )}
      </div>
      <span className="text-[10px] text-th-text-tertiary shrink-0 capitalize bg-surface-tertiary px-2 py-0.5 rounded">
        {result.entity_type}
      </span>
      {isSelected && <ArrowRight className="w-4 h-4 text-th-accent-500" />}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────

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
          ? 'bg-th-accent-500/8 border-l-2 border-th-accent-500'
          : 'hover:bg-surface-secondary border-l-2 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 text-th-text-secondary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary">{action.name}</p>
        {action.description && (
          <p className="text-xs text-th-text-tertiary truncate">{action.description}</p>
        )}
      </div>
      {action.shortcut && (
        <kbd className="text-xs text-th-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded font-mono">
          {action.shortcut}
        </kbd>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  onCreateEntity?: (entityType: string) => void;
}

export default function CommandPalette({ onCreateEntity }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { isOpen, mode, setMode, close } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);

  const { query, setQuery, results, loading, durationMs } = useCRMSearch({
    debounceMs: 200,
    minQueryLength: 2,
    limit: 12,
  });

  const { actions, filterActions } = useQuickActions();

  const filteredActions = useMemo(() => {
    if (mode === 'commands') {
      return query ? filterActions(query) : actions;
    }
    return [];
  }, [mode, query, actions, filterActions]);

  // Build combined items list for navigation
  const items = useMemo(() => {
    if (mode === 'commands') return filteredActions;
    if (query.length >= 2) return results;
    return recentRecords.map((r) => ({
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      title: r.title,
      subtitle: null,
      extra_info: null,
      rank: 0,
    })) as CRMSearchResult[];
  }, [mode, query, results, filteredActions, recentRecords]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setRecentRecords(getRecentRecords());
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
          if (items.length > 0 && selectedIndex < items.length) {
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

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CRMSearchResult | QuickAction) => {
      close();

      if ('entity_type' in item) {
        const path = getEntityPath(item.entity_type, item.entity_id);
        addRecentRecord({ entity_type: item.entity_type, entity_id: item.entity_id, title: item.title });
        navigate(path);
        return;
      }

      const action = item as QuickAction;
      switch (action.action_type) {
        case 'navigate':
          if (action.action_data.url) navigate(action.action_data.url);
          break;
        case 'create':
          if (action.action_data.entity && onCreateEntity) {
            onCreateEntity(action.action_data.entity);
          } else if (action.action_data.entity) {
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
    [close, navigate, onCreateEntity],
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
        window.dispatchEvent(new CustomEvent('crm:export-view'));
        toast.success('Export initiated');
        break;
      case 'open-docs':
        window.open('https://docs.mpbhealth.com', '_blank');
        break;
      case 'open-help-panel':
        window.dispatchEvent(new CustomEvent('crm:toggle-help-panel'));
        break;
      default:
        toast.error(`Unknown action: ${actionId}`);
    }
  };

  if (!isOpen) return null;

  const showRecents = mode === 'search' && query.length < 2 && recentRecords.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[12%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
        <div className="bg-surface-primary rounded-2xl shadow-2xl border border-th-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border">
            {mode === 'search' ? (
              <Search className="w-5 h-5 text-th-text-tertiary shrink-0" />
            ) : (
              <Command className="w-5 h-5 text-th-text-tertiary shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'search'
                  ? 'Search leads, contacts, family, phone...'
                  : 'Type a command or action...'
              }
              className="flex-1 bg-transparent border-none outline-none text-th-text-primary placeholder:text-th-text-tertiary"
            />
            {loading && <Loader2 className="w-5 h-5 text-th-accent-500 animate-spin shrink-0" />}
            <button
              onClick={close}
              className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
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
                  ? 'text-th-accent-600 border-b-2 border-th-accent-500'
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
                  ? 'text-th-accent-600 border-b-2 border-th-accent-500'
                  : 'text-th-text-secondary hover:text-th-text-primary'
              }`}
            >
              <Command className="w-4 h-4 inline mr-2" />
              Commands
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[420px] overflow-y-auto">
            {mode === 'search' && (
              <>
                {/* Recent Records */}
                {showRecents && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-th-text-secondary uppercase tracking-wider bg-surface-secondary flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Recent Records
                    </div>
                    {recentRecords.map((record, index) => {
                      const Icon = ENTITY_ICONS[record.entity_type] || Search;
                      const colorClass = ENTITY_COLORS[record.entity_type] || 'text-th-text-secondary';
                      const bgClass = ENTITY_BGS[record.entity_type] || 'bg-gray-50';
                      return (
                        <div key={`recent-${record.entity_type}-${record.entity_id}`} data-selected={index === selectedIndex}>
                          <button
                            onClick={() => handleSelect({
                              entity_type: record.entity_type,
                              entity_id: record.entity_id,
                              title: record.title,
                              subtitle: null,
                              extra_info: null,
                              rank: 0,
                            })}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              index === selectedIndex
                                ? 'bg-th-accent-500/8 border-l-2 border-th-accent-500'
                                : 'hover:bg-surface-secondary border-l-2 border-transparent'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${bgClass} ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-th-text-primary truncate">{record.title}</p>
                            </div>
                            <span className="text-[10px] text-th-text-tertiary shrink-0 capitalize bg-surface-tertiary px-2 py-0.5 rounded">
                              {record.entity_type}
                            </span>
                            {index === selectedIndex && <ArrowRight className="w-4 h-4 text-th-accent-500" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search Results */}
                {query.length >= 2 && results.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-th-text-secondary uppercase tracking-wider bg-surface-secondary">
                      Results
                      {durationMs && <span className="ml-2 font-normal">({durationMs}ms)</span>}
                    </div>
                    {results.map((result, index) => (
                      <div key={`${result.entity_type}-${result.entity_id}-${index}`} data-selected={index === selectedIndex}>
                        <ResultItem
                          result={result}
                          isSelected={index === selectedIndex}
                          onSelect={() => handleSelect(result)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {query.length >= 2 && !loading && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-th-text-secondary">No results for &quot;{query}&quot;</p>
                    <p className="text-sm text-th-text-tertiary mt-1">
                      Try searching by name, email, phone, or family member name
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {query.length < 2 && !showRecents && (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-th-text-secondary">Start typing to search</p>
                    <p className="text-sm text-th-text-tertiary mt-1">
                      Search across leads, contacts, family members, phone numbers, and more
                    </p>
                  </div>
                )}
              </>
            )}

            {mode === 'commands' && (
              <>
                {filteredActions.length > 0 ? (
                  <div>
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
                              <div key={action.id} data-selected={globalIndex === selectedIndex}>
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
                    <Command className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-th-text-secondary">No commands found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-th-border bg-surface-secondary flex items-center justify-between text-xs text-th-text-tertiary">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">↑↓</kbd>
                {' '}Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">↵</kbd>
                {' '}Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">Tab</kbd>
                {' '}Switch mode
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border font-mono">Esc</kbd>
              {' '}Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export { useCommandPalette };
