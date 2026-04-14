import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Megaphone, Users, Mail, Phone, MessageSquare, Sparkles,
  Target, ChevronRight, Check, Loader2, Filter, Clock,
  Zap, Send, Calendar,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Segment {
  id: string;
  label: string;
  description: string;
  leadCount: number;
  suggestedApproach: string;
  channels: ('email' | 'phone' | 'sms')[];
}

interface WinBackCampaignModalProps {
  open: boolean;
  onClose: () => void;
  totalStaleLeads?: number;
  onLaunch?: (segmentId: string, channels: string[], scheduledDate?: string) => Promise<void>;
}

const SEGMENTS: Segment[] = [
  { id: 'ghost', label: 'Ghosted Leads', description: 'Never responded after initial contact', leadCount: 84,
    suggestedApproach: 'Fresh intro — they may not remember you. Lead with value, not sales.', channels: ['email', 'sms'] },
  { id: 'stalled', label: 'Stalled in Pipeline', description: 'Engaged but went cold mid-conversation', leadCount: 52,
    suggestedApproach: 'Reference the last conversation. Create urgency with enrollment deadlines.', channels: ['phone', 'email'] },
  { id: 'competitor', label: 'Lost to Competitor', description: 'Explicitly chose another carrier/agent', leadCount: 28,
    suggestedApproach: 'Lead with rate comparison. Show what changed since they left.', channels: ['email', 'phone'] },
  { id: 'timing', label: 'Bad Timing', description: 'Said "not now" or "call me later"', leadCount: 45,
    suggestedApproach: 'Respectful check-in. Position as "the time might be right now."', channels: ['email'] },
  { id: 'aging-in', label: 'Aging Into Medicare', description: 'Previously too young, now turning 65', leadCount: 19,
    suggestedApproach: 'Life event trigger — high intent. Educate on Medicare options.', channels: ['phone', 'email', 'sms'] },
  { id: 'renewal', label: 'Renewal Window', description: 'Had coverage that\'s expiring or renewing', leadCount: 31,
    suggestedApproach: 'Proactive outreach — offer a free plan comparison before renewal.', channels: ['phone', 'email'] },
];

const CHANNEL_CONFIG = {
  email: { icon: Mail, color: 'text-cyan-500', label: 'Email' },
  phone: { icon: Phone, color: 'text-green-500', label: 'Phone' },
  sms: { icon: MessageSquare, color: 'text-violet-500', label: 'SMS' },
};

export function WinBackCampaignModal({ open, onClose, totalStaleLeads = 259, onLaunch }: WinBackCampaignModalProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [scheduleDate, setScheduleDate] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const segment = SEGMENTS.find((s) => s.id === selectedSegment);

  const selectSegment = (id: string) => {
    setSelectedSegment(id);
    const seg = SEGMENTS.find((s) => s.id === id);
    if (seg) setSelectedChannels(new Set(seg.channels));
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  const handleLaunch = async () => {
    if (!selectedSegment) return;
    setLaunching(true);
    try {
      await onLaunch?.(selectedSegment, Array.from(selectedChannels), scheduleDate || undefined);
      setLaunched(true);
    } catch { /* parent */ }
    finally { setLaunching(false); }
  };

  if (launched) {
    return (
      <Modal open={open} onClose={onClose} title="Win-Back Campaign" size="xl">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-th-text-primary">Campaign Launched!</h3>
          <p className="text-sm text-th-text-secondary mt-2">Targeting {segment?.leadCount} leads in "{segment?.label}" segment.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Win-Back Campaign Builder" size="2xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            <strong>{totalStaleLeads}</strong> stale leads segmented into <strong>{SEGMENTS.length}</strong> win-back categories. Select a segment to launch a targeted campaign.
          </p>
        </div>

        {/* Segment selection */}
        <div className="grid grid-cols-2 gap-2">
          {SEGMENTS.map((seg) => (
            <button key={seg.id} onClick={() => selectSegment(seg.id)} className={cn(
              'p-3 rounded-xl border text-left transition-all',
              selectedSegment === seg.id ? 'border-th-accent-500/50 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-accent-500/30'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-th-text-primary">{seg.label}</span>
                <span className="ml-auto text-xs font-bold text-th-accent-500 tabular-nums">{seg.leadCount}</span>
              </div>
              <p className="text-[10px] text-th-text-tertiary">{seg.description}</p>
              <div className="flex gap-1 mt-1.5">
                {seg.channels.map((ch) => {
                  const cfg = CHANNEL_CONFIG[ch];
                  return <cfg.icon key={ch} className={cn('w-3 h-3', cfg.color)} />;
                })}
              </div>
            </button>
          ))}
        </div>

        {/* Campaign config */}
        {segment && (
          <div className="space-y-3 p-4 rounded-xl border border-th-accent-500/30 bg-th-accent-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-th-accent-500" />
              <span className="text-xs font-semibold text-th-accent-500">AI-Suggested Approach</span>
            </div>
            <p className="text-xs text-th-text-secondary">{segment.suggestedApproach}</p>

            <div>
              <p className="text-xs font-semibold text-th-text-secondary mb-1.5">Channels</p>
              <div className="flex gap-2">
                {(['email', 'phone', 'sms'] as const).map((ch) => {
                  const cfg = CHANNEL_CONFIG[ch];
                  return (
                    <button key={ch} onClick={() => toggleChannel(ch)} className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                      selectedChannels.has(ch) ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-tertiary'
                    )}>
                      <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-th-text-secondary flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Schedule:
              </label>
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
              <span className="text-[10px] text-th-text-tertiary">{scheduleDate ? '' : 'Leave blank to launch immediately'}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <div className="flex-1" />
          <button onClick={handleLaunch} disabled={!selectedSegment || selectedChannels.size === 0 || launching}
            className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            {launching ? 'Launching...' : `Launch Campaign (${segment?.leadCount || 0} leads)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
