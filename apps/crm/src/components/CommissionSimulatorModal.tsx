import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  DollarSign, TrendingUp, Plus, Trash2, Calculator, ArrowRight,
  Wallet, PiggyBank, BarChart3, Target, CheckCircle2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface SimulatedDeal {
  id: string;
  name: string;
  premium: number;
  planType: string;
  commissionRate: number;
  advanceRate: number;
  payPeriods: number;
  probability: number;
}

interface CommissionSimulatorModalProps {
  open: boolean;
  onClose: () => void;
  existingCommissions?: { earned: number; pending: number; projected: number };
  deals?: SimulatedDeal[];
}

const PLAN_TYPES = [
  { value: 'medicare_advantage', label: 'Medicare Advantage', defaultRate: 0.08, defaultAdvance: 0.5 },
  { value: 'medicare_supplement', label: 'Medicare Supplement', defaultRate: 0.20, defaultAdvance: 0.0 },
  { value: 'aca', label: 'ACA / Marketplace', defaultRate: 0.05, defaultAdvance: 0.0 },
  { value: 'life', label: 'Life Insurance', defaultRate: 0.55, defaultAdvance: 0.75 },
  { value: 'dental_vision', label: 'Dental/Vision', defaultRate: 0.10, defaultAdvance: 0.0 },
  { value: 'group', label: 'Group Health', defaultRate: 0.04, defaultAdvance: 0.0 },
  { value: 'ancillary', label: 'Ancillary', defaultRate: 0.15, defaultAdvance: 0.5 },
];

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function CommissionSimulatorModal({
  open, onClose,
  existingCommissions = { earned: 12450, pending: 4200, projected: 8900 },
  deals: initialDeals,
}: CommissionSimulatorModalProps) {
  const [deals, setDeals] = useState<SimulatedDeal[]>(initialDeals || [
    { id: '1', name: 'Sample MA Deal', premium: 4800, planType: 'medicare_advantage', commissionRate: 0.08, advanceRate: 0.5, payPeriods: 12, probability: 80 },
  ]);

  const addDeal = () => {
    setDeals((prev) => [...prev, {
      id: String(Date.now()),
      name: '',
      premium: 0,
      planType: 'medicare_advantage',
      commissionRate: 0.08,
      advanceRate: 0.5,
      payPeriods: 12,
      probability: 70,
    }]);
  };

  const removeDeal = (id: string) => setDeals((prev) => prev.filter((d) => d.id !== id));

  const updateDeal = (id: string, updates: Partial<SimulatedDeal>) => {
    setDeals((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const merged = { ...d, ...updates };
      if (updates.planType) {
        const pt = PLAN_TYPES.find((p) => p.value === updates.planType);
        if (pt) {
          merged.commissionRate = pt.defaultRate;
          merged.advanceRate = pt.defaultAdvance;
        }
      }
      return merged;
    }));
  };

  const projections = useMemo(() => {
    let totalCommission = 0;
    let totalAdvance = 0;
    let weightedCommission = 0;

    deals.forEach((d) => {
      const annual = d.premium * d.commissionRate;
      const advance = annual * d.advanceRate;
      const asEarned = annual - advance;
      totalCommission += annual;
      totalAdvance += advance;
      weightedCommission += annual * (d.probability / 100);
    });

    return {
      totalCommission,
      totalAdvance,
      totalAsEarned: totalCommission - totalAdvance,
      weightedCommission,
      grandTotal: existingCommissions.earned + existingCommissions.pending + weightedCommission,
    };
  }, [deals, existingCommissions]);

  const quarters = useMemo(() => {
    const now = new Date();
    const currentQ = Math.ceil((now.getMonth() + 1) / 3);
    return Array.from({ length: 4 }, (_, i) => {
      const q = ((currentQ - 1 + i) % 4) + 1;
      const year = now.getFullYear() + (currentQ + i > 4 ? 1 : 0);
      const base = existingCommissions.projected / 4;
      const sim = projections.weightedCommission / 4;
      return { label: `Q${q} ${year}`, baseline: base, simulated: base + sim };
    });
  }, [existingCommissions, projections]);

  return (
    <Modal open={open} onClose={onClose} title="Commission Simulator" size="2xl">
      <div className="space-y-5">
        {/* Current Earnings Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Earned YTD', value: existingCommissions.earned, icon: Wallet, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Pending', value: existingCommissions.pending, icon: PiggyBank, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Projected (with sims)', value: projections.grandTotal, icon: TrendingUp, color: 'text-th-accent-500', bg: 'from-violet-500/10 to-blue-500/10' },
          ].map((stat) => (
            <div key={stat.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', stat.bg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
                <span className="text-[10px] font-medium text-th-text-tertiary uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-th-text-primary tabular-nums">{currencyFmt(stat.value)}</p>
            </div>
          ))}
        </div>

        {/* Quarterly Waterfall */}
        <div className="p-3 rounded-xl border border-th-border/50 bg-surface-secondary/30">
          <p className="text-xs font-semibold text-th-text-secondary mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-th-accent-500" /> Quarterly Forecast</p>
          <div className="flex items-end gap-2 h-24">
            {quarters.map((q) => {
              const maxVal = Math.max(...quarters.map((qq) => qq.simulated), 1);
              const baseH = (q.baseline / maxVal) * 100;
              const simH = (q.simulated / maxVal) * 100;
              return (
                <div key={q.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: 80 }}>
                    <div className="w-full max-w-[40px] rounded-t-md bg-th-accent-500/30 relative" style={{ height: `${simH}%` }}>
                      <div className="absolute bottom-0 w-full rounded-t-md bg-th-accent-500" style={{ height: `${(baseH / simH) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-th-text-tertiary">{q.label}</span>
                  <span className="text-[10px] font-bold text-th-text-secondary tabular-nums">{currencyFmt(q.simulated)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded-sm bg-th-accent-500" /> Baseline</span>
            <span className="flex items-center gap-1 text-[10px] text-th-text-tertiary"><span className="w-2 h-2 rounded-sm bg-th-accent-500/30" /> + Simulated</span>
          </div>
        </div>

        {/* Deal Simulator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-th-text-secondary flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-th-accent-500" /> What-If Deals</p>
            <button onClick={addDeal} className="flex items-center gap-1 text-xs font-medium text-th-accent-500 hover:text-th-accent-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Deal
            </button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {deals.map((deal) => {
              const annualComm = deal.premium * deal.commissionRate;
              const advance = annualComm * deal.advanceRate;
              return (
                <div key={deal.id} className="p-3 rounded-xl border border-th-border/50 bg-surface-secondary/20">
                  <div className="grid grid-cols-[1fr_120px_120px_80px_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={deal.name}
                      onChange={(e) => updateDeal(deal.id, { name: e.target.value })}
                      placeholder="Deal name..."
                      className="text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
                    />
                    <div>
                      <label className="text-[10px] text-th-text-tertiary">Annual Premium</label>
                      <input
                        type="number"
                        value={deal.premium}
                        onChange={(e) => updateDeal(deal.id, { premium: Number(e.target.value) || 0 })}
                        className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 tabular-nums focus:border-th-accent-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-th-text-tertiary">Plan Type</label>
                      <select
                        value={deal.planType}
                        onChange={(e) => updateDeal(deal.id, { planType: e.target.value })}
                        className="w-full text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none"
                      >
                        {PLAN_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-th-text-tertiary">Prob %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={deal.probability}
                        onChange={(e) => updateDeal(deal.id, { probability: Number(e.target.value) || 0 })}
                        className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 text-center tabular-nums focus:border-th-accent-500/50 focus:outline-none"
                      />
                    </div>
                    <button onClick={() => removeDeal(deal.id)} className="p-1.5 text-th-text-tertiary hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-th-text-tertiary">
                    <span>Rate: <strong className="text-th-text-secondary">{(deal.commissionRate * 100).toFixed(0)}%</strong></span>
                    <span>Commission: <strong className="text-green-500 tabular-nums">{currencyFmt(annualComm)}</strong></span>
                    {advance > 0 && <span>Advance: <strong className="text-amber-500 tabular-nums">{currencyFmt(advance)}</strong></span>}
                    <span>Weighted: <strong className="text-th-accent-500 tabular-nums">{currencyFmt(annualComm * deal.probability / 100)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulation Summary */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <Target className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-th-text-primary">If you close these {deals.length} deal{deals.length !== 1 ? 's' : ''}:</p>
            <p className="text-xs text-th-text-secondary mt-0.5">
              Total new commission: <strong className="text-green-600 dark:text-green-400">{currencyFmt(projections.totalCommission)}</strong>
              {projections.totalAdvance > 0 && <> · Advance: <strong className="text-amber-600 dark:text-amber-400">{currencyFmt(projections.totalAdvance)}</strong></>}
              {' '}· Weighted: <strong className="text-th-accent-500">{currencyFmt(projections.weightedCommission)}</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Save Scenario
          </button>
        </div>
      </div>
    </Modal>
  );
}
