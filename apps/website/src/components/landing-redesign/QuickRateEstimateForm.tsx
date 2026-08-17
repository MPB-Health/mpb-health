import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Users,
  ShieldCheck,
  UserRound,
  UsersRound,
  Check,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { membershipPriorities, recommendPlans } from '../../lib/membershipPriorities';
import { estimateAllMemberships, type AllMembershipsEstimate } from '../../lib/newRateEngine';
import { getHouseholdPricingAge } from '../../lib/householdPricingAge';
import { leadSubmissionService } from '../../lib/leadSubmissionService';
import { getQuoteCalculatorSessionId, recordQuoteCalculatorEvent } from '../../lib/quoteCalculatorTracking';
import { fmtMoney } from '../../lib/utils';

const schema = z
  .object({
    householdType: z.enum(['member-only', 'member-spouse', 'member-child', 'member-family']),
    state: z.string().min(2, 'State is required'),
    primaryAge: z.number().min(18).max(64),
    spouseAge: z.number().min(18).max(64).optional(),
    dependentsCount: z.number().min(0).max(10).optional(),
    oldestDependentAge: z.number().min(0).max(64).optional(),
    membershipPriorities: z.array(z.string()).min(1),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  })
  .refine(
    (d) =>
      !(d.householdType === 'member-spouse' || d.householdType === 'member-family') ||
      (d.spouseAge !== undefined && d.spouseAge >= 18),
    { message: 'Spouse age is required', path: ['spouseAge'] },
  )
  .refine(
    (d) =>
      !(d.householdType === 'member-child' || d.householdType === 'member-family') ||
      (d.dependentsCount !== undefined && d.dependentsCount >= 1),
    { message: 'Number of children is required', path: ['dependentsCount'] },
  )
  .refine(
    (d) =>
      !(d.householdType === 'member-child' || d.householdType === 'member-family') ||
      d.oldestDependentAge !== undefined,
    { message: 'Age of oldest child is required', path: ['oldestDependentAge'] },
  );

type FormValues = z.infer<typeof schema>;

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WV', 'WI', 'WY',
];

const households = [
  { value: 'member-only' as const, label: 'Just Me', Icon: UserRound },
  { value: 'member-spouse' as const, label: 'Me + Spouse', Icon: UsersRound },
  { value: 'member-child' as const, label: 'Me + Kids', Icon: Users },
  { value: 'member-family' as const, label: 'Full Family', Icon: UsersRound, overlay: true },
];

function estimateTraditional(householdType: string, age: number) {
  const base =
    { 'member-only': 475, 'member-spouse': 950, 'member-child': 850, 'member-family': 1350 }[
      householdType
    ] ?? 475;
  const ageFactor = age < 30 ? 0.85 : age < 40 ? 1.0 : age < 50 ? 1.2 : age < 60 ? 1.5 : 1.8;
  return Math.round(base * ageFactor);
}

type Results = {
  estimates: AllMembershipsEstimate;
  recommendations: ReturnType<typeof recommendPlans>;
  traditionalCost: number;
};

export function QuickRateEstimateForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      householdType: 'member-only',
      membershipPriorities: [],
    },
  });

  const householdType = watch('householdType');
  const state = watch('state');
  const primaryAge = watch('primaryAge');
  const spouseAge = watch('spouseAge');
  const dependentsCount = watch('dependentsCount');
  const oldestDependentAge = watch('oldestDependentAge');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const phone = watch('phone');

  const progress = useMemo(() => (step / 4) * 100, [step]);

  const canStep1 = () => {
    if (!state || !primaryAge) return false;
    if (householdType === 'member-spouse') return spouseAge !== undefined && spouseAge >= 18;
    if (householdType === 'member-child') {
      return dependentsCount !== undefined && dependentsCount >= 1 && oldestDependentAge !== undefined;
    }
    if (householdType === 'member-family') {
      return (
        spouseAge !== undefined &&
        spouseAge >= 18 &&
        dependentsCount !== undefined &&
        dependentsCount >= 1 &&
        oldestDependentAge !== undefined
      );
    }
    return true;
  };

  const togglePriority = (id: string) => {
    setSelectedPriorities((prev) => {
      let next: string[];
      if (prev.includes(id)) next = prev.filter((p) => p !== id);
      else if (prev.length >= 3) next = prev;
      else next = [...prev, id];
      setValue('membershipPriorities', next, { shouldValidate: true });
      return next;
    });
  };

  const goNext = async () => {
    if (step === 1) {
      const fields: (keyof FormValues)[] = ['state', 'primaryAge'];
      if (householdType === 'member-spouse' || householdType === 'member-family') fields.push('spouseAge');
      if (householdType === 'member-child' || householdType === 'member-family') {
        fields.push('dependentsCount', 'oldestDependentAge');
      }
      if ((await trigger(fields)) && canStep1()) setStep(2);
      return;
    }
    if (step === 2 && selectedPriorities.length > 0) {
      setStep(3);
      return;
    }
    if (step !== 3) return;

    const ok = await trigger(['firstName', 'lastName', 'email']);
    if (!ok || !firstName?.trim() || !lastName?.trim() || !email?.trim()) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    setIsCalculating(true);
    setStep(4);

    try {
      const comparisonInput = {
        householdType,
        state,
        primaryAge,
        spouseAge: spouseAge ?? null,
        dependentsCount: dependentsCount || 0,
        oldestDependentAge: oldestDependentAge ?? null,
        primaryTobacco: false,
        spouseTobacco: false,
        currentMonthly: undefined,
      };
      const estimates = estimateAllMemberships(comparisonInput);
      const recommendations = recommendPlans(selectedPriorities);
      const traditionalCost = estimateTraditional(
        householdType,
        getHouseholdPricingAge({
          primaryAge,
          spouseAge: spouseAge ?? null,
          oldestDependentAge: oldestDependentAge ?? null,
          dependentsCount: dependentsCount || 0,
        }),
      );
      const nextResults: Results = { estimates, recommendations, traditionalCost };
      setResults(nextResults);

      recordQuoteCalculatorEvent('results_viewed', {
        plan_count: estimates.plans.length,
        best_match: recommendations[0]?.planId ?? null,
        state,
        household_type: householdType,
        traditional_cost: traditionalCost,
        source_path: window.location.pathname,
      });

      const allPlanRates: Record<string, unknown> = {};
      estimates.plans.forEach((plan) => {
        allPlanRates[plan.planId] = {
          planLabel: plan.planLabel,
          lowestPrice: plan.lowestPrice,
          highestPrice: plan.highestPrice,
          flatRate: plan.flatRate,
          tier_count: plan.tiers?.length ?? 0,
          tier_prices: (plan.tiers ?? []).slice(0, 12).map((t) => ({
            tierLabel: t.tierLabel ?? t.tierId,
            monthly: t.monthly,
          })),
        };
      });

      let householdSize = 1;
      if (householdType === 'member-spouse') householdSize = 2;
      else if (householdType === 'member-child') householdSize = 1 + (dependentsCount || 0);
      else if (householdType === 'member-family') householdSize = 2 + (dependentsCount || 0);

      const lead = await leadSubmissionService.submitLead({
        firstName,
        lastName,
        email,
        phone: phone?.trim() || 'Not provided',
        householdSize,
        zipCode: '',
        sourcePage: window.location.pathname,
        sourceCTA: 'landing-redesign-qre',
        formData: {
          lead_type: 'Quick Rate Estimate Leads',
          quote_calc_session_id: getQuoteCalculatorSessionId(),
          household_type: householdType,
          state,
          primary_age: primaryAge,
          spouse_age: spouseAge,
          dependents_count: dependentsCount,
          oldest_dependent_age: oldestDependentAge,
          membership_priorities: selectedPriorities,
          all_plan_rates: allPlanRates,
          traditional_cost_estimate: traditionalCost,
          best_match_plan: recommendations[0]?.planId || null,
          best_match_percentage: recommendations[0]?.matchPercentage || 0,
        },
      });

      if (!lead.success) {
        setSubmissionError(lead.error || 'Lead submission failed. Your estimate is still below.');
      } else {
        recordQuoteCalculatorEvent('lead_submitted', {
          state,
          household_type: householdType,
        });
      }
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsCalculating(false);
      setIsSubmitting(false);
    }
  };

  const topPlans = results
    ? results.recommendations.slice(0, 3).map((rec) => {
        const estimate = results.estimates.plans.find((p) => p.planId === rec.planId);
        return { rec, estimate };
      })
    : [];

  return (
    <div className="qre" id="estimate">
      <div className="qre__header">
        <div className="qre__title-row">
          <div className="qre__icon">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="qre__title">{step === 4 ? 'Your Rate Comparison' : 'Quick Rate Estimate'}</h2>
            <p className="qre__subtitle">Compare all plans in 30 seconds</p>
          </div>
        </div>
        <div className="qre__trust">
          <span>
            <Users size={16} /> Over 12,000+ members served
          </span>
          <span>
            <ShieldCheck size={16} /> Secure & Private
          </span>
        </div>
      </div>

      <div className="qre__progress" aria-hidden="true">
        <div className="qre__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="qre__body">
        {step === 1 && (
          <div className="qre__step">
            <div className="qre__eyebrow">STEP 1 OF 4</div>
            <h3 className="qre__step-title">Who is included?</h3>
            <div className="qre__tiles">
              {households.map(({ value, label, Icon, overlay }) => (
                <button
                  key={value}
                  type="button"
                  className={`qre__tile${householdType === value ? ' is-selected' : ''}`}
                  onClick={() => setValue('householdType', value, { shouldValidate: true })}
                >
                  <span className="qre__tile-icon-wrap">
                    <Icon size={33.6} fill="currentColor" stroke="currentColor" strokeWidth={1} />
                    {overlay ? (
                      <UserRound
                        className="qre-overlay-icon"
                        size={18.4}
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth={1}
                      />
                    ) : null}
                  </span>
                  <span className="qre__tile-label">{label}</span>
                </button>
              ))}
            </div>

            <div className="qre__fields">
              <label className="qre__field">
                <span className="qre__label">State</span>
                <select className="qre__input" {...register('state')}>
                  <option value="">Select</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state ? <span className="qre__error">{errors.state.message}</span> : null}
              </label>
              <label className="qre__field">
                <span className="qre__label">Your Age</span>
                <input
                  className="qre__input"
                  type="number"
                  min={18}
                  max={64}
                  placeholder="e.g., 35"
                  {...register('primaryAge', { valueAsNumber: true })}
                />
                {errors.primaryAge ? <span className="qre__error">{errors.primaryAge.message}</span> : null}
              </label>
            </div>

            {(householdType === 'member-spouse' || householdType === 'member-family') && (
              <div className="qre__panel qre__panel--spouse">
                <label className="qre__field">
                  <span className="qre__label">Spouse Age</span>
                  <input
                    className="qre__input"
                    type="number"
                    min={18}
                    max={64}
                    placeholder="e.g., 33"
                    {...register('spouseAge', { valueAsNumber: true })}
                  />
                  {errors.spouseAge ? <span className="qre__error">{errors.spouseAge.message}</span> : null}
                </label>
              </div>
            )}

            {(householdType === 'member-child' || householdType === 'member-family') && (
              <div className="qre__panel qre__panel--kids">
                <div className="qre__fields">
                  <label className="qre__field">
                    <span className="qre__label">Children less than 26</span>
                    <input
                      className="qre__input"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g., 2"
                      {...register('dependentsCount', { valueAsNumber: true })}
                    />
                    {errors.dependentsCount ? (
                      <span className="qre__error">{errors.dependentsCount.message}</span>
                    ) : null}
                  </label>
                  <label className="qre__field">
                    <span className="qre__label">Oldest child age *</span>
                    <input
                      className="qre__input"
                      type="number"
                      min={0}
                      max={64}
                      placeholder="e.g., 18"
                      {...register('oldestDependentAge', { valueAsNumber: true })}
                    />
                    {errors.oldestDependentAge ? (
                      <span className="qre__error">{errors.oldestDependentAge.message}</span>
                    ) : null}
                  </label>
                </div>
                <p className="qre__note">We price using the oldest age in the household.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="qre__step">
            <div className="qre__eyebrow">STEP 2 OF 4</div>
            <h3 className="qre__step-title">What matters most?</h3>
            <p className="qre__helper">We'll match you to your best plan</p>
            <p className="qre__helper">
              Tap to select — pick 1–3 that matter most. All plans include $0 virtual care.
            </p>
            <div className="qre__chips">
              {membershipPriorities.map((p) => {
                const selected = selectedPriorities.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`qre__chip${selected ? ' is-selected' : ''}`}
                    onClick={() => togglePriority(p.id)}
                  >
                    {p.shortLabel ?? p.label}
                    {selected ? (
                      <span className="qre__chip-check">
                        <Check size={12} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="qre__note">
              {selectedPriorities.length === 0
                ? 'Select at least one priority'
                : `${selectedPriorities.length} of 3 selected`}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="qre__step">
            <div className="qre__eyebrow">STEP 3 OF 4 — almost there</div>
            <h3 className="qre__step-title">Where should we send your results?</h3>
            <p className="qre__helper">Enter your details to see your personalized rate comparison</p>
            <div className="qre__fields">
              <label className="qre__field">
                <span className="qre__label">First Name</span>
                <input className="qre__input" placeholder="John" {...register('firstName')} />
                {errors.firstName ? <span className="qre__error">{errors.firstName.message}</span> : null}
              </label>
              <label className="qre__field">
                <span className="qre__label">Last Name</span>
                <input className="qre__input" placeholder="Smith" {...register('lastName')} />
                {errors.lastName ? <span className="qre__error">{errors.lastName.message}</span> : null}
              </label>
              <label className="qre__field qre__field--full">
                <span className="qre__label">Email</span>
                <input className="qre__input" type="email" placeholder="your@email.com" {...register('email')} />
                {errors.email ? <span className="qre__error">{errors.email.message}</span> : null}
              </label>
              <label className="qre__field qre__field--full">
                <span className="qre__label">Phone (optional)</span>
                <input className="qre__input" type="tel" placeholder="(555) 123-4567" {...register('phone')} />
              </label>
            </div>
            <div className="qre__privacy">
              <Lock size={14} />
              <span>We'll never spam you. Your info is only used to send your rate comparison.</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="qre__step">
            {isCalculating ? (
              <div className="qre__spinner" aria-label="Calculating" />
            ) : (
              <>
                <div className="qre__success">Your personalized rate comparison is ready.</div>
                {submissionError ? <p className="qre__error">{submissionError}</p> : null}
                {results ? (
                  <div className="qre__compare">
                    Traditional Insurance estimate: {fmtMoney(results.traditionalCost)}/mo
                  </div>
                ) : null}
                {topPlans.map(({ rec, estimate }) => (
                  <div key={rec.planId} className="qre__plan">
                    <div className="qre__badge">Best Match</div>
                    <div style={{ fontWeight: 800, color: '#1256b0' }}>{rec.planName}</div>
                    {estimate ? (
                      <div>
                        From <strong>{fmtMoney(estimate.lowestPrice)}</strong>/mo
                        {results ? (
                          <span className="qre__savings">
                            {' '}
                            · Save {fmtMoney(Math.max(0, results.traditionalCost - estimate.lowestPrice))}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className="qre__tier">{rec.matchPercentage}% match</span>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="qre__btn qre__btn--secondary"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => navigate('/get-started')}
                >
                  View Full Comparison <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {step < 4 ? (
        <div className={`qre__footer${step > 1 ? ' qre__footer--split' : ''}`}>
          {step > 1 ? (
            <button type="button" className="qre__btn qre__btn--ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : null}
          <button
            type="button"
            className="qre__btn qre__btn--primary"
            disabled={
              (step === 1 && !canStep1()) ||
              (step === 2 && selectedPriorities.length < 1) ||
              (step === 3 && isSubmitting)
            }
            onClick={() => void goNext()}
          >
            {step === 3 ? (
              <>
                See My Rates <Sparkles size={16} />
              </>
            ) : (
              <>
                Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
