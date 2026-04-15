import { useState } from 'react';
import { Modal } from '../Modal';
import { Users, Filter, Plus, Tag, MapPin, Calendar, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const SEGMENTS = [
  { id: '1', name: 'High-Value Leads', size: 186, description: 'Leads with estimated value > $500/mo', match: 'score >= 80', color: '#3b82f6' },
  { id: '2', name: 'Uninsured Families', size: 324, description: 'Family households without current coverage', match: 'type = family & no_coverage', color: '#10b981' },
  { id: '3', name: 'Stale Pipeline', size: 98, description: 'Leads with no activity in 30+ days', match: 'last_activity > 30d', color: '#f59e0b' },
  { id: '4', name: 'HSA Interested', size: 142, description: 'Leads who viewed HSA plans', match: 'viewed_plans includes HSA', color: '#8b5cf6' },
  { id: '5', name: 'Young Adults 18-35', size: 412, description: 'Age-based demographic segment', match: 'age 18-35', color: '#ef4444' },
  { id: '6', name: 'Texas Region', size: 268, description: 'Leads from Texas', match: 'state = TX', color: '#06b6d4' },
];

const CRITERIA = [
  { type: 'Lead Score', options: ['>=80', '>=60', '>=40', '<40'] },
  { type: 'Source', options: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Event'] },
  { type: 'State', options: ['TX', 'CA', 'FL', 'NY', 'IL'] },
  { type: 'Plan Interest', options: ['Essentials', 'Care Plus', 'Secure HSA', 'Any'] },
];

export function CampaignAudienceModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'segments' | 'builder'>('segments');
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
  const toggleSegment = (id: string) => setSelectedSegments((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const totalAudience = SEGMENTS.filter((s) => selectedSegments.has(s.id)).reduce((sum, s) => sum + s.size, 0);

  return (
    <Modal open={open} onClose={onClose} title="Audience Builder" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['segments', 'builder'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{t === 'segments' ? 'Saved Segments' : 'Custom Builder'}</button>
          ))}
          {selectedSegments.size > 0 && <span className="ml-auto text-[10px] text-th-accent-500 font-bold">{totalAudience.toLocaleString()} contacts selected</span>}
        </div>

        {tab === 'segments' ? (
          <div className="space-y-1.5">
            {SEGMENTS.map((s) => (
              <label key={s.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all', selectedSegments.has(s.id) ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
                <input type="checkbox" checked={selectedSegments.has(s.id)} onChange={() => toggleSegment(s.id)} className="accent-th-accent-500" />
                <div className="w-2.5 h-6 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary">{s.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">{s.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-th-text-primary tabular-nums">{s.size.toLocaleString()}</p>
                  <p className="text-[8px] text-th-text-tertiary">contacts</p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.type}>
                <label className="text-xs font-medium text-th-text-secondary block mb-1">{c.type}</label>
                <div className="flex flex-wrap gap-1">
                  {c.options.map((o) => (
                    <button key={o} className="px-2.5 py-1 rounded-lg text-[10px] font-medium border border-th-border/50 text-th-text-tertiary hover:border-th-accent-500/30 hover:text-th-accent-500 transition-all">{o}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="p-2.5 rounded-xl bg-surface-tertiary/50 border border-th-border/30 text-center">
              <p className="text-xs text-th-text-secondary">Estimated audience: <strong className="text-th-accent-500">~1,430 contacts</strong></p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Audience Tip</span></div>
          <p className="text-xs text-th-text-secondary">Combining <strong>High-Value Leads</strong> + <strong>HSA Interested</strong> creates a high-intent segment of ~62 contacts with 3x average conversion rates.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button disabled={selectedSegments.size === 0 && tab === 'segments'} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-th-accent-600 flex items-center justify-center gap-1.5"><Users className="w-4 h-4" />Apply Audience</button>
        </div>
      </div>
    </Modal>
  );
}
