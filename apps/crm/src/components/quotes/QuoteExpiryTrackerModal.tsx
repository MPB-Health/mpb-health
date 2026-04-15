import { useState } from 'react';
import { Modal } from '../Modal';
import { Clock, AlertTriangle, Bell, Send, CheckCircle2, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteExpiryTrackerModalProps { open: boolean; onClose: () => void; }

const EXPIRING = [
  { id: '1', name: 'Q-2024-089 — Acme Corp', value: 12500, expiresIn: 2, status: 'pending', reminded: false },
  { id: '2', name: 'Q-2024-091 — BrightCare', value: 24800, expiresIn: 5, status: 'sent', reminded: true },
  { id: '3', name: 'Q-2024-094 — Wellness Group', value: 9100, expiresIn: 8, status: 'pending', reminded: false },
  { id: '4', name: 'Q-2024-076 — TechStart LLC', value: 8400, expiresIn: 12, status: 'sent', reminded: true },
];

const EXPIRED = [
  { id: '5', name: 'Q-2024-065 — GlobalTeam Inc', value: 18200, expiredDays: 3, status: 'expired' },
  { id: '6', name: 'Q-2024-058 — MedPro Systems', value: 11600, expiredDays: 8, status: 'expired' },
];

export function QuoteExpiryTrackerModal({ open, onClose }: QuoteExpiryTrackerModalProps) {
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalExpiring = EXPIRING.reduce((s, q) => s + q.value, 0);
  const totalExpired = EXPIRED.reduce((s, q) => s + q.value, 0);

  return (
    <Modal open={open} onClose={onClose} title="Expiry Tracker" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{EXPIRING.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Expiring Soon</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{EXPIRED.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Already Expired</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Bell className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{fmt(totalExpiring + totalExpired)}</p>
            <p className="text-[10px] text-th-text-tertiary">At-Risk Value</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['expiring', 'expired'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {t === 'expiring' ? `Expiring (${EXPIRING.length})` : `Expired (${EXPIRED.length})`}
            </button>
          ))}
        </div>

        {tab === 'expiring' ? (
          <div className="space-y-1.5">
            {EXPIRING.map((q) => (
              <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0', q.expiresIn <= 3 ? 'bg-red-500' : q.expiresIn <= 7 ? 'bg-amber-500' : 'bg-blue-500')}>{q.expiresIn}d</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-th-text-primary truncate">{q.name}</p>
                  <p className="text-[8px] text-th-text-tertiary capitalize">{q.status}{q.reminded ? ' • Reminded' : ''}</p>
                </div>
                <span className="text-[10px] font-bold text-th-text-primary tabular-nums shrink-0">{fmt(q.value)}</span>
                <div className="flex gap-1 shrink-0">
                  {!q.reminded && <button className="p-1 rounded text-amber-500 hover:bg-amber-500/10" title="Send Reminder"><Bell className="w-3 h-3" /></button>}
                  <button className="p-1 rounded text-blue-500 hover:bg-blue-500/10" title="Extend"><Clock className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {EXPIRED.map((q) => (
              <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-red-500/20 bg-red-500/5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-th-text-primary truncate">{q.name}</p>
                  <p className="text-[8px] text-red-400">Expired {q.expiredDays}d ago</p>
                </div>
                <span className="text-[10px] font-bold text-th-text-primary tabular-nums shrink-0">{fmt(q.value)}</span>
                <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] font-medium flex items-center gap-0.5 hover:bg-blue-500/20"><Send className="w-3 h-3" />Revise</button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Expiry Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Acme Corp</strong> quote ($12.5k) expires in 2 days and hasn't been reminded. Send a follow-up now to save this deal.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
