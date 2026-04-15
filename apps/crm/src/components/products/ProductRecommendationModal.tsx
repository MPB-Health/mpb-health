import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, Star, ArrowRight, CheckCircle2, User } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductRecommendationModalProps { open: boolean; onClose: () => void; }

type Profile = { age: number; familySize: 'single' | 'couple' | 'family'; budget: 'low' | 'mid' | 'high'; hsaInterest: boolean; };

const RECOMMENDATIONS: Record<string, { plan: string; score: number; reason: string; price: string; color: string }[]> = {
  'low-single': [
    { plan: 'Essentials', score: 95, reason: 'Lowest cost MEC coverage, ideal for single members on a budget', price: '$142/mo', color: '#3b82f6' },
    { plan: 'MEC+ Essentials', score: 78, reason: 'Slightly more coverage with MEC+ benefits', price: '$198/mo', color: '#10b981' },
  ],
  'mid-family': [
    { plan: 'Care Plus', score: 92, reason: 'Great IUA-based family coverage with cost sharing', price: '$720/mo', color: '#8b5cf6' },
    { plan: 'Direct', score: 85, reason: 'Comprehensive sharing with broad provider access', price: '$860/mo', color: '#f59e0b' },
  ],
  'high-single': [
    { plan: 'Secure HSA', score: 96, reason: 'Maximum coverage with HSA tax advantages', price: '$412/mo', color: '#ef4444' },
    { plan: 'Direct', score: 88, reason: 'Strong sharing program with flexibility', price: '$348/mo', color: '#f59e0b' },
  ],
  default: [
    { plan: 'Care Plus', score: 90, reason: 'Best all-around value for most members', price: '$284/mo', color: '#8b5cf6' },
    { plan: 'Essentials', score: 82, reason: 'Most affordable MEC-compliant option', price: '$142/mo', color: '#3b82f6' },
    { plan: 'Secure HSA', score: 75, reason: 'Top-tier HSA-compatible coverage', price: '$412/mo', color: '#ef4444' },
  ],
};

export function ProductRecommendationModal({ open, onClose }: ProductRecommendationModalProps) {
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [profile, setProfile] = useState<Profile>({ age: 35, familySize: 'single', budget: 'mid', hsaInterest: false });

  const getKey = () => {
    if (profile.budget === 'low' && profile.familySize === 'single') return 'low-single';
    if (profile.budget === 'mid' && profile.familySize === 'family') return 'mid-family';
    if (profile.budget === 'high' && profile.familySize === 'single') return 'high-single';
    return 'default';
  };
  const recs = RECOMMENDATIONS[getKey()];

  return (
    <Modal open={open} onClose={onClose} title="AI Plan Recommendation" size="lg">
      <div className="space-y-4">
        {step === 'input' ? (
          <>
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Tell us about your client</span></div>
              <p className="text-[10px] text-th-text-tertiary mt-0.5">We'll match them to the best plan based on their profile.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Age: {profile.age}</label>
              <input type="range" min={18} max={64} value={profile.age} onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))} className="w-full accent-th-accent-500" />
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Household</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([['single', 'Single'], ['couple', 'Couple'], ['family', 'Family']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setProfile((p) => ({ ...p, familySize: v }))} className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all', profile.familySize === v ? 'bg-th-accent-500/10 text-th-accent-500 border-th-accent-500/30' : 'border-th-border/50 text-th-text-tertiary')}>{l}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Budget</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([['low', 'Budget-Friendly'], ['mid', 'Balanced'], ['high', 'Comprehensive']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setProfile((p) => ({ ...p, budget: v }))} className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all', profile.budget === v ? 'bg-th-accent-500/10 text-th-accent-500 border-th-accent-500/30' : 'border-th-border/50 text-th-text-tertiary')}>{l}</button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50 cursor-pointer">
              <input type="checkbox" checked={profile.hsaInterest} onChange={(e) => setProfile((p) => ({ ...p, hsaInterest: e.target.checked }))} className="accent-th-accent-500" />
              <span className="text-xs text-th-text-secondary">Interested in HSA benefits</span>
            </label>

            <button onClick={() => setStep('result')} className="w-full py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-th-accent-600 transition-colors">
              <Sparkles className="w-4 h-4" /> Get Recommendation
            </button>
          </>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Recommendation</span></div>
              <p className="text-[10px] text-th-text-tertiary mt-0.5">Based on: Age {profile.age}, {profile.familySize}, {profile.budget} budget{profile.hsaInterest ? ', HSA interest' : ''}</p>
            </div>

            <div className="space-y-2">
              {recs.map((rec, i) => (
                <div key={rec.plan} className={cn('p-3 rounded-xl border', i === 0 ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
                  <div className="flex items-center gap-2 mb-1">
                    {i === 0 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    <span className="text-sm font-bold text-th-text-primary">{rec.plan}</span>
                    <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: rec.color }}>{rec.score}% match</span>
                  </div>
                  <p className="text-xs text-th-text-secondary">{rec.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-th-accent-500">{rec.price}</span>
                    <div className="h-1.5 flex-1 mx-3 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${rec.score}%`, backgroundColor: rec.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('input')} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Adjust Profile</button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 transition-colors">Use Recommendation</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
