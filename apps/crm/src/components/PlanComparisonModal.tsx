import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  ArrowUpDown, Check, X, Plus, Trash2, Download, Send, Share2,
  Shield, Heart, Pill, Stethoscope, DollarSign, Star, Eye,
  AlertCircle, ChevronDown, ChevronRight, Copy,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PlanData {
  id: string;
  name: string;
  carrier: string;
  planType: string;
  monthlyPremium: number;
  annualPremium: number;
  deductible: number;
  outOfPocketMax: number;
  copayPrimary: number;
  copaySpecialist: number;
  copayER: number;
  copayUrgentCare: number;
  coinsurance: number;
  rxTier1: number;
  rxTier2: number;
  rxTier3: number;
  rxTier4: string;
  dental: boolean;
  vision: boolean;
  hearing: boolean;
  telehealth: boolean;
  silverSneakers: boolean;
  mealBenefit: boolean;
  transportation: boolean;
  otcAllowance: number;
  networkType: 'HMO' | 'PPO' | 'PFFS' | 'MSA' | 'SNP';
  starRating: number;
  notes?: string;
}

interface PlanComparisonModalProps {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  plans?: PlanData[];
  onSendToClient?: (planIds: string[]) => Promise<void>;
}

const SAMPLE_PLANS: PlanData[] = [
  {
    id: '1', name: 'Aetna Medicare Advantage PPO', carrier: 'Aetna', planType: 'MA', monthlyPremium: 0, annualPremium: 0, deductible: 250, outOfPocketMax: 5900, copayPrimary: 0, copaySpecialist: 40, copayER: 90, copayUrgentCare: 40, coinsurance: 20, rxTier1: 0, rxTier2: 10, rxTier3: 47, rxTier4: '33%', dental: true, vision: true, hearing: true, telehealth: true, silverSneakers: true, mealBenefit: false, transportation: true, otcAllowance: 50, networkType: 'PPO', starRating: 4.5,
  },
  {
    id: '2', name: 'UnitedHealthcare AARP MA HMO', carrier: 'UHC', planType: 'MA', monthlyPremium: 29, annualPremium: 348, deductible: 0, outOfPocketMax: 4500, copayPrimary: 0, copaySpecialist: 35, copayER: 90, copayUrgentCare: 35, coinsurance: 20, rxTier1: 0, rxTier2: 8, rxTier3: 42, rxTier4: '29%', dental: true, vision: true, hearing: true, telehealth: true, silverSneakers: false, mealBenefit: true, transportation: true, otcAllowance: 75, networkType: 'HMO', starRating: 4.0,
  },
  {
    id: '3', name: 'Humana Gold Plus HMO', carrier: 'Humana', planType: 'MA', monthlyPremium: 15, annualPremium: 180, deductible: 0, outOfPocketMax: 3400, copayPrimary: 0, copaySpecialist: 30, copayER: 120, copayUrgentCare: 30, coinsurance: 20, rxTier1: 0, rxTier2: 5, rxTier3: 40, rxTier4: '25%', dental: true, vision: true, hearing: false, telehealth: true, silverSneakers: true, mealBenefit: true, transportation: true, otcAllowance: 100, networkType: 'HMO', starRating: 4.0,
  },
];

type SortField = 'monthlyPremium' | 'deductible' | 'outOfPocketMax' | 'starRating';

function currencyFmt(n: number) {
  return `$${n.toLocaleString()}`;
}

function BoolCell({ value }: { value: boolean }) {
  return value
    ? <Check className="w-4 h-4 text-green-500 mx-auto" />
    : <X className="w-4 h-4 text-red-400 mx-auto" />;
}

function CostCell({ value, best }: { value: number | string; best?: boolean }) {
  return (
    <span className={cn('tabular-nums text-sm font-medium', best ? 'text-green-600 dark:text-green-400' : 'text-th-text-primary')}>
      {typeof value === 'number' ? currencyFmt(value) : value}
      {best && <Star className="inline w-3 h-3 ml-0.5 text-green-500" />}
    </span>
  );
}

export function PlanComparisonModal({
  open, onClose, clientName = 'Client', plans: propPlans, onSendToClient,
}: PlanComparisonModalProps) {
  const plans = propPlans && propPlans.length > 0 ? propPlans : SAMPLE_PLANS;
  const [sortField, setSortField] = useState<SortField>('monthlyPremium');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set(plans.map((p) => p.id)));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['costs', 'copays', 'rx', 'benefits']));

  const sorted = useMemo(() => {
    const filtered = plans.filter((p) => selectedPlans.has(p.id));
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [plans, selectedPlans, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const toggleSection = (s: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const bestPremium = Math.min(...sorted.map((p) => p.monthlyPremium));
  const bestDeductible = Math.min(...sorted.map((p) => p.deductible));
  const bestOOP = Math.min(...sorted.map((p) => p.outOfPocketMax));

  const sections = [
    {
      id: 'costs', label: 'Core Costs', icon: DollarSign,
      rows: [
        { label: 'Monthly Premium', render: (p: PlanData) => <CostCell value={p.monthlyPremium} best={p.monthlyPremium === bestPremium} /> },
        { label: 'Annual Premium', render: (p: PlanData) => <CostCell value={p.annualPremium} /> },
        { label: 'Deductible', render: (p: PlanData) => <CostCell value={p.deductible} best={p.deductible === bestDeductible} /> },
        { label: 'Out-of-Pocket Max', render: (p: PlanData) => <CostCell value={p.outOfPocketMax} best={p.outOfPocketMax === bestOOP} /> },
        { label: 'Coinsurance', render: (p: PlanData) => <span className="text-sm text-th-text-primary tabular-nums">{p.coinsurance}%</span> },
      ],
    },
    {
      id: 'copays', label: 'Copays', icon: Stethoscope,
      rows: [
        { label: 'Primary Care', render: (p: PlanData) => <CostCell value={p.copayPrimary} /> },
        { label: 'Specialist', render: (p: PlanData) => <CostCell value={p.copaySpecialist} /> },
        { label: 'Emergency Room', render: (p: PlanData) => <CostCell value={p.copayER} /> },
        { label: 'Urgent Care', render: (p: PlanData) => <CostCell value={p.copayUrgentCare} /> },
      ],
    },
    {
      id: 'rx', label: 'Prescription Drug Coverage', icon: Pill,
      rows: [
        { label: 'Tier 1 (Generic)', render: (p: PlanData) => <CostCell value={p.rxTier1} /> },
        { label: 'Tier 2 (Preferred)', render: (p: PlanData) => <CostCell value={p.rxTier2} /> },
        { label: 'Tier 3 (Non-Preferred)', render: (p: PlanData) => <CostCell value={p.rxTier3} /> },
        { label: 'Tier 4 (Specialty)', render: (p: PlanData) => <span className="text-sm text-th-text-primary tabular-nums">{p.rxTier4}</span> },
      ],
    },
    {
      id: 'benefits', label: 'Additional Benefits', icon: Heart,
      rows: [
        { label: 'Dental', render: (p: PlanData) => <BoolCell value={p.dental} /> },
        { label: 'Vision', render: (p: PlanData) => <BoolCell value={p.vision} /> },
        { label: 'Hearing', render: (p: PlanData) => <BoolCell value={p.hearing} /> },
        { label: 'Telehealth', render: (p: PlanData) => <BoolCell value={p.telehealth} /> },
        { label: 'SilverSneakers', render: (p: PlanData) => <BoolCell value={p.silverSneakers} /> },
        { label: 'Meal Benefit', render: (p: PlanData) => <BoolCell value={p.mealBenefit} /> },
        { label: 'Transportation', render: (p: PlanData) => <BoolCell value={p.transportation} /> },
        { label: 'OTC Allowance', render: (p: PlanData) => <CostCell value={p.otcAllowance} /> },
      ],
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Plan Comparison — ${clientName}`} size="2xl">
      <div className="space-y-4">
        {/* Plan selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {plans.map((p) => (
            <label key={p.id} className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all',
              selectedPlans.has(p.id) ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-tertiary'
            )}>
              <input type="checkbox" checked={selectedPlans.has(p.id)} onChange={() => {
                setSelectedPlans((prev) => {
                  const next = new Set(prev);
                  next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                  return next;
                });
              }} className="sr-only" />
              <Shield className="w-3 h-3" /> {p.carrier}
            </label>
          ))}
        </div>

        {/* Comparison table */}
        <div className="max-h-[420px] overflow-auto rounded-xl border border-th-border/50">
          <table className="w-full text-left">
            {/* Plan headers */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-secondary">
                <th className="px-3 py-2.5 text-xs font-semibold text-th-text-secondary w-[160px] sticky left-0 bg-surface-secondary">Feature</th>
                {sorted.map((p) => (
                  <th key={p.id} className="px-3 py-2.5 text-center min-w-[140px]">
                    <p className="text-xs font-semibold text-th-text-primary truncate">{p.carrier}</p>
                    <p className="text-[10px] text-th-text-tertiary truncate">{p.name}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn('w-2.5 h-2.5', i < Math.floor(p.starRating) ? 'text-amber-400 fill-amber-400' : 'text-th-text-tertiary')} />
                      ))}
                      <span className="text-[10px] text-th-text-tertiary ml-0.5 tabular-nums">{p.starRating}</span>
                    </div>
                    <span className={cn('inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full',
                      p.networkType === 'PPO' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    )}>{p.networkType}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => {
                const Icon = section.icon;
                const expanded = expandedSections.has(section.id);
                return [
                  <tr key={section.id + '-header'} className="cursor-pointer hover:bg-surface-secondary/50" onClick={() => toggleSection(section.id)}>
                    <td colSpan={sorted.length + 1} className="px-3 py-2 border-t border-th-border/30">
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" /> : <ChevronRight className="w-3.5 h-3.5 text-th-text-tertiary" />}
                        <Icon className="w-3.5 h-3.5 text-th-accent-500" />
                        <span className="text-xs font-semibold text-th-text-secondary">{section.label}</span>
                      </div>
                    </td>
                  </tr>,
                  ...(expanded ? section.rows.map((row) => (
                    <tr key={section.id + '-' + row.label} className="border-t border-th-border/20 hover:bg-surface-secondary/30">
                      <td className="px-3 py-2 text-xs text-th-text-secondary sticky left-0 bg-surface-primary">{row.label}</td>
                      {sorted.map((p) => (
                        <td key={p.id} className="px-3 py-2 text-center">{row.render(p)}</td>
                      ))}
                    </tr>
                  )) : []),
                ];
              }).flat()}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <div className="flex-1" />
          <button onClick={() => { onSendToClient?.(Array.from(selectedPlans)); onClose(); }} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">
            <Send className="w-4 h-4" /> Send to {clientName}
          </button>
        </div>
      </div>
    </Modal>
  );
}
