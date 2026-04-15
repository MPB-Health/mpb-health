import { useState } from 'react';
import { Modal } from '../Modal';
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, User, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteApprovalModalProps { open: boolean; onClose: () => void; }

const PENDING_APPROVALS = [
  { id: '1', quote: 'Q-2024-091 — BrightCare', value: 24800, requester: 'Sarah K.', reason: 'Discount >10%', submitted: '2h ago', urgency: 'high' as const },
  { id: '2', quote: 'Q-2024-094 — Wellness Group', value: 9100, requester: 'Mike T.', reason: 'Custom terms', submitted: '5h ago', urgency: 'medium' as const },
  { id: '3', quote: 'Q-2024-098 — FitLife Partners', value: 6200, requester: 'John M.', reason: 'Non-standard pricing', submitted: '1d ago', urgency: 'low' as const },
];

const RULES = [
  { trigger: 'Discount > 10%', approver: 'Sales Manager', autoEscalate: '24h' },
  { trigger: 'Value > $25,000', approver: 'VP Sales', autoEscalate: '48h' },
  { trigger: 'Custom Terms', approver: 'Legal Team', autoEscalate: '72h' },
  { trigger: 'Non-standard Plan', approver: 'Product Manager', autoEscalate: '24h' },
];

const urgencyColors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-500' };

export function QuoteApprovalModal({ open, onClose }: QuoteApprovalModalProps) {
  const [tab, setTab] = useState<'pending' | 'rules'>('pending');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Approval Workflow" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['pending', 'rules'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {t === 'pending' ? `Pending (${PENDING_APPROVALS.length})` : 'Approval Rules'}
            </button>
          ))}
        </div>

        {tab === 'pending' ? (
          <div className="space-y-2">
            {PENDING_APPROVALS.length === 0 ? (
              <div className="py-6 text-center text-th-text-tertiary">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No pending approvals</p>
              </div>
            ) : PENDING_APPROVALS.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2 h-2 rounded-full', urgencyColors[a.urgency])} />
                  <span className="text-xs font-semibold text-th-text-primary flex-1">{a.quote}</span>
                  <span className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(a.value)}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-th-text-tertiary mb-2">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.requester}</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{a.reason}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.submitted}</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-medium hover:bg-green-500/20 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Approve</button>
                  <button className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-[10px] font-medium hover:bg-red-500/20 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />Reject</button>
                  <button className="py-1.5 px-3 rounded-lg bg-surface-tertiary text-[10px] font-medium text-th-text-tertiary hover:bg-surface-tertiary/80">Comment</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Trigger</th>
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Approver</th>
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Auto-Escalate</th>
              </tr></thead>
              <tbody>{RULES.map((r) => (
                <tr key={r.trigger} className="border-t border-th-border/20">
                  <td className="px-3 py-2.5 font-medium text-th-text-primary">{r.trigger}</td>
                  <td className="px-3 py-2.5 text-th-text-secondary">{r.approver}</td>
                  <td className="px-3 py-2.5 text-th-text-tertiary">{r.autoEscalate}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Approval Tip</span></div>
          <p className="text-xs text-th-text-secondary">BrightCare quote ($24.8k) has been waiting 2 hours with a high-urgency flag. Quick approval can close this deal before end of week.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
