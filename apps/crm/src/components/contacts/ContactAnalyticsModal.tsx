import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, TrendingUp, Users, Mail, Phone, Sparkles, Star, Globe } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ContactAnalyticsModalProps { open: boolean; onClose: () => void; totalContacts: number; }

const MOCK_BY_SOURCE = [
  { source: 'Website', count: 142, pct: 27, color: '#3b82f6' },
  { source: 'Referral', count: 98, pct: 19, color: '#10b981' },
  { source: 'Cold Call', count: 76, pct: 15, color: '#f59e0b' },
  { source: 'LinkedIn', count: 64, pct: 12, color: '#8b5cf6' },
  { source: 'Trade Show', count: 52, pct: 10, color: '#ef4444' },
  { source: 'Partner', count: 48, pct: 9, color: '#06b6d4' },
  { source: 'Other', count: 42, pct: 8, color: '#6b7280' },
];

const MOCK_GROWTH = [
  { month: 'Nov', added: 38, lost: 5 },
  { month: 'Dec', added: 42, lost: 3 },
  { month: 'Jan', added: 56, lost: 8 },
  { month: 'Feb', added: 48, lost: 4 },
  { month: 'Mar', added: 62, lost: 6 },
  { month: 'Apr', added: 34, lost: 2 },
];

const MOCK_ENGAGEMENT = [
  { channel: 'Email', sent: 1240, opened: 856, replied: 312, rate: 69 },
  { channel: 'Phone', attempts: 520, connected: 342, meetings: 86, rate: 66 },
  { channel: 'SMS', sent: 380, delivered: 368, replied: 124, rate: 97 },
];

export function ContactAnalyticsModal({ open, onClose, totalContacts }: ContactAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const maxCount = Math.max(...MOCK_BY_SOURCE.map((s) => s.count), 1);
  const maxGrowth = Math.max(...MOCK_GROWTH.map((g) => g.added), 1);

  return (
    <Modal open={open} onClose={onClose} title="Contact Analytics" size="2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Contacts', value: String(totalContacts), icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'With Email', value: '89%', icon: Mail, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'With Phone', value: '76%', icon: Phone, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Net New (30d)', value: '+34', icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* By Source */}
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">By Lead Source</p>
            <div className="space-y-1.5">
              {MOCK_BY_SOURCE.map((s) => (
                <div key={s.source} className="flex items-center gap-2">
                  <span className="text-[10px] text-th-text-tertiary w-16 truncate">{s.source}</span>
                  <div className="flex-1 h-3.5 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded flex items-center px-1" style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.color + '40' }}>
                      <span className="text-[8px] font-bold text-th-text-primary">{s.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary tabular-nums w-6 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth trend */}
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Growth</p>
            <div className="flex items-end gap-1.5 h-[100px]">
              {MOCK_GROWTH.map((g) => (
                <div key={g.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full rounded-t bg-green-500/50" style={{ height: `${(g.added / maxGrowth) * 70}px` }} />
                    <div className="w-full rounded-b bg-red-500/30" style={{ height: `${(g.lost / maxGrowth) * 70}px` }} />
                  </div>
                  <span className="text-[8px] text-th-text-tertiary">{g.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-green-500/50" />Added</span>
              <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-red-500/30" />Lost</span>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50">
            <p className="text-xs font-semibold text-th-text-secondary">Engagement by Channel</p>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-th-border/30">
              <th className="text-left px-3 py-2 text-th-text-tertiary font-medium">Channel</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Sent/Attempted</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Opened/Connected</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Replied/Meeting</th>
              <th className="text-right px-3 py-2 text-th-text-tertiary font-medium">Rate</th>
            </tr></thead>
            <tbody>
              {MOCK_ENGAGEMENT.map((e) => (
                <tr key={e.channel} className="border-t border-th-border/20">
                  <td className="px-3 py-2 font-medium text-th-text-primary">{e.channel}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{'sent' in e ? e.sent : e.attempts}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{'opened' in e ? e.opened : 'connected' in e ? e.connected : e.delivered}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{'replied' in e ? e.replied : e.meetings}</td>
                  <td className="text-right px-3 py-2"><span className={cn('tabular-nums font-bold', e.rate >= 60 ? 'text-green-500' : 'text-amber-500')}>{e.rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Contact Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Website</strong> is your top source at 27%, but <strong>Referral</strong> contacts have 2.3x higher conversion rate. Consider investing more in referral programs.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
