import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, Search, ArrowRight, Users, Kanban, BarChart3, Mail,
  CheckSquare, Calendar, DollarSign, Filter, Clock, Loader2,
  Command, TrendingUp, FileText, Zap, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AICommandResult {
  id: string;
  type: 'navigate' | 'action' | 'query' | 'create';
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  action: () => void;
}

interface AICommandPaletteModalProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  'Show leads from Florida interested in Medicare Advantage',
  'How many deals closed this month?',
  'Draft a follow-up email for overdue leads',
  'Schedule calls for all leads not contacted in 7 days',
  'Which pipeline stage has the most leads?',
  'Find contacts without an email address',
];

const QUICK_COMMANDS: AICommandResult[] = [
  { id: 'leads-no-contact', type: 'query', label: 'Leads not contacted in 7+ days', description: 'Filter stale leads needing outreach', icon: Users, iconColor: 'text-amber-500', action: () => {} },
  { id: 'deals-closing', type: 'query', label: 'Deals closing this week', description: 'Pipeline items with close dates this week', icon: DollarSign, iconColor: 'text-emerald-500', action: () => {} },
  { id: 'overdue-tasks', type: 'query', label: 'Overdue tasks', description: 'All tasks past their due date', icon: CheckSquare, iconColor: 'text-red-500', action: () => {} },
  { id: 'top-sources', type: 'query', label: 'Top lead sources this month', description: 'Lead source performance breakdown', icon: TrendingUp, iconColor: 'text-blue-500', action: () => {} },
  { id: 'pipeline-health', type: 'query', label: 'Pipeline health check', description: 'Stage distribution and velocity metrics', icon: Kanban, iconColor: 'text-violet-500', action: () => {} },
  { id: 'draft-renewals', type: 'action', label: 'Draft renewal reminders', description: 'AI-generate emails for upcoming renewals', icon: Mail, iconColor: 'text-cyan-500', action: () => {} },
];

export function AICommandPaletteModal({ open, onClose }: AICommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<AICommandResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setAiResponse(null);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const processQuery = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setProcessing(true);
    setAiResponse(null);

    await new Promise((r) => setTimeout(r, 800));

    const lower = q.toLowerCase();
    const generated: AICommandResult[] = [];

    if (lower.includes('lead') || lower.includes('contact')) {
      generated.push({
        id: 'nav-leads', type: 'navigate', label: 'Go to Leads',
        description: 'Open the leads list with applied filters',
        icon: Users, iconColor: 'text-sky-500',
        action: () => { navigate('/leads'); onClose(); },
      });
    }
    if (lower.includes('deal') || lower.includes('pipeline')) {
      // Round 11: Deal Pipeline retired. The Lead Pipeline is the only
      // pipeline going forward (Section 1 / Section 5).
      generated.push({
        id: 'nav-pipeline', type: 'navigate', label: 'Go to Lead Pipeline',
        description: 'View leads in the pipeline board',
        icon: Kanban, iconColor: 'text-violet-500',
        action: () => { navigate('/pipeline'); onClose(); },
      });
    }
    if (lower.includes('email') || lower.includes('draft') || lower.includes('follow')) {
      generated.push({
        id: 'nav-email', type: 'action', label: 'Open Email Composer',
        description: 'Draft and send emails',
        icon: Mail, iconColor: 'text-cyan-500',
        action: () => { navigate('/email/inbox?compose=true'); onClose(); },
      });
    }
    if (lower.includes('report') || lower.includes('analytics') || lower.includes('how many')) {
      generated.push({
        id: 'nav-reports', type: 'navigate', label: 'View Reports',
        description: 'Open analytics and reporting dashboard',
        icon: BarChart3, iconColor: 'text-emerald-500',
        action: () => { navigate('/reports'); onClose(); },
      });
    }
    if (lower.includes('task') || lower.includes('todo') || lower.includes('overdue')) {
      generated.push({
        id: 'nav-tasks', type: 'navigate', label: 'View Tasks',
        description: 'See all tasks and to-dos',
        icon: CheckSquare, iconColor: 'text-amber-500',
        action: () => { navigate('/tasks'); onClose(); },
      });
    }
    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('meeting')) {
      generated.push({
        id: 'nav-calendar', type: 'navigate', label: 'Open Calendar',
        description: 'View scheduled events and meetings',
        icon: Calendar, iconColor: 'text-blue-500',
        action: () => { navigate('/calendar'); onClose(); },
      });
    }

    const aiText = `Based on your query "${q}", I found ${generated.length} relevant actions. ` +
      `I can help you filter leads, generate reports, draft communications, or navigate to any part of the CRM. ` +
      `Select an action below or refine your query for more specific results.`;

    setAiResponse(aiText);
    setResults(generated.length > 0 ? generated : [{
      id: 'fallback', type: 'action', label: 'Ask AI Assistant',
      description: `Get AI help with: "${q}"`,
      icon: Sparkles, iconColor: 'text-violet-500',
      action: () => {
        window.dispatchEvent(new CustomEvent('crm:quick-action', { detail: { action: 'ai-chat' } }));
        onClose();
      },
    }]);
    setSelectedIdx(0);
    setProcessing(false);
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : QUICK_COMMANDS;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        results[selectedIdx]?.action();
      } else if (query.trim()) {
        processQuery(query);
      } else {
        QUICK_COMMANDS[selectedIdx]?.action();
      }
    }
  };

  if (!open) return null;

  const displayItems = results.length > 0 ? results : (query ? [] : QUICK_COMMANDS);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-surface-primary border border-th-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Input area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-th-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResults([]); setAiResponse(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... &quot;Show leads from Florida not contacted in 7 days&quot;"
            className="flex-1 text-sm bg-transparent text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none"
          />
          {processing && <Loader2 className="w-4 h-4 text-th-accent-500 animate-spin shrink-0" />}
          {query && !processing && (
            <button onClick={() => processQuery(query)} className="p-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 hover:bg-th-accent-500/20 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="px-5 py-3 border-b border-th-border bg-gradient-to-r from-violet-500/5 to-blue-500/5">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-th-text-secondary leading-relaxed">{aiResponse}</p>
            </div>
          </div>
        )}

        {/* Results / Quick Commands */}
        <div className="max-h-[360px] overflow-y-auto">
          {!query && !results.length && (
            <div className="px-5 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">Quick Commands</p>
            </div>
          )}

          {displayItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setSelectedIdx(idx)}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors',
                idx === selectedIdx ? 'bg-th-accent-500/8' : 'hover:bg-surface-secondary/50'
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.iconColor, 'bg-current/10')}>
                <item.icon className={cn('w-4 h-4', item.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary">{item.label}</p>
                <p className="text-xs text-th-text-tertiary truncate">{item.description}</p>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0',
                item.type === 'navigate' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' :
                item.type === 'action' ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10' :
                item.type === 'query' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' :
                'text-amber-600 dark:text-amber-400 bg-amber-500/10'
              )}>
                {item.type}
              </span>
            </button>
          ))}

          {query && !processing && results.length === 0 && (
            <div className="px-5 py-6 text-center">
              <Command className="w-6 h-6 text-th-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-th-text-secondary">Press <kbd className="px-1.5 py-0.5 rounded bg-surface-tertiary text-xs font-mono">Enter</kbd> to ask AI</p>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-th-border bg-surface-secondary/30">
          <div className="flex items-center gap-3 text-[10px] text-th-text-tertiary">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-violet-500">
            <Zap className="w-3 h-3" />
            <span>AI-powered</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
