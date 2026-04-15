import { useState } from 'react';
import { Modal } from '../Modal';
import { Tag, Plus, Trash2, Users, Sparkles, Save, Search } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Segment { id: string; name: string; count: number; color: string; rules: string[]; isAuto: boolean; }
interface ContactSegmentModalProps { open: boolean; onClose: () => void; }

const MOCK_SEGMENTS: Segment[] = [
  { id: '1', name: 'Medicare Eligible', count: 124, color: '#3b82f6', rules: ['Age >= 65', 'Plan = Medicare'], isAuto: true },
  { id: '2', name: 'HealthShare Members', count: 86, color: '#10b981', rules: ['Plan type = HealthShare'], isAuto: true },
  { id: '3', name: 'High Engagement', count: 52, color: '#8b5cf6', rules: ['Activity count > 5 (30d)', 'Email opened > 3'], isAuto: true },
  { id: '4', name: 'VIP Clients', count: 18, color: '#f59e0b', rules: ['Tag = VIP', 'Rating = hot'], isAuto: false },
  { id: '5', name: 'At Risk', count: 34, color: '#ef4444', rules: ['No activity in 60 days', 'DNC/DNE = false'], isAuto: true },
  { id: '6', name: 'New This Month', count: 42, color: '#06b6d4', rules: ['Created after ' + new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)], isAuto: true },
];

const MOCK_TAGS = [
  { name: 'VIP', count: 18, color: '#f59e0b' },
  { name: 'Medicare', count: 86, color: '#3b82f6' },
  { name: 'HealthShare', count: 52, color: '#10b981' },
  { name: 'Referral', count: 34, color: '#8b5cf6' },
  { name: 'Follow-up', count: 28, color: '#ef4444' },
  { name: 'Spanish-speaking', count: 22, color: '#06b6d4' },
  { name: 'Renewal-due', count: 16, color: '#f97316' },
  { name: 'Family-plan', count: 12, color: '#ec4899' },
];

export function ContactSegmentModal({ open, onClose }: ContactSegmentModalProps) {
  const [tab, setTab] = useState<'segments' | 'tags'>('segments');
  const [tagSearch, setTagSearch] = useState('');

  const filteredTags = tagSearch ? MOCK_TAGS.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase())) : MOCK_TAGS;
  const totalSegmented = MOCK_SEGMENTS.reduce((s, seg) => s + seg.count, 0);

  return (
    <Modal open={open} onClose={onClose} title="Contact Segments & Tags" size="xl">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'segments' as const, label: `Smart Segments (${MOCK_SEGMENTS.length})` }, { id: 'tags' as const, label: `Tags (${MOCK_TAGS.length})` }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'segments' && (
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {MOCK_SEGMENTS.map((seg) => (
              <div key={seg.id} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-th-text-primary">{seg.name}</span>
                      {seg.isAuto && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-medium">Auto</span>}
                      <span className="text-[10px] text-th-text-tertiary">{seg.count} contacts</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {seg.rules.map((r) => (
                        <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: seg.color }}>{seg.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tags' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
              <input value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} placeholder="Search tags..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-th-border/50 bg-surface-primary focus:border-th-accent-500/50 focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <div key={tag.name} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-th-border/50 hover:bg-surface-secondary/30">
                  <Tag className="w-3 h-3" style={{ color: tag.color }} />
                  <span className="text-xs font-medium text-th-text-primary">{tag.name}</span>
                  <span className="text-[10px] text-th-text-tertiary tabular-nums bg-surface-tertiary px-1.5 py-0.5 rounded-full">{tag.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Segment Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>34 contacts</strong> are in the "At Risk" segment with no activity in 60 days. Consider running a re-engagement campaign targeted to this group.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
