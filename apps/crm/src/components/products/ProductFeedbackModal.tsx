import { useState } from 'react';
import { Modal } from '../Modal';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductFeedbackModalProps { open: boolean; onClose: () => void; }

const PLANS_FEEDBACK = [
  { plan: 'Essentials', nps: 72, satisfaction: 4.3, positive: 86, negative: 14, topPraise: 'Affordable pricing', topComplaint: 'Limited coverage', color: '#3b82f6' },
  { plan: 'MEC+ Essentials', nps: 68, satisfaction: 4.1, positive: 82, negative: 18, topPraise: 'Good MEC value', topComplaint: 'Confusion with Essentials', color: '#10b981' },
  { plan: 'Care Plus', nps: 78, satisfaction: 4.5, positive: 90, negative: 10, topPraise: 'Great IUA options', topComplaint: 'Complex pricing', color: '#8b5cf6' },
  { plan: 'Direct', nps: 65, satisfaction: 4.0, positive: 78, negative: 22, topPraise: 'Provider flexibility', topComplaint: 'Higher premiums', color: '#f59e0b' },
  { plan: 'Secure HSA', nps: 82, satisfaction: 4.6, positive: 92, negative: 8, topPraise: 'HSA tax advantages', topComplaint: 'High starting cost', color: '#ef4444' },
];

const RECENT_FEEDBACK = [
  { name: 'John M.', plan: 'Care Plus', rating: 5, text: 'The IUA options gave us exactly the flexibility we needed. Great value.', date: '2 days ago' },
  { name: 'Sarah K.', plan: 'Essentials', rating: 4, text: 'Very affordable for our small business. Would love more coverage options.', date: '5 days ago' },
  { name: 'Mike T.', plan: 'Secure HSA', rating: 5, text: 'The HSA compatibility is a game-changer for tax planning.', date: '1 week ago' },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn('w-3 h-3', i <= count ? 'text-amber-400 fill-amber-400' : 'text-th-text-tertiary/20')} />)}
    </div>
  );
}

export function ProductFeedbackModal({ open, onClose }: ProductFeedbackModalProps) {
  const [tab, setTab] = useState<'overview' | 'reviews'>('overview');
  const avgNps = Math.round(PLANS_FEEDBACK.reduce((s, p) => s + p.nps, 0) / PLANS_FEEDBACK.length);
  const avgSat = (PLANS_FEEDBACK.reduce((s, p) => s + p.satisfaction, 0) / PLANS_FEEDBACK.length).toFixed(1);

  return (
    <Modal open={open} onClose={onClose} title="Client Satisfaction" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['overview', 'reviews'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{t}</button>
          ))}
        </div>

        {tab === 'overview' ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
                <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-th-text-primary">{avgNps}</p>
                <p className="text-[10px] text-th-text-tertiary">Avg NPS</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
                <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-th-text-primary">{avgSat}</p>
                <p className="text-[10px] text-th-text-tertiary">Avg Rating</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
                <ThumbsUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-th-text-primary">86%</p>
                <p className="text-[10px] text-th-text-tertiary">Positive</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {PLANS_FEEDBACK.map((p) => (
                <div key={p.plan} className="p-2.5 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-semibold text-th-text-primary flex-1">{p.plan}</span>
                    <span className={cn('text-[10px] font-bold', p.nps >= 75 ? 'text-green-500' : p.nps >= 60 ? 'text-amber-500' : 'text-red-500')}>NPS {p.nps}</span>
                    <Stars count={Math.round(p.satisfaction)} />
                    <span className="text-[10px] text-th-text-tertiary">{p.satisfaction}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden flex">
                    <div className="h-full bg-green-500/60" style={{ width: `${p.positive}%` }} />
                    <div className="h-full bg-red-400/60" style={{ width: `${p.negative}%` }} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[9px] text-th-text-tertiary">
                    <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5 text-green-500" />{p.topPraise}</span>
                    <span className="flex items-center gap-0.5"><ThumbsDown className="w-2.5 h-2.5 text-red-400" />{p.topComplaint}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {RECENT_FEEDBACK.map((f) => (
              <div key={f.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center text-[9px] font-bold text-th-text-secondary">{f.name[0]}</div>
                  <span className="text-xs font-semibold text-th-text-primary">{f.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-th-accent-500/10 text-th-accent-500 font-medium">{f.plan}</span>
                  <span className="ml-auto text-[9px] text-th-text-tertiary">{f.date}</span>
                </div>
                <Stars count={f.rating} />
                <p className="text-xs text-th-text-secondary mt-1">{f.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Satisfaction Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Secure HSA</strong> leads with 82 NPS and 4.6 rating. <strong>Direct</strong> has the most complaints about premium cost — consider a competitive positioning campaign.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
