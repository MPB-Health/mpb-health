import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardCopy,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AICoachProps {
  leadId?: string;
  dealId?: string;
  mode?: 'sidebar' | 'panel' | 'inline';
}

interface LeadInsight {
  id: string;
  recommended_action: string;
  recommended_channel: 'email' | 'phone' | 'sms' | 'meeting';
  score_factors: ScoreFactor[];
  summary: string;
  generated_at: string;
}

interface ScoreFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

interface DraftResult {
  subject?: string;
  body: string;
  draft_type: 'email' | 'sms';
}

interface ConversationSummary {
  summary: string;
  key_points: string[];
  objections: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  next_steps: string[];
}

interface SendTimeSlot {
  day: number;
  hour: number;
  score: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_DISPLAY = [
  '6a', '7a', '8a', '9a', '10a', '11a', '12p',
  '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p',
];
const HOUR_OFFSET = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function channelIcon(channel: string) {
  switch (channel) {
    case 'email': return Mail;
    case 'phone': return Phone;
    case 'sms': return MessageSquare;
    case 'meeting': return Target;
    default: return Zap;
  }
}

function sentimentBadge(s: string): { label: string; cls: string } {
  switch (s) {
    case 'positive':
      return { label: 'Positive', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'negative':
      return { label: 'Negative', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return { label: 'Neutral', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
}

function computeSendTimeGrid(timezone: string | null): SendTimeSlot[] {
  const slots: SendTimeSlot[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hourIdx = 0; hourIdx < HOURS_DISPLAY.length; hourIdx++) {
      const hour = hourIdx + HOUR_OFFSET;
      let score = 20;

      const isWeekday = day < 5;
      const isBusinessHour = hour >= 9 && hour <= 17;
      const isPrimeTime = (hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 15);

      if (isWeekday) score += 25;
      if (isBusinessHour) score += 25;
      if (isPrimeTime && isWeekday) score += 20;

      if (day < 4) score += 5;
      if (day === 4) score += 0;
      if (day >= 5) score -= 15;

      if (hour < 8 || hour > 19) score -= 20;

      score = Math.max(0, Math.min(100, score));
      slots.push({ day, hour: hourIdx, score });
    }
  }

  return slots;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Failed to copy'),
  );
}

// ---------------------------------------------------------------------------
// Shimmer / Skeleton
// ---------------------------------------------------------------------------

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-tertiary rounded', className)} />;
}

function ShimmerLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBlock key={i} className={cn('h-3', i === count - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Contextual Insights Panel
// ---------------------------------------------------------------------------

function InsightsPanel({ leadId, compact }: { leadId: string; compact: boolean }) {
  const { activeOrgId } = useOrg();
  const [insight, setInsight] = useState<LeadInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (silent = false) => {
    if (!leadId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: existing, error: existingErr } = await supabase
        .from('ai_lead_insights')
        .select('*')
        .eq('lead_id', leadId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingErr && existing) {
        setInsight({
          id: existing.id,
          recommended_action: existing.recommended_action ?? 'Follow up with lead',
          recommended_channel: existing.recommended_channel ?? 'email',
          score_factors: (existing.score_factors as ScoreFactor[]) ?? [],
          summary: existing.summary ?? '',
          generated_at: existing.generated_at ?? new Date().toISOString(),
        });
      } else {
        const { data: aiData, error: aiErr } = await supabase.functions.invoke(
          'ai-crm-agent',
          { body: { action: 'get_insights', lead_id: leadId, org_id: activeOrgId } },
        );

        if (aiErr) throw aiErr;
        if (aiData) {
          setInsight({
            id: aiData.id ?? `gen-${Date.now()}`,
            recommended_action: aiData.recommended_action ?? 'Follow up with lead',
            recommended_channel: aiData.recommended_channel ?? 'email',
            score_factors: aiData.score_factors ?? [],
            summary: aiData.summary ?? '',
            generated_at: aiData.generated_at ?? new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('[AICoach:Insights] fetch failed:', err);
      if (!silent) toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadId, activeOrgId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <ShimmerBlock className="h-5 w-40" />
        <ShimmerLines count={4} />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="p-4 text-center text-th-text-secondary">
        <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No insights available yet</p>
      </div>
    );
  }

  const ChannelIcon = channelIcon(insight.recommended_channel);

  return (
    <div className="space-y-3">
      {/* Recommended action */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800/40">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-800/40 flex-shrink-0">
            <ChannelIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              {insight.recommended_action}
            </p>
            <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
              via {insight.recommended_channel}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {insight.summary && !compact && (
        <p className="text-sm text-th-text-secondary leading-relaxed">{insight.summary}</p>
      )}

      {/* Score factors */}
      {!compact && insight.score_factors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Score Factors</p>
          {insight.score_factors.map((f, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  f.impact === 'positive' ? 'bg-green-500' : f.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400',
                )}
              />
              <span className="text-xs text-th-text-secondary flex-1">{f.factor}</span>
              <span
                className={cn(
                  'text-[10px] font-medium tabular-nums',
                  f.impact === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : f.impact === 'negative'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-th-text-tertiary',
                )}
              >
                {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '-' : '~'}{Math.round(f.weight * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={() => fetchInsights(true)}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
        Refresh Insights
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Smart Draft Generator
// ---------------------------------------------------------------------------

function DraftGenerator({ leadId, compact }: { leadId: string; compact: boolean }) {
  const { activeOrgId } = useOrg();
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [draftType, setDraftType] = useState<'email' | 'sms' | null>(null);

  const generateDraft = async (type: 'email' | 'sms') => {
    setDraftType(type);
    setGenerating(true);
    setDraft(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-crm-agent', {
        body: { action: 'generate_draft', lead_id: leadId, draft_type: type, org_id: activeOrgId },
      });

      if (error) throw error;

      setDraft({
        subject: data?.subject,
        body: data?.body ?? data?.message ?? 'Draft could not be generated.',
        draft_type: type,
      });
    } catch (err) {
      console.error('[AICoach:Draft] generation failed:', err);
      toast.error('Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => generateDraft('email')}
          disabled={generating}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
            draftType === 'email' && generating
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
              : 'bg-surface-tertiary text-th-text-secondary hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400',
            generating && draftType !== 'email' && 'opacity-50',
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          {generating && draftType === 'email' ? 'Drafting...' : 'Draft Email'}
        </button>
        <button
          onClick={() => generateDraft('sms')}
          disabled={generating}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
            draftType === 'sms' && generating
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
              : 'bg-surface-tertiary text-th-text-secondary hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400',
            generating && draftType !== 'sms' && 'opacity-50',
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {generating && draftType === 'sms' ? 'Drafting...' : 'Draft SMS'}
        </button>
      </div>

      {/* Generating shimmer */}
      {generating && (
        <div className="p-4 rounded-lg border border-violet-200 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-900/10 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
            <span className="text-xs text-violet-600 dark:text-violet-400">Generating with AI...</span>
          </div>
          <ShimmerLines count={compact ? 2 : 4} />
        </div>
      )}

      {/* Draft preview */}
      {draft && !generating && (
        <div className="p-4 rounded-lg border border-th-border bg-surface-secondary space-y-3">
          {draft.subject && (
            <div>
              <p className="text-[10px] font-medium text-th-text-tertiary uppercase tracking-wider mb-0.5">Subject</p>
              <p className="text-sm font-medium text-th-text-primary">{draft.subject}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-medium text-th-text-tertiary uppercase tracking-wider mb-0.5">
              {draft.draft_type === 'sms' ? 'Message' : 'Body'}
            </p>
            <p className="text-sm text-th-text-secondary whitespace-pre-wrap leading-relaxed">
              {draft.body}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-tertiary hover:bg-surface-primary text-th-text-secondary transition-colors"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copy
            </button>
            {draft.draft_type === 'email' && (
              <Link
                to={`/leads/${leadId}?action=email&prefill=true`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Open in Composer
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Send-Time Optimizer
// ---------------------------------------------------------------------------

function SendTimeOptimizer({ leadId }: { leadId: string }) {
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimezone() {
      try {
        const { data } = await supabase
          .from('lead_submissions')
          .select('timezone')
          .eq('id', leadId)
          .maybeSingle();
        setTimezone(data?.timezone ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchTimezone();
  }, [leadId]);

  const grid = useMemo(() => computeSendTimeGrid(timezone), [timezone]);

  const topSlots = useMemo(
    () => [...grid].sort((a, b) => b.score - a.score).slice(0, 3),
    [grid],
  );

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        <ShimmerBlock className="h-32 w-full" />
      </div>
    );
  }

  if (!timezone) {
    return (
      <div className="p-4 rounded-lg bg-surface-secondary text-center">
        <Clock className="h-6 w-6 mx-auto mb-2 text-th-text-tertiary" />
        <p className="text-sm text-th-text-secondary">Set lead timezone for personalized recommendations</p>
        <Link
          to={`/leads/${leadId}?tab=details`}
          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          Edit Lead Details
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const maxScore = Math.max(...grid.map((s) => s.score), 1);
  const topSet = new Set(topSlots.map((s) => `${s.day}-${s.hour}`));

  return (
    <div className="space-y-3">
      <p className="text-xs text-th-text-tertiary">
        Timezone: <span className="font-medium text-th-text-secondary">{timezone}</span>
      </p>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-10 flex-shrink-0" />
            {HOURS_DISPLAY.map((h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-th-text-tertiary pb-1">
                {h}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center">
              <div className="w-10 flex-shrink-0 text-[10px] font-medium text-th-text-secondary pr-2 text-right">
                {day}
              </div>
              {HOURS_DISPLAY.map((_, hourIdx) => {
                const slot = grid.find((s) => s.day === dayIdx && s.hour === hourIdx);
                const score = slot?.score ?? 0;
                const opacity = Math.max(0.08, score / maxScore);
                const isTop = topSet.has(`${dayIdx}-${hourIdx}`);

                return (
                  <div
                    key={hourIdx}
                    className={cn(
                      'flex-1 aspect-square m-[1px] rounded-sm transition-all',
                      isTop && 'ring-2 ring-green-500 ring-offset-1 dark:ring-offset-gray-900',
                    )}
                    style={{
                      backgroundColor: isTop
                        ? `rgba(16, 185, 129, ${opacity})`
                        : `rgba(139, 92, 246, ${opacity})`,
                    }}
                    title={`${day} ${HOURS_DISPLAY[hourIdx]} — Score: ${score}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Top time slots */}
      <div>
        <p className="text-[10px] font-medium text-th-text-tertiary uppercase tracking-wider mb-1.5">
          Best Send Times
        </p>
        <div className="flex gap-2">
          {topSlots.map((slot, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                {DAYS[slot.day]} {HOURS_DISPLAY[slot.hour]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Conversation Summary
// ---------------------------------------------------------------------------

function ConversationSummarizer({ leadId, compact }: { leadId: string; compact: boolean }) {
  const { activeOrgId } = useOrg();
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    setLoading(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-crm-agent', {
        body: { action: 'summarize_conversation', lead_id: leadId, org_id: activeOrgId },
      });

      if (error) throw error;

      setSummary({
        summary: data?.summary ?? 'No conversation data found.',
        key_points: data?.key_points ?? [],
        objections: data?.objections ?? [],
        interests: data?.interests ?? [],
        sentiment: data?.sentiment ?? 'neutral',
        next_steps: data?.next_steps ?? [],
      });
    } catch (err) {
      console.error('[AICoach:Summary] generation failed:', err);
      toast.error('Failed to summarize conversation');
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading) {
    return (
      <button
        onClick={summarize}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-tertiary hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm font-medium text-th-text-secondary hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Summarize Conversation
      </button>
    );
  }

  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-violet-200 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-900/10 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
          <span className="text-xs text-violet-600 dark:text-violet-400">Analyzing conversation...</span>
        </div>
        <ShimmerLines count={compact ? 3 : 6} />
      </div>
    );
  }

  if (!summary) return null;

  const sent = sentimentBadge(summary.sentiment);

  return (
    <div className="space-y-3">
      {/* Sentiment + summary */}
      <div className="flex items-start gap-2">
        <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0', sent.cls)}>
          {sent.label}
        </span>
        <p className="text-sm text-th-text-secondary leading-relaxed">{summary.summary}</p>
      </div>

      {!compact && (
        <>
          {/* Key points */}
          {summary.key_points.length > 0 && (
            <SummaryList
              title="Key Points"
              items={summary.key_points}
              icon={<TrendingUp className="h-3 w-3 text-blue-500" />}
              dotColor="bg-blue-500"
            />
          )}

          {/* Objections */}
          {summary.objections.length > 0 && (
            <SummaryList
              title="Objections"
              items={summary.objections}
              icon={<ThumbsDown className="h-3 w-3 text-red-500" />}
              dotColor="bg-red-500"
            />
          )}

          {/* Interests */}
          {summary.interests.length > 0 && (
            <SummaryList
              title="Interests"
              items={summary.interests}
              icon={<ThumbsUp className="h-3 w-3 text-green-500" />}
              dotColor="bg-green-500"
            />
          )}

          {/* Next steps */}
          {summary.next_steps.length > 0 && (
            <SummaryList
              title="Next Steps"
              items={summary.next_steps}
              icon={<ArrowRight className="h-3 w-3 text-violet-500" />}
              dotColor="bg-violet-500"
            />
          )}
        </>
      )}

      {/* Re-summarize */}
      <button
        onClick={summarize}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Re-analyze
      </button>
    </div>
  );
}

function SummaryList({
  title,
  items,
  icon,
  dotColor,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  dotColor: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-[10px] font-medium text-th-text-tertiary uppercase tracking-wider">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-th-text-secondary">
            <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion Section Wrapper
// ---------------------------------------------------------------------------

function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-th-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-th-text-primary">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-th-text-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-th-text-tertiary" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AICoach — Main Component
// ---------------------------------------------------------------------------

export function AICoach({ leadId, dealId, mode = 'panel' }: AICoachProps) {
  const targetId = leadId || dealId;

  if (!targetId) {
    return (
      <div className="rounded-xl border border-th-border bg-surface-primary p-6 text-center">
        <Sparkles className="h-8 w-8 mx-auto mb-3 text-violet-400 opacity-50" />
        <p className="text-sm font-medium text-th-text-primary">AI Sales Coach</p>
        <p className="text-xs text-th-text-tertiary mt-1">Select a lead or deal to get started</p>
      </div>
    );
  }

  const effectiveLeadId = leadId || dealId!;

  // ==== Inline mode ====
  if (mode === 'inline') {
    return (
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-800/40">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">AI Coach</span>
        </div>
        <InsightsPanel leadId={effectiveLeadId} compact />
        <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-800/40">
          <DraftGenerator leadId={effectiveLeadId} compact />
        </div>
      </div>
    );
  }

  const isSidebar = mode === 'sidebar';

  // ==== Panel / Sidebar mode ====
  return (
    <div
      className={cn(
        'rounded-xl border border-th-border bg-surface-primary overflow-hidden',
        isSidebar ? 'w-full max-w-xs' : 'w-full',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="p-1.5 rounded-lg bg-white/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Sales Coach</p>
          <p className="text-[10px] text-white/70">Powered by intelligence</p>
        </div>
      </div>

      {/* Sections */}
      <div>
        <AccordionSection
          title="Insights"
          icon={<Target className="h-4 w-4 text-violet-500" />}
          defaultOpen
        >
          <InsightsPanel leadId={effectiveLeadId} compact={isSidebar} />
        </AccordionSection>

        <AccordionSection
          title="Smart Drafts"
          icon={<Mail className="h-4 w-4 text-violet-500" />}
          defaultOpen={!isSidebar}
        >
          <DraftGenerator leadId={effectiveLeadId} compact={isSidebar} />
        </AccordionSection>

        <AccordionSection
          title="Best Send Times"
          icon={<Clock className="h-4 w-4 text-violet-500" />}
          defaultOpen={false}
        >
          <SendTimeOptimizer leadId={effectiveLeadId} />
        </AccordionSection>

        <AccordionSection
          title="Conversation Summary"
          icon={<MessageSquare className="h-4 w-4 text-violet-500" />}
          defaultOpen={false}
        >
          <ConversationSummarizer leadId={effectiveLeadId} compact={isSidebar} />
        </AccordionSection>
      </div>
    </div>
  );
}

export default AICoach;
