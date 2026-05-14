/**
 * AI Command Bar - Natural language CRM interface
 *
 * Zoho-killer feature: Users type natural language and the AI interprets intent,
 * surfaces smart suggestions, and can execute multi-step CRM actions.
 *
 * Triggered via Cmd+J (separate from Cmd+K command palette).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Users,
  Mail,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Zap,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';

type AIAction =
  | 'navigate'
  | 'create_lead'
  | 'search'
  | 'summarize'
  | 'draft_email'
  | 'schedule_task'
  | 'pipeline_status'
  | 'unknown';

interface AIInterpretation {
  action: AIAction;
  confidence: number;
  displayText: string;
  icon: React.ComponentType<{ className?: string }>;
  execute: () => Promise<void> | void;
  preview?: string;
}

interface QuickSuggestion {
  label: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { label: 'Show my pipeline', query: 'Show my deal pipeline summary', icon: TrendingUp },
  { label: 'Leads needing follow-up', query: 'Which leads need follow-up today?', icon: AlertTriangle },
  { label: 'Revenue forecast', query: 'What is our revenue forecast this quarter?', icon: BarChart3 },
  { label: 'Draft follow-up email', query: 'Draft a follow-up email for my hottest lead', icon: Mail },
  { label: 'Today\'s priorities', query: 'What should I focus on today?', icon: Zap },
  { label: 'Create new lead', query: 'Create a new lead', icon: UserPlus },
];

export function AICommandBar() {
  const navigate = useNavigate();
  const {
    leadService,
    dealService,
    taskService,
    insightsService,
    pipelineStages,
    dashboardStats,
    recentLeads,
    tasksDueToday,
    overdueTasks,
  } = useCRM();
  const { activeOrgId } = useOrg();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [interpretations, setInterpretations] = useState<AIInterpretation[]>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cmd+J to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      lockBodyScroll();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      unlockBodyScroll();
    }
    return () => unlockBodyScroll();
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setInterpretations([]);
    setResponse(null);
    setSelectedIndex(0);
  }, []);

  /**
   * Interpret natural language input and produce actionable suggestions.
   * This runs client-side for instant responsiveness. For complex queries,
   * it can optionally call the AI edge function.
   */
  const interpretQuery = useCallback(
    (input: string): AIInterpretation[] => {
      const lower = input.toLowerCase().trim();
      if (!lower) return [];

      const results: AIInterpretation[] = [];

      // Navigation intents
      const navMap: Record<string, { path: string; label: string }> = {
        dashboard: { path: '/', label: 'Go to Dashboard' },
        leads: { path: '/leads', label: 'Go to Leads' },
        pipeline: { path: '/pipeline', label: 'Go to Pipeline' },
        deals: { path: '/deals', label: 'Go to Deals' },
        contacts: { path: '/members', label: 'Go to Members' },
        members: { path: '/members', label: 'Go to Members' },
        accounts: { path: '/accounts', label: 'Go to Accounts' },
        tasks: { path: '/tasks', label: 'Go to Tasks' },
        calendar: { path: '/calendar', label: 'Go to Calendar' },
        reports: { path: '/reports', label: 'Go to Reports' },
        settings: { path: '/settings', label: 'Go to Settings' },
        inbox: { path: '/email/inbox', label: 'Go to Inbox' },
        forecasting: { path: '/forecasting', label: 'Go to Forecasting' },
      };

      for (const [keyword, { path, label }] of Object.entries(navMap)) {
        if (lower.includes(keyword) && (lower.includes('go to') || lower.includes('show') || lower.includes('open') || lower === keyword)) {
          results.push({
            action: 'navigate',
            confidence: 0.9,
            displayText: label,
            icon: TrendingUp,
            execute: () => {
              navigate(path);
              handleClose();
            },
          });
        }
      }

      // Pipeline / deal summary
      if (lower.includes('pipeline') || lower.includes('deal') && (lower.includes('summary') || lower.includes('status'))) {
        const totalDeals = dashboardStats?.total_leads || 0;
        results.push({
          action: 'pipeline_status',
          confidence: 0.85,
          displayText: 'Pipeline Summary',
          icon: TrendingUp,
          preview: `${totalDeals} active leads across ${pipelineStages.length} stages`,
          execute: () => {
            navigate('/deal-pipeline');
            handleClose();
          },
        });
      }

      // Follow-up intent
      if (lower.includes('follow') || lower.includes('overdue') || lower.includes('need attention')) {
        const overdueCount = overdueTasks.length;
        const todayCount = tasksDueToday.length;
        results.push({
          action: 'summarize',
          confidence: 0.88,
          displayText: 'Follow-up Summary',
          icon: AlertTriangle,
          preview: `${overdueCount} overdue tasks, ${todayCount} due today`,
          execute: () => {
            setResponse(
              `You have **${overdueCount} overdue tasks** and **${todayCount} tasks due today**.\n\n` +
              (overdueCount > 0
                ? `Priority: Address overdue items first to maintain lead engagement.`
                : `Great job! No overdue tasks. Focus on today's ${todayCount} items.`)
            );
          },
        });
      }

      // Revenue / forecast
      if (lower.includes('revenue') || lower.includes('forecast') || lower.includes('quarter')) {
        results.push({
          action: 'navigate',
          confidence: 0.82,
          displayText: 'View Revenue Forecast',
          icon: BarChart3,
          preview: 'Open the forecasting dashboard for detailed projections',
          execute: () => {
            navigate('/forecasting');
            handleClose();
          },
        });
      }

      // Create lead
      if (lower.includes('create') && (lower.includes('lead') || lower.includes('contact'))) {
        results.push({
          action: 'create_lead',
          confidence: 0.92,
          displayText: 'Create New Lead',
          icon: UserPlus,
          execute: () => {
            navigate('/leads');
            handleClose();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('crm:open-add-lead'));
            }, 300);
          },
        });
      }

      // Email draft
      if (lower.includes('email') || lower.includes('draft') || lower.includes('write')) {
        const hotLead = recentLeads.find(l => l.priority === 'urgent' || l.priority === 'high') || recentLeads[0];
        if (hotLead) {
          results.push({
            action: 'draft_email',
            confidence: 0.8,
            displayText: `Draft email for ${hotLead.first_name} ${hotLead.last_name}`,
            icon: Mail,
            preview: `Generate an AI-powered follow-up email`,
            execute: () => {
              navigate(`/leads/${hotLead.id}`);
              handleClose();
            },
          });
        }
      }

      // Today / priorities
      if (lower.includes('today') || lower.includes('priorities') || lower.includes('focus')) {
        const newLeads = dashboardStats?.new_leads || 0;
        results.push({
          action: 'summarize',
          confidence: 0.9,
          displayText: 'Today\'s Priorities',
          icon: Zap,
          preview: `${tasksDueToday.length} tasks, ${newLeads} new leads, ${overdueTasks.length} overdue items`,
          execute: () => {
            const priorities: string[] = [];
            if (overdueTasks.length > 0) priorities.push(`Address **${overdueTasks.length} overdue tasks** immediately`);
            if (tasksDueToday.length > 0) priorities.push(`Complete **${tasksDueToday.length} tasks** due today`);
            if (newLeads > 0) priorities.push(`Review **${newLeads} new leads** for qualification`);
            if (priorities.length === 0) priorities.push('All caught up! Consider prospecting or pipeline review.');

            setResponse(
              `**Today's Focus Areas:**\n\n${priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
            );
          },
        });
      }

      // Search fallback
      if (results.length === 0 && lower.length > 2) {
        results.push({
          action: 'search',
          confidence: 0.6,
          displayText: `Search for "${input}"`,
          icon: Users,
          execute: async () => {
            setProcessing(true);
            try {
              const { leads } = await leadService.getLeads({ search: input }, 5, 0);
              if (leads.length > 0) {
                setResponse(
                  `Found **${leads.length} leads** matching "${input}":\n\n` +
                  leads.map(l => `- **${l.first_name} ${l.last_name}** (${l.pipeline_stage})`).join('\n')
                );
              } else {
                setResponse(`No results found for "${input}". Try different keywords.`);
              }
            } catch {
              setResponse('Search failed. Please try again.');
            }
            setProcessing(false);
          },
        });
      }

      return results.sort((a, b) => b.confidence - a.confidence);
    },
    [navigate, handleClose, dashboardStats, pipelineStages, overdueTasks, tasksDueToday, recentLeads, leadService]
  );

  useEffect(() => {
    if (query.length > 1) {
      const results = interpretQuery(query);
      setInterpretations(results);
      setSelectedIndex(0);
      setResponse(null);
    } else {
      setInterpretations([]);
      setResponse(null);
    }
  }, [query, interpretQuery]);

  const handleSubmit = async () => {
    if (interpretations.length > 0) {
      const selected = interpretations[selectedIndex];
      if (selected) {
        setProcessing(true);
        await selected.execute();
        setProcessing(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, interpretations.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Command Bar */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl mx-4 bg-surface-primary rounded-2xl shadow-2xl border border-th-border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* AI Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-th-border bg-gradient-to-r from-violet-500/5 to-blue-500/5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-th-text-primary">AI Command Bar</span>
          <span className="text-xs text-th-text-tertiary ml-auto">
            Ask anything about your CRM
          </span>
          <button onClick={handleClose} className="p-1 hover:bg-surface-tertiary rounded-lg">
            <X className="w-4 h-4 text-th-text-tertiary" />
          </button>
        </div>

        {/* Input */}
        <div className="flex items-center px-5 py-4 gap-3">
          {processing ? (
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-violet-500 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... e.g., 'What should I focus on today?'"
            className="flex-1 bg-transparent text-th-text-primary placeholder-th-text-tertiary text-sm outline-none"
          />
          {query && (
            <button
              onClick={handleSubmit}
              disabled={processing || interpretations.length === 0}
              className="p-2 bg-gradient-to-r from-violet-500 to-blue-500 rounded-lg text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestions (when empty) */}
        {!query && !response && (
          <div className="px-5 pb-4 space-y-2">
            <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={suggestion.label}
                    onClick={() => setQuery(suggestion.query)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-th-border hover:bg-surface-secondary hover:border-violet-200 transition-all text-left group"
                  >
                    <SuggestionIcon className="w-4 h-4 text-th-text-tertiary group-hover:text-violet-500 transition-colors flex-shrink-0" />
                    <span className="text-sm text-th-text-secondary group-hover:text-th-text-primary transition-colors">
                      {suggestion.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Interpretations */}
        {interpretations.length > 0 && !response && (
          <div className="border-t border-th-border max-h-72 overflow-y-auto">
            {interpretations.map((interp, i) => {
              const InterpIcon = interp.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedIndex(i);
                    interp.execute();
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                    i === selectedIndex
                      ? 'bg-violet-50 dark:bg-violet-500/10'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${
                    i === selectedIndex
                      ? 'bg-violet-100 dark:bg-violet-500/20'
                      : 'bg-surface-tertiary'
                  }`}>
                    <InterpIcon className={`w-4 h-4 ${
                      i === selectedIndex ? 'text-violet-600' : 'text-th-text-tertiary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      i === selectedIndex ? 'text-violet-700 dark:text-violet-300' : 'text-th-text-primary'
                    }`}>
                      {interp.displayText}
                    </p>
                    {interp.preview && (
                      <p className="text-xs text-th-text-tertiary mt-0.5 truncate">
                        {interp.preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-th-text-tertiary">
                      {Math.round(interp.confidence * 100)}%
                    </span>
                    {i === selectedIndex && (
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-600 font-mono">
                        Enter
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* AI Response */}
        {response && (
          <div className="border-t border-th-border px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 text-sm text-th-text-secondary leading-relaxed">
                {response.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold text-th-text-primary mb-1">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ') || line.match(/^\d+\./)) {
                    const formatted = line.replace(/\*\*(.*?)\*\*/g, '$1');
                    return (
                      <p key={i} className="ml-2 mb-0.5">
                        {line.startsWith('- ') ? '\u2022 ' : ''}{formatted.replace(/^- /, '').replace(/^\d+\.\s*/, `${line.match(/^\d+/)?.[0]}. `)}
                      </p>
                    );
                  }
                  return line ? <p key={i} className="mb-1">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p> : <br key={i} />;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-th-border bg-surface-secondary/50 text-[10px] text-th-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">↵</kbd> Execute
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface-tertiary font-mono">esc</kbd> Close
            </span>
          </div>
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}

export default AICommandBar;
