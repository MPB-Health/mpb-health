import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Calculator, DollarSign, MapPin, User, Calendar, Heart,
  Pill, Shield, ChevronDown, ChevronRight, Send, Download,
  Star, Check, AlertTriangle, Loader2, Sparkles, RefreshCw,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface QuoteInput {
  age: number;
  zipCode: string;
  county: string;
  gender: 'male' | 'female';
  tobaccoUse: boolean;
  currentCoverage: string;
  planCategory: 'medicare_advantage' | 'medicare_supplement' | 'aca' | 'dental_vision' | 'life';
  householdIncome: number;
  householdSize: number;
}

interface QuoteResult {
  id: string;
  carrier: string;
  carrierLogo?: string;
  planName: string;
  planType: string;
  monthlyPremium: number;
  annualPremium: number;
  deductible: number;
  outOfPocketMax: number;
  starRating: number;
  networkType: string;
  subsidyEligible: boolean;
  subsidyAmount?: number;
  highlights: string[];
}

interface RateQuoteCalculatorProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadId?: string;
  initialInput?: Partial<QuoteInput>;
  onSaveQuote?: (input: QuoteInput, results: QuoteResult[]) => Promise<void>;
  onSendToClient?: (results: QuoteResult[]) => Promise<void>;
}

const PLAN_CATEGORIES = [
  { value: 'medicare_advantage', label: 'Medicare Advantage', minAge: 65 },
  { value: 'medicare_supplement', label: 'Medicare Supplement (Medigap)', minAge: 65 },
  { value: 'aca', label: 'ACA / Marketplace', minAge: 0 },
  { value: 'dental_vision', label: 'Dental & Vision', minAge: 0 },
  { value: 'life', label: 'Life Insurance', minAge: 18 },
];

const MOCK_RESULTS: Record<string, QuoteResult[]> = {
  medicare_advantage: [
    { id: '1', carrier: 'Aetna', planName: 'Aetna Medicare Advantage PPO', planType: 'MA-PPO', monthlyPremium: 0, annualPremium: 0, deductible: 250, outOfPocketMax: 5900, starRating: 4.5, networkType: 'PPO', subsidyEligible: false, highlights: ['$0 premium', 'Dental/Vision/Hearing', 'SilverSneakers'] },
    { id: '2', carrier: 'UnitedHealthcare', planName: 'AARP Medicare Advantage HMO', planType: 'MA-HMO', monthlyPremium: 29, annualPremium: 348, deductible: 0, outOfPocketMax: 4500, starRating: 4.0, networkType: 'HMO', subsidyEligible: false, highlights: ['$0 deductible', 'OTC allowance $75/qtr', 'Meal delivery'] },
    { id: '3', carrier: 'Humana', planName: 'Humana Gold Plus HMO', planType: 'MA-HMO', monthlyPremium: 15, annualPremium: 180, deductible: 0, outOfPocketMax: 3400, starRating: 4.0, networkType: 'HMO', subsidyEligible: false, highlights: ['Low OOP max', 'Transportation', 'Chronic care mgmt'] },
    { id: '4', carrier: 'Cigna', planName: 'Cigna Medicare Advantage PPO', planType: 'MA-PPO', monthlyPremium: 35, annualPremium: 420, deductible: 175, outOfPocketMax: 5200, starRating: 3.5, networkType: 'PPO', subsidyEligible: false, highlights: ['Nationwide PPO', 'Part D included', 'Telehealth $0'] },
  ],
  medicare_supplement: [
    { id: '5', carrier: 'BCBS', planName: 'Blue Cross Plan G', planType: 'Medigap-G', monthlyPremium: 145, annualPremium: 1740, deductible: 0, outOfPocketMax: 226, starRating: 4.5, networkType: 'Any Medicare', subsidyEligible: false, highlights: ['Any doctor', 'Predictable costs', 'Part B excess'] },
    { id: '6', carrier: 'Mutual of Omaha', planName: 'Plan G', planType: 'Medigap-G', monthlyPremium: 128, annualPremium: 1536, deductible: 0, outOfPocketMax: 226, starRating: 4.0, networkType: 'Any Medicare', subsidyEligible: false, highlights: ['Lower premium', 'Household discount', 'Rate stability'] },
    { id: '7', carrier: 'Aetna', planName: 'Plan N', planType: 'Medigap-N', monthlyPremium: 98, annualPremium: 1176, deductible: 0, outOfPocketMax: 0, starRating: 4.0, networkType: 'Any Medicare', subsidyEligible: false, highlights: ['Budget-friendly', '$20 office copay', 'No referrals'] },
  ],
  aca: [
    { id: '8', carrier: 'BCBS', planName: 'Blue Options Silver PPO', planType: 'ACA-Silver', monthlyPremium: 320, annualPremium: 3840, deductible: 3000, outOfPocketMax: 8700, starRating: 4.0, networkType: 'PPO', subsidyEligible: true, subsidyAmount: 180, highlights: ['Subsidy eligible', 'Large network', 'Preventive $0'] },
    { id: '9', carrier: 'Oscar', planName: 'Oscar Silver Classic', planType: 'ACA-Silver', monthlyPremium: 295, annualPremium: 3540, deductible: 3500, outOfPocketMax: 8200, starRating: 3.5, networkType: 'EPO', subsidyEligible: true, subsidyAmount: 180, highlights: ['$0 primary care', 'Telehealth 24/7', 'Concierge team'] },
  ],
  dental_vision: [
    { id: '10', carrier: 'Delta Dental', planName: 'Delta PPO Plus', planType: 'Dental', monthlyPremium: 35, annualPremium: 420, deductible: 50, outOfPocketMax: 1500, starRating: 4.5, networkType: 'PPO', subsidyEligible: false, highlights: ['Nationwide', 'Implant coverage', 'No waiting period'] },
  ],
  life: [
    { id: '11', carrier: 'Mutual of Omaha', planName: '20-Year Term Life', planType: 'Term-20', monthlyPremium: 45, annualPremium: 540, deductible: 0, outOfPocketMax: 0, starRating: 4.5, networkType: 'N/A', subsidyEligible: false, highlights: ['$250K coverage', 'Level premium', 'Convertible'] },
  ],
};

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function RateQuoteCalculator({
  open, onClose, leadName = 'Client', leadId, initialInput, onSaveQuote, onSendToClient,
}: RateQuoteCalculatorProps) {
  const [input, setInput] = useState<QuoteInput>({
    age: 65, zipCode: '', county: '', gender: 'male', tobaccoUse: false,
    currentCoverage: '', planCategory: 'medicare_advantage', householdIncome: 0, householdSize: 1,
    ...initialInput,
  });
  const [quoting, setQuoting] = useState(false);
  const [results, setResults] = useState<QuoteResult[]>([]);
  const [sortBy, setSortBy] = useState<'monthlyPremium' | 'starRating' | 'outOfPocketMax'>('monthlyPremium');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  const updateInput = (u: Partial<QuoteInput>) => setInput((p) => ({ ...p, ...u }));

  const runQuote = async () => {
    setQuoting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const r = MOCK_RESULTS[input.planCategory] || [];
    setResults(r);
    setSelectedResults(new Set(r.map((rr) => rr.id)));
    setQuoting(false);
  };

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === 'starRating') return b.starRating - a.starRating;
      return (a[sortBy] as number) - (b[sortBy] as number);
    });
  }, [results, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedResults((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Rate Quote Calculator — ${leadName}`} size="2xl">
      <div className="space-y-4">
        {/* Input form */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Age</label>
            <input type="number" value={input.age} onChange={(e) => updateInput({ age: Number(e.target.value) })}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Zip Code</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
              <input type="text" value={input.zipCode} onChange={(e) => updateInput({ zipCode: e.target.value })} maxLength={5} placeholder="32801"
                className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Gender</label>
            <select value={input.gender} onChange={(e) => updateInput({ gender: e.target.value as 'male' | 'female' })}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Tobacco</label>
            <button onClick={() => updateInput({ tobaccoUse: !input.tobaccoUse })} className={cn(
              'w-full text-sm rounded-xl border px-3 py-2 font-medium transition-all',
              input.tobaccoUse ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-th-border/50 bg-surface-primary text-th-text-secondary'
            )}>{input.tobaccoUse ? 'Yes' : 'No'}</button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-th-text-secondary mb-1.5 block">Plan Category</label>
          <div className="flex flex-wrap gap-2">
            {PLAN_CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => updateInput({ planCategory: cat.value as QuoteInput['planCategory'] })}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                  input.planCategory === cat.value
                    ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500'
                    : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
                )}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {input.planCategory === 'aca' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-th-text-secondary mb-1 block">Household Income</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                <input type="number" value={input.householdIncome || ''} onChange={(e) => updateInput({ householdIncome: Number(e.target.value) })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-th-text-secondary mb-1 block">Household Size</label>
              <select value={input.householdSize} onChange={(e) => updateInput({ householdSize: Number(e.target.value) })}
                className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        )}

        <button onClick={runQuote} disabled={quoting || !input.zipCode}
          className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {quoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          {quoting ? 'Pulling Rates...' : 'Get Quotes'}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-th-text-tertiary">{results.length} plans found</span>
              <div className="flex-1" />
              <span className="text-xs text-th-text-tertiary">Sort:</span>
              {[
                { key: 'monthlyPremium' as const, label: 'Premium' },
                { key: 'starRating' as const, label: 'Rating' },
                { key: 'outOfPocketMax' as const, label: 'OOP Max' },
              ].map((s) => (
                <button key={s.key} onClick={() => setSortBy(s.key)} className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium',
                  sortBy === s.key ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary'
                )}>{s.label}</button>
              ))}
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {sorted.map((plan, idx) => (
                <label key={plan.id} className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  selectedResults.has(plan.id) ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                )}>
                  <input type="checkbox" checked={selectedResults.has(plan.id)} onChange={() => toggleSelect(plan.id)}
                    className="mt-1 w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-th-text-primary">{plan.carrier}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{plan.networkType}</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn('w-2.5 h-2.5', i < Math.floor(plan.starRating) ? 'text-amber-400 fill-amber-400' : 'text-th-text-tertiary')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-th-text-tertiary">{plan.planName}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                      <div><span className="text-th-text-tertiary">Premium</span><br />
                        <strong className="text-lg text-th-text-primary tabular-nums">{currencyFmt(plan.monthlyPremium)}</strong><span className="text-th-text-tertiary">/mo</span>
                        {plan.subsidyEligible && plan.subsidyAmount && (
                          <span className="block text-green-500 text-[10px]">After {currencyFmt(plan.subsidyAmount)} subsidy</span>
                        )}
                      </div>
                      <div><span className="text-th-text-tertiary">Deductible</span><br /><strong className="text-th-text-primary tabular-nums">{currencyFmt(plan.deductible)}</strong></div>
                      <div><span className="text-th-text-tertiary">OOP Max</span><br /><strong className="text-th-text-primary tabular-nums">{currencyFmt(plan.outOfPocketMax)}</strong></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.highlights.map((h) => (
                        <span key={h} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">{h}</span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                <Download className="w-4 h-4" /> Export
              </button>
              <div className="flex-1" />
              <button onClick={() => { onSaveQuote?.(input, results.filter((r) => selectedResults.has(r.id))); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                <Check className="w-4 h-4" /> Save to Lead
              </button>
              <button onClick={() => { onSendToClient?.(results.filter((r) => selectedResults.has(r.id))); onClose(); }}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">
                <Send className="w-4 h-4" /> Send {selectedResults.size} Quote{selectedResults.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {results.length === 0 && !quoting && (
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
