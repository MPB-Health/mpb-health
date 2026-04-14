import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import {
  Phone, Mic, MicOff, PhoneOff, Clock, Sparkles, AlertTriangle,
  MessageSquare, CheckCircle2, User, Shield, Lightbulb, Volume2,
  FileText, Pause, Play, BarChart3, TrendingUp, Zap, BookOpen,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface CoachingSuggestion {
  id: string;
  type: 'tip' | 'warning' | 'compliance' | 'objection' | 'upsell';
  text: string;
  timestamp: number;
  dismissed?: boolean;
}

interface CallTopic {
  topic: string;
  duration: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CallCoachingPanelProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  leadId?: string;
  leadPlanType?: string;
  leadState?: string;
  onSaveCallNotes?: (notes: string, summary: string, actionItems: string[]) => Promise<void>;
}

const MOCK_SUGGESTIONS: CoachingSuggestion[] = [
  { id: '1', type: 'tip', text: 'Client mentioned "budget" — consider presenting $0 premium Medicare Advantage plans first.', timestamp: 45 },
  { id: '2', type: 'compliance', text: 'Reminder: Document Scope of Appointment (SOA) before discussing specific plans.', timestamp: 120 },
  { id: '3', type: 'objection', text: 'Client seems hesitant about switching. Try: "Many of our clients had the same concern, and here\'s what they found..."', timestamp: 180 },
  { id: '4', type: 'upsell', text: 'Based on their medications, a plan with Part D included would save them ~$40/mo vs standalone PDP.', timestamp: 240 },
  { id: '5', type: 'warning', text: 'You haven\'t mentioned the 90-day waiting period for specialist referrals on HMO plans.', timestamp: 300 },
];

const MOCK_TOPICS: CallTopic[] = [
  { topic: 'Introduction & rapport', duration: 60, sentiment: 'positive' },
  { topic: 'Current coverage review', duration: 90, sentiment: 'neutral' },
  { topic: 'Budget discussion', duration: 45, sentiment: 'negative' },
  { topic: 'Plan comparison', duration: 120, sentiment: 'positive' },
  { topic: 'Objection handling', duration: 60, sentiment: 'neutral' },
];

const SUGGESTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  tip: { icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Tip' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Alert' },
  compliance: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: 'Compliance' },
  objection: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', label: 'Objection' },
  upsell: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Opportunity' },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallCoachingPanel({
  open, onClose, leadName, leadId, leadPlanType, leadState, onSaveCallNotes,
}: CallCoachingPanelProps) {
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [notes, setNotes] = useState('');
  const [autoNotes, setAutoNotes] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState(72);
  const [tab, setTab] = useState<'coaching' | 'notes' | 'summary'>('coaching');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (callActive && !paused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive, paused]);

  useEffect(() => {
    if (!callActive) return;
    const nextSuggestion = MOCK_SUGGESTIONS.find((s) => s.timestamp <= elapsed && !suggestions.find((ss) => ss.id === s.id));
    if (nextSuggestion) {
      setSuggestions((prev) => [...prev, nextSuggestion]);
    }
  }, [elapsed, callActive, suggestions]);

  const startCall = () => {
    setCallActive(true);
    setElapsed(0);
    setSuggestions([]);
    setAutoNotes('');
    setActionItems([]);
    setSentiment(72);
  };

  const endCall = () => {
    setCallActive(false);
    setAutoNotes(
      `Call with ${leadName} — ${formatTime(elapsed)} duration\n\n` +
      `Topics discussed: Current coverage review, budget concerns, plan comparison.\n` +
      `Client expressed interest in $0 premium Medicare Advantage plans.\n` +
      `Key concern: Budget constraints, wants low out-of-pocket costs.\n` +
      `Next steps: Send plan comparison for top 3 options.`
    );
    setActionItems([
      'Send plan comparison email with top 3 MA plans',
      'Schedule follow-up call in 3 days',
      'Verify doctor network availability',
      'Complete SOA documentation',
    ]);
    setTab('summary');
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, dismissed: true } : s));
  };

  const handleSave = async () => {
    await onSaveCallNotes?.(notes || autoNotes, autoNotes, actionItems);
    onClose();
  };

  const activeSuggestions = suggestions.filter((s) => !s.dismissed);

  return (
    <Modal open={open} onClose={onClose} title={`Call Coaching — ${leadName}`} size="2xl">
      <div className="space-y-4">
        {/* Call controls */}
        <div className={cn(
          'flex items-center gap-4 p-4 rounded-xl border',
          callActive ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20' : 'bg-surface-secondary border-th-border/50'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
            callActive ? 'bg-green-500 animate-pulse' : 'bg-surface-tertiary'
          )}>
            <Phone className={cn('w-5 h-5', callActive ? 'text-white' : 'text-th-text-tertiary')} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-th-text-primary">
              {callActive ? `In call with ${leadName}` : `Ready to call ${leadName}`}
            </p>
            {callActive && (
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-th-text-secondary tabular-nums">
                  <Clock className="w-3 h-3" /> {formatTime(elapsed)}
                </span>
                <span className="flex items-center gap-1 text-xs text-th-text-tertiary">
                  <Volume2 className="w-3 h-3" /> Recording
                </span>
                {leadPlanType && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">{leadPlanType}</span>}
                {leadState && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{leadState}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {callActive && (
              <>
                <button onClick={() => setMuted(!muted)} className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-colors', muted ? 'bg-red-500/20 text-red-500' : 'bg-surface-tertiary text-th-text-secondary hover:text-th-text-primary')}>
                  {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => setPaused(!paused)} className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-tertiary text-th-text-secondary hover:text-th-text-primary transition-colors">
                  {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </>
            )}
            <button
              onClick={callActive ? endCall : startCall}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors',
                callActive ? 'bg-red-500 text-white hover:bg-red-600' : 'gradient-accent text-white'
              )}
            >
              {callActive ? <><PhoneOff className="w-4 h-4" /> End</> : <><Phone className="w-4 h-4" /> Start Call</>}
            </button>
          </div>
        </div>

        {/* Sentiment meter */}
        {callActive && (
          <div className="flex items-center gap-3 px-3">
            <span className="text-[10px] text-th-text-tertiary uppercase tracking-wider">Sentiment</span>
            <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-1000',
                sentiment >= 70 ? 'bg-green-500' : sentiment >= 40 ? 'bg-amber-500' : 'bg-red-500'
              )} style={{ width: `${sentiment}%` }} />
            </div>
            <span className={cn('text-xs font-bold tabular-nums', sentiment >= 70 ? 'text-green-500' : sentiment >= 40 ? 'text-amber-500' : 'text-red-500')}>
              {sentiment}%
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          {[
            { id: 'coaching' as const, label: 'Live Coaching', icon: Sparkles, count: activeSuggestions.length },
            { id: 'notes' as const, label: 'Notes', icon: FileText },
            { id: 'summary' as const, label: 'Summary', icon: BarChart3 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-th-accent-500/10 text-th-accent-500 text-[10px] tabular-nums">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[240px] max-h-[300px] overflow-y-auto">
          {tab === 'coaching' && (
            <div className="space-y-2">
              {!callActive && activeSuggestions.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-th-text-secondary">Start a call to receive real-time AI coaching</p>
                  <p className="text-xs text-th-text-tertiary mt-1">Suggestions will appear as you talk</p>
                </div>
              )}
              {activeSuggestions.map((s) => {
                const cfg = SUGGESTION_CONFIG[s.type];
                const Icon = cfg.icon;
                return (
                  <div key={s.id} className={cn('flex items-start gap-3 p-3 rounded-xl border animate-scale-in', cfg.bg)}>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                      <Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', cfg.color)}>{cfg.label}</span>
                        <span className="text-[10px] text-th-text-tertiary tabular-nums">{formatTime(s.timestamp)}</span>
                      </div>
                      <p className="text-xs text-th-text-secondary leading-relaxed">{s.text}</p>
                    </div>
                    <button onClick={() => dismissSuggestion(s.id)} className="p-1 text-th-text-tertiary hover:text-th-text-secondary shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {callActive && (
                <div className="mt-4 p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
                  <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">Quick Scripts</p>
                  <div className="space-y-1">
                    {[
                      'Opening: "I\'m calling to help you review your current coverage options..."',
                      'SOA: "Before we discuss specific plans, I need to document our scope of appointment..."',
                      'Close: "Based on everything we discussed, I\'d recommend we take a closer look at..."',
                    ].map((script, i) => (
                      <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-xs text-th-text-secondary hover:bg-surface-tertiary/50 hover:text-th-text-primary transition-colors">
                        <BookOpen className="w-3 h-3 inline mr-1.5 text-th-accent-500" />{script}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your call notes here... AI will also generate a summary when the call ends."
              className="w-full h-[240px] text-sm bg-transparent text-th-text-primary placeholder:text-th-text-tertiary resize-none focus:outline-none"
            />
          )}

          {tab === 'summary' && (
            <div className="space-y-4">
              {autoNotes ? (
                <>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Call Summary</span>
                    </div>
                    <p className="text-xs text-th-text-secondary whitespace-pre-line leading-relaxed">{autoNotes}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-th-text-secondary mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-th-accent-500" /> Action Items</p>
                    <div className="space-y-1.5">
                      {actionItems.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary/50 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40" />
                          <span className="text-xs text-th-text-primary">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-th-text-secondary mb-2">Topic Analysis</p>
                    <div className="space-y-1.5">
                      {MOCK_TOPICS.map((t) => (
                        <div key={t.topic} className="flex items-center gap-2">
                          <span className="text-xs text-th-text-secondary flex-1 min-w-0 truncate">{t.topic}</span>
                          <div className="w-20 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                            <div className={cn('h-full rounded-full',
                              t.sentiment === 'positive' ? 'bg-green-500' : t.sentiment === 'negative' ? 'bg-red-500' : 'bg-blue-500'
                            )} style={{ width: `${(t.duration / 120) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-th-text-tertiary tabular-nums w-8 text-right">{formatTime(t.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-th-text-secondary">Call summary will appear after the call ends</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            {callActive ? 'Minimize' : 'Close'}
          </button>
          {!callActive && autoNotes && (
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Save Notes & Actions
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
