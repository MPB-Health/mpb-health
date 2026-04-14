import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Heart, ChevronRight, ChevronLeft, User, Users as UsersIcon, MapPin,
  DollarSign, Pill, Stethoscope, ShieldCheck, Sparkles, Check, Star,
  AlertTriangle, Download, Send, Baby, Loader2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FamilyMember {
  id: string;
  relation: string;
  age: number;
  tobaccoUse: boolean;
  preExisting: string[];
  medications: string[];
}

interface NeedsProfile {
  clientName: string;
  dateOfBirth: string;
  zipCode: string;
  county: string;
  income: number;
  householdSize: number;
  currentCoverage: string;
  preferredDoctors: string[];
  prescriptions: string[];
  healthConditions: string[];
  coveragePriorities: string[];
  budgetRange: [number, number];
  enrollmentPeriod: string;
  familyMembers: FamilyMember[];
}

interface PlanRecommendation {
  id: string;
  planName: string;
  carrier: string;
  planType: string;
  monthlyPremium: number;
  deductible: number;
  outOfPocketMax: number;
  score: number;
  strengths: string[];
  weaknesses: string[];
  doctorsInNetwork: number;
  drugsOnFormulary: number;
}

interface NeedsAnalysisWizardProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  leadName?: string;
  initialData?: Partial<NeedsProfile>;
  onComplete?: (profile: NeedsProfile, recommendations: PlanRecommendation[]) => Promise<void>;
}

const STEPS = [
  { id: 'demographics', label: 'Demographics', icon: User },
  { id: 'health', label: 'Health Profile', icon: Heart },
  { id: 'coverage', label: 'Coverage Needs', icon: ShieldCheck },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'results', label: 'Recommendations', icon: Star },
];

const HEALTH_CONDITIONS = [
  'Diabetes', 'Heart Disease', 'COPD/Asthma', 'Cancer (history)', 'Arthritis',
  'Mental Health', 'High Blood Pressure', 'High Cholesterol', 'Kidney Disease',
  'Back/Spine Issues', 'None',
];

const COVERAGE_PRIORITIES = [
  'Low monthly premium', 'Low deductible', 'Prescription coverage', 'Specialist access',
  'Dental & vision', 'Mental health coverage', 'Nationwide network', 'Telehealth',
  'Preventive care', 'Chronic condition management',
];

const ENROLLMENT_PERIODS = [
  { value: 'oep', label: 'Open Enrollment (Oct 15 - Dec 7)' },
  { value: 'aep', label: 'Annual Enrollment (Jan 1 - Mar 31)' },
  { value: 'sep', label: 'Special Enrollment Period' },
  { value: 'initial', label: 'Initial Coverage (turning 65)' },
  { value: 'aca_oep', label: 'ACA Open Enrollment (Nov 1 - Jan 15)' },
];

const MOCK_RECOMMENDATIONS: PlanRecommendation[] = [
  { id: '1', planName: 'Aetna Medicare Advantage PPO', carrier: 'Aetna', planType: 'Medicare Advantage', monthlyPremium: 0, deductible: 250, outOfPocketMax: 5900, score: 94, strengths: ['$0 premium', 'Large PPO network', 'Part D included', 'SilverSneakers'], weaknesses: ['Higher specialist copays'], doctorsInNetwork: 8, drugsOnFormulary: 12 },
  { id: '2', planName: 'UnitedHealthcare AARP MA HMO', carrier: 'UnitedHealthcare', planType: 'Medicare Advantage', monthlyPremium: 29, deductible: 0, outOfPocketMax: 4500, score: 89, strengths: ['$0 deductible', 'Dental/vision/hearing', 'Meal delivery benefit'], weaknesses: ['HMO network restrictions', 'Referral required'], doctorsInNetwork: 6, drugsOnFormulary: 11 },
  { id: '3', planName: 'Humana Gold Plus HMO', carrier: 'Humana', planType: 'Medicare Advantage', monthlyPremium: 15, deductible: 0, outOfPocketMax: 3400, score: 85, strengths: ['Low OOP max', 'Strong chronic care', 'Transportation benefit'], weaknesses: ['Limited network', 'No out-of-network coverage'], doctorsInNetwork: 5, drugsOnFormulary: 10 },
  { id: '4', planName: 'BCBS Medicare Supplement Plan G', carrier: 'Blue Cross Blue Shield', planType: 'Medicare Supplement', monthlyPremium: 145, deductible: 0, outOfPocketMax: 226, score: 78, strengths: ['Any Medicare provider', 'Predictable costs', 'No network'], weaknesses: ['Higher monthly premium', 'No drug coverage (separate Part D)'], doctorsInNetwork: 10, drugsOnFormulary: 0 },
];

export function NeedsAnalysisWizard({
  open, onClose, leadId, leadName = 'Client', initialData, onComplete,
}: NeedsAnalysisWizardProps) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<NeedsProfile>({
    clientName: leadName,
    dateOfBirth: '',
    zipCode: '',
    county: '',
    income: 0,
    householdSize: 1,
    currentCoverage: '',
    preferredDoctors: [],
    prescriptions: [],
    healthConditions: [],
    coveragePriorities: [],
    budgetRange: [0, 300],
    enrollmentPeriod: 'oep',
    familyMembers: [],
    ...initialData,
  });
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [doctorInput, setDoctorInput] = useState('');
  const [rxInput, setRxInput] = useState('');

  const updateProfile = (updates: Partial<NeedsProfile>) => setProfile((p) => ({ ...p, ...updates }));

  const toggleCondition = (c: string) => {
    if (c === 'None') {
      updateProfile({ healthConditions: profile.healthConditions.includes('None') ? [] : ['None'] });
      return;
    }
    const filtered = profile.healthConditions.filter((h) => h !== 'None');
    updateProfile({
      healthConditions: filtered.includes(c) ? filtered.filter((h) => h !== c) : [...filtered, c],
    });
  };

  const togglePriority = (p: string) => {
    updateProfile({
      coveragePriorities: profile.coveragePriorities.includes(p)
        ? profile.coveragePriorities.filter((pp) => pp !== p)
        : [...profile.coveragePriorities, p],
    });
  };

  const addDoctor = () => {
    if (doctorInput.trim()) {
      updateProfile({ preferredDoctors: [...profile.preferredDoctors, doctorInput.trim()] });
      setDoctorInput('');
    }
  };

  const addRx = () => {
    if (rxInput.trim()) {
      updateProfile({ prescriptions: [...profile.prescriptions, rxInput.trim()] });
      setRxInput('');
    }
  };

  const goNext = async () => {
    if (step === STEPS.length - 2) {
      setGenerating(true);
      setStep(step + 1);
      await new Promise((r) => setTimeout(r, 1500));
      setRecommendations(MOCK_RECOMMENDATIONS);
      setGenerating(false);
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const goBack = () => { if (step > 0) setStep(step - 1); };

  const handleComplete = async () => {
    if (onComplete) await onComplete(profile, recommendations);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Client Needs Analysis" size="2xl">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const active = idx === step;
            const done = idx < step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                  active ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' :
                  done ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  'text-th-text-tertiary'
                )}>
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-th-text-tertiary shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[340px]">
          {/* Step 1: Demographics */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">Client Name</label>
                  <input type="text" value={profile.clientName} onChange={(e) => updateProfile({ clientName: e.target.value })}
                    className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">Date of Birth</label>
                  <input type="date" value={profile.dateOfBirth} onChange={(e) => updateProfile({ dateOfBirth: e.target.value })}
                    className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">Zip Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                    <input type="text" value={profile.zipCode} onChange={(e) => updateProfile({ zipCode: e.target.value })} maxLength={5}
                      className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 focus:border-th-accent-500/50 focus:outline-none" placeholder="32801" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">County</label>
                  <input type="text" value={profile.county} onChange={(e) => updateProfile({ county: e.target.value })}
                    className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" placeholder="Orange" />
                </div>
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">Annual Income</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                    <input type="number" value={profile.income || ''} onChange={(e) => updateProfile({ income: Number(e.target.value) })}
                      className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-th-text-secondary mb-1 block">Household Size</label>
                  <select value={profile.householdSize} onChange={(e) => updateProfile({ householdSize: Number(e.target.value) })}
                    className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                    {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Current Coverage</label>
                <select value={profile.currentCoverage} onChange={(e) => updateProfile({ currentCoverage: e.target.value })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                  <option value="">Select current coverage...</option>
                  <option value="none">No coverage</option>
                  <option value="employer">Employer-sponsored</option>
                  <option value="marketplace">ACA Marketplace</option>
                  <option value="medicare_a_b">Medicare Parts A & B only</option>
                  <option value="medicare_advantage">Medicare Advantage</option>
                  <option value="medicare_supplement">Medicare Supplement (Medigap)</option>
                  <option value="medicaid">Medicaid</option>
                  <option value="tricare">TRICARE</option>
                  <option value="cobra">COBRA</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Enrollment Period</label>
                <select value={profile.enrollmentPeriod} onChange={(e) => updateProfile({ enrollmentPeriod: e.target.value })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                  {ENROLLMENT_PERIODS.map((ep) => <option key={ep.value} value={ep.value}>{ep.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Health Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-2 block">Health Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONDITIONS.map((c) => (
                    <button key={c} onClick={() => toggleCondition(c)} className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      profile.healthConditions.includes(c)
                        ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500'
                        : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
                    )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Preferred Doctors / Providers</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                    <input type="text" value={doctorInput} onChange={(e) => setDoctorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDoctor()}
                      placeholder="Dr. Smith, Orlando Health..."
                      className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
                  </div>
                  <button onClick={addDoctor} className="px-3 py-2 rounded-xl border border-th-border text-xs font-medium text-th-text-secondary hover:bg-surface-secondary">Add</button>
                </div>
                {profile.preferredDoctors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredDoctors.map((d, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-secondary text-xs text-th-text-secondary">
                        {d}
                        <button onClick={() => updateProfile({ preferredDoctors: profile.preferredDoctors.filter((_, j) => j !== i) })} className="text-th-text-tertiary hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Current Prescriptions</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                    <input type="text" value={rxInput} onChange={(e) => setRxInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRx()}
                      placeholder="Metformin, Lisinopril..."
                      className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary pl-8 pr-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
                  </div>
                  <button onClick={addRx} className="px-3 py-2 rounded-xl border border-th-border text-xs font-medium text-th-text-secondary hover:bg-surface-secondary">Add</button>
                </div>
                {profile.prescriptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.prescriptions.map((rx, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 text-xs text-violet-600 dark:text-violet-400">
                        {rx}
                        <button onClick={() => updateProfile({ prescriptions: profile.prescriptions.filter((_, j) => j !== i) })} className="text-violet-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Coverage Needs */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-2 block">Coverage Priorities (select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {COVERAGE_PRIORITIES.map((p) => (
                    <button key={p} onClick={() => togglePriority(p)} className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left',
                      profile.coveragePriorities.includes(p)
                        ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500'
                        : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
                    )}>
                      <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        profile.coveragePriorities.includes(p) ? 'bg-th-accent-500 border-th-accent-500' : 'border-th-border'
                      )}>
                        {profile.coveragePriorities.includes(p) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <DollarSign className="w-8 h-8 text-th-accent-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-th-text-primary">Monthly Budget Range</h3>
                <p className="text-sm text-th-text-tertiary mt-1">What is the client comfortable spending per month on premiums?</p>
              </div>

              <div className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <label className="text-[10px] text-th-text-tertiary uppercase tracking-wider">Min</label>
                    <input type="number" value={profile.budgetRange[0]} onChange={(e) => updateProfile({ budgetRange: [Number(e.target.value), profile.budgetRange[1]] })}
                      className="w-24 text-center text-lg font-bold text-th-text-primary bg-transparent border-b-2 border-th-accent-500 focus:outline-none tabular-nums" />
                    <span className="text-xs text-th-text-tertiary">/mo</span>
                  </div>
                  <span className="text-th-text-tertiary">to</span>
                  <div className="text-center">
                    <label className="text-[10px] text-th-text-tertiary uppercase tracking-wider">Max</label>
                    <input type="number" value={profile.budgetRange[1]} onChange={(e) => updateProfile({ budgetRange: [profile.budgetRange[0], Number(e.target.value)] })}
                      className="w-24 text-center text-lg font-bold text-th-text-primary bg-transparent border-b-2 border-th-accent-500 focus:outline-none tabular-nums" />
                    <span className="text-xs text-th-text-tertiary">/mo</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {[{ label: '$0 plans only', range: [0, 0] as [number, number] }, { label: 'Under $50', range: [0, 50] as [number, number] }, { label: '$50-$150', range: [50, 150] as [number, number] }, { label: '$150-$300', range: [150, 300] as [number, number] }, { label: '$300+', range: [300, 999] as [number, number] }].map((preset) => (
                    <button key={preset.label} onClick={() => updateProfile({ budgetRange: preset.range })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        profile.budgetRange[0] === preset.range[0] && profile.budgetRange[1] === preset.range[1]
                          ? 'border-th-accent-500/50 bg-th-accent-500/10 text-th-accent-500'
                          : 'border-th-border/50 text-th-text-secondary hover:border-th-accent-500/30'
                      )}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Recommendations */}
          {step === 4 && (
            <div className="space-y-3">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-th-text-primary">Analyzing {profile.clientName}&apos;s needs...</p>
                  <p className="text-xs text-th-text-tertiary mt-1">Comparing plans across carriers in {profile.zipCode || 'your area'}</p>
                  <Loader2 className="w-5 h-5 text-th-accent-500 animate-spin mt-3" />
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        AI analyzed <strong>{profile.healthConditions.length}</strong> conditions, <strong>{profile.prescriptions.length}</strong> medications, and <strong>{profile.coveragePriorities.length}</strong> priorities to rank <strong>{recommendations.length}</strong> plans.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {recommendations.map((plan, idx) => (
                      <div key={plan.id} className={cn(
                        'p-3 rounded-xl border transition-all',
                        idx === 0 ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                            idx === 0 ? 'bg-th-accent-500 text-white' : 'bg-surface-tertiary text-th-text-secondary'
                          )}>
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-th-text-primary">{plan.planName}</span>
                              {idx === 0 && <span className="text-[9px] font-bold text-th-accent-500 bg-th-accent-500/10 px-1.5 py-0.5 rounded-full uppercase">Best Match</span>}
                            </div>
                            <p className="text-xs text-th-text-tertiary">{plan.carrier} · {plan.planType}</p>
                            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                              <div><span className="text-th-text-tertiary">Premium</span><br /><strong className="text-th-text-primary tabular-nums">${plan.monthlyPremium}/mo</strong></div>
                              <div><span className="text-th-text-tertiary">Deductible</span><br /><strong className="text-th-text-primary tabular-nums">${plan.deductible}</strong></div>
                              <div><span className="text-th-text-tertiary">OOP Max</span><br /><strong className="text-th-text-primary tabular-nums">${plan.outOfPocketMax}</strong></div>
                              <div><span className="text-th-text-tertiary">Match Score</span><br /><strong className="text-th-accent-500 tabular-nums">{plan.score}%</strong></div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {plan.strengths.slice(0, 3).map((s) => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">{s}</span>
                              ))}
                              {plan.weaknesses.slice(0, 1).map((w) => (
                                <span key={w} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">{w}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 border-th-accent-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-th-accent-500 tabular-nums">{plan.score}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {step > 0 && step < STEPS.length - 1 && (
            <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button onClick={goNext} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">
              {step === STEPS.length - 2 ? 'Generate Recommendations' : 'Next'}
              {step === STEPS.length - 2 ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : !generating && (
            <div className="flex gap-2">
              <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                <ChevronLeft className="w-4 h-4" /> Adjust
              </button>
              <button onClick={handleComplete} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={handleComplete} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">
                <Send className="w-4 h-4" /> Send to Client
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
