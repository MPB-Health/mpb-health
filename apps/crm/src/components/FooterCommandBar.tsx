import type React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  UserPlus, CheckSquare, Phone, StickyNote, Calendar,
  Mail, Briefcase, MessageSquare, Search, Keyboard,
  HelpCircle, Plus, X, Zap,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FooterAction {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  color: string;
}

const ACTIONS: FooterAction[] = [
  { id: 'add-lead', label: 'Add Lead', shortcut: 'L', icon: UserPlus, color: 'text-sky-500' },
  { id: 'add-task', label: 'Add Task', shortcut: 'K', icon: CheckSquare, color: 'text-violet-500' },
  { id: 'log-call', label: 'Log Call', icon: Phone, color: 'text-green-500' },
  { id: 'send-email', label: 'Email', icon: Mail, color: 'text-cyan-500' },
  { id: 'add-event', label: 'Meeting', icon: Calendar, color: 'text-amber-500' },
  { id: 'add-note', label: 'Note', icon: StickyNote, color: 'text-yellow-500' },
  { id: 'add-deal', label: 'New Deal', icon: Briefcase, color: 'text-emerald-500' },
  { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare, color: 'text-th-accent-500' },
];

interface FooterCommandBarProps {
  onAction?: (actionId: string) => void;
  selectionCount?: number;
  recordCount?: number;
}

export function FooterCommandBar({ onAction, selectionCount = 0, recordCount }: FooterCommandBarProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback((actionId: string) => {
    window.dispatchEvent(new CustomEvent('crm:quick-action', { detail: { action: actionId } }));
    onAction?.(actionId);
    setMobileExpanded(false);
  }, [onAction]);

  // Keyboard shortcut for Cmd+/ to focus footer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const firstBtn = document.querySelector('[data-footer-action]') as HTMLButtonElement;
        firstBtn?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Desktop footer */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40">
        <div className="glass-footer">
          <div className="flex items-center h-12 px-4 lg:px-6 gap-4">
            {/* Left: context info */}
            <div className="flex items-center gap-3 shrink-0 min-w-[140px]">
              {selectionCount > 0 ? (
                <span className="text-xs font-medium text-th-accent-500 bg-th-accent-500/10 px-2.5 py-1 rounded-full tabular-nums">
                  {selectionCount} selected
                </span>
              ) : recordCount !== undefined ? (
                <span className="text-xs text-th-text-tertiary tabular-nums">
                  {recordCount.toLocaleString()} records
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-th-text-tertiary">
                  <Zap className="w-3 h-3 text-th-accent-500" />
                  Quick Actions
                </span>
              )}
            </div>

            {/* Center: action buttons */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {ACTIONS.map((action) => (
                <div key={action.id} className="relative">
                  <button
                    data-footer-action={action.id}
                    onClick={() => handleAction(action.id)}
                    onMouseEnter={() => setHoveredAction(action.id)}
                    onMouseLeave={() => setHoveredAction(null)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                      'transition-all duration-150',
                      'text-th-text-secondary hover:text-th-text-primary',
                      'hover:bg-surface-tertiary/80',
                      'focus-visible:ring-2 focus-visible:ring-th-accent-500/40 focus-visible:ring-offset-0'
                    )}
                  >
                    <action.icon className={cn('w-4 h-4', action.color)} />
                    <span className="hidden lg:inline">{action.label}</span>
                  </button>

                  {/* Tooltip */}
                  {hoveredAction === action.id && (
                    <div
                      ref={tooltipRef}
                      className={cn(
                        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg',
                        'bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium',
                        'whitespace-nowrap pointer-events-none',
                        'animate-[tooltipIn_0.1s_ease-out]'
                      )}
                    >
                      {action.label}
                      {action.shortcut && (
                        <kbd className="ml-1.5 px-1 py-0.5 rounded bg-white/15 text-[10px] font-mono">
                          {action.shortcut}
                        </kbd>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="w-px h-5 bg-th-border/50 mx-1" />

              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                  document.dispatchEvent(event);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs',
                  'text-th-text-tertiary hover:text-th-text-secondary',
                  'hover:bg-surface-tertiary/80 transition-colors'
                )}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Search</span>
                <kbd className="hidden xl:inline-flex px-1.5 py-0.5 rounded bg-surface-tertiary text-[10px] font-mono text-th-text-tertiary">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: help & shortcuts */}
            <div className="flex items-center gap-2 shrink-0 min-w-[140px] justify-end">
              <span className="hidden xl:flex items-center gap-1 text-[10px] text-th-text-tertiary">
                <Keyboard className="w-3 h-3" />
                ⌘/ for focus
              </span>
              <button
                className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-tertiary/80 transition-colors"
                title="Help & Shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        {mobileExpanded && (
          <div className="absolute bottom-14 right-0 glass rounded-2xl shadow-xl border border-th-border/50 p-2 min-w-[180px] animate-scale-in">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface-tertiary/80 transition-colors"
              >
                <action.icon className={cn('w-4 h-4', action.color)} />
                <span className="text-th-text-primary font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            'shadow-lg transition-all duration-200',
            mobileExpanded
              ? 'bg-surface-tertiary rotate-45'
              : 'gradient-accent glow-accent text-white'
          )}
        >
          {mobileExpanded ? (
            <X className="w-6 h-6 text-th-text-primary" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}

export default FooterCommandBar;
