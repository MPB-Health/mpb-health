import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Shield, DollarSign, TrendingDown, Check, Star, Copy,
  Sparkles, Loader2, ArrowRight, AlertTriangle, ChevronDown,
  ChevronRight, Target, RefreshCw,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface CompetitorPlan {
  carrier: string;
  planName: string;
  monthlyPremium: number;
  deductible: number;
  oopMax: number;
  starRating: number;
  networkType: string;
}

interface OurPlan {
  carrier: string;
  planName: string;
  monthlyPremium: number;
  deductible: number;
  oopMax: number;
  starRating: number;
  networkType: string;
  advantages: string[];
  savings: number;
}

interface CompetitivePitchModalProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  competitorPlan?: CompetitorPlan;
}

const MOCK_COMPETITOR: CompetitorPlan = {
  carrier: 'UnitedHealthcare', planName: 'AARP MA HMO', monthlyPremium: 45,
  deductible: 250, oopMax: 6700, starRating: 3.5, networkType: 'HMO',
};

const MOCK_ALTERNATIVES: OurPlan[] = [
  { carrier: 'Aetna', planName: 'Aetna MA PPO', monthlyPremium: 0, deductible: 250, oopMax: 5900, starRating: 4.5, networkType: 'PPO',
    advantages: ['$0 premium (saves $540/yr)', 'PPO — more provider flexibility', 'Higher star rating (4.5 vs 3.5)', 'Dental/Vision/Hearing included', 'SilverSneakers fitness'], savings: 540 },
  { carrier: 'Humana', planName: 'Gold Plus HMO', monthlyPremium: 15, deductible: 0, oopMax: 3400, starRating: 4.0, networkType: 'HMO',
    advantages: ['$0 deductible', 'Lower OOP max ($3,400 vs $6,700)', 'Transportation benefit', '$30/mo savings'], savings: 360 },
];

const MOCK_PITCH = `Hi [Name],

I was thinking about our conversation from a few months ago when you mentioned you were going with UnitedHealthcare's AARP MA HMO plan.

I wanted to reach out because I've found some options that could save you significant money while actually giving you better coverage:

**Option 1: Aetna MA PPO — $0/month (saves $540/year)**
• $0 monthly premium vs your current $45/month
• PPO network = more doctors & no referrals needed
• 4.5 star rating (vs 3.5)
• Includes dental, vision, hearing + SilverSneakers

**Option 2: Humana Gold Plus — $15/month**
• $0 deductible (vs $250)
• Much lower out-of-pocket max ($3,400 vs $6,700)
• Transportation benefit included

With the Annual Enrollment Period coming up, now is the perfect time to make a switch. Would you have 15 minutes for a quick comparison call? I can walk you through the exact savings.

No pressure at all — I just want to make sure you're getting the best deal.

Best,
{{agent_name}}`;

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function CompetitivePitchModal({ open, onClose, leadName = 'Client', competitorPlan: propComp }: CompetitivePitchModalProps) {
  const competitor = propComp || MOCK_COMPETITOR;
  const [generating, setGenerating] = useState(false);
  const [pitch, setPitch] = useState(MOCK_PITCH);
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  const regenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPitch(MOCK_PITCH);
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pitch).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Competitive Win-Back Pitch — ${leadName}`} size="2xl">
      <div className="space-y-4">
        {/* Current competitor plan */}
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">Current / Competitor Plan</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-th-text-primary">{competitor.carrier} — {competitor.planName}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-th-text-tertiary">
                <span>{currencyFmt(competitor.monthlyPremium)}/mo</span>
                <span>Ded: {currencyFmt(competitor.deductible)}</span>
                <span>OOP: {currencyFmt(competitor.oopMax)}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('w-2.5 h-2.5', i < Math.floor(competitor.starRating) ? 'text-amber-400 fill-amber-400' : 'text-th-text-tertiary')} />
                  ))}
                </span>
                <span>{competitor.networkType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Our alternatives */}
        <div>
          <button onClick={() => setShowComparison(!showComparison)} className="flex items-center gap-2 text-xs font-semibold text-th-text-secondary mb-2">
            {showComparison ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Better Alternatives ({MOCK_ALTERNATIVES.length})
          </button>
          {showComparison && (
            <div className="space-y-2">
              {MOCK_ALTERNATIVES.map((plan, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-th-text-primary">{plan.carrier} — {plan.planName}</span>
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Saves {currencyFmt(plan.savings)}/yr
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-th-text-tertiary mb-2">
                    <span className="font-medium text-green-600 dark:text-green-400">{currencyFmt(plan.monthlyPremium)}/mo</span>
                    <span>Ded: {currencyFmt(plan.deductible)}</span>
                    <span>OOP: {currencyFmt(plan.oopMax)}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn('w-2.5 h-2.5', i < Math.floor(plan.starRating) ? 'text-amber-400 fill-amber-400' : 'text-th-text-tertiary')} />
                      ))}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.advantages.map((adv) => (
                      <span key={adv} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />{adv}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated pitch */}
        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border-b border-th-border/50">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-th-text-primary flex-1">AI-Generated Win-Back Pitch</span>
            <button onClick={regenerate} disabled={generating} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-th-text-tertiary hover:text-th-text-secondary">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          <div className="p-4 max-h-[220px] overflow-y-auto">
            <p className="text-xs text-th-text-primary whitespace-pre-wrap leading-relaxed">{pitch}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={handleCopy} className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            copied ? 'border-green-500/50 text-green-500' : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
          )}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Pitch'}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
