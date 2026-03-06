'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientLogger } from '@mpbhealth/utils';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import {
  Calculator,
  Sparkles,
  X,
  ArrowLeft,
  ArrowRight,
  Shield,
  Users,
  Lock,
} from 'lucide-react';
import { estimateAllMemberships } from '../lib/newRateEngine';
import { useAnalytics, AnalyticsEvents } from '../lib/analytics';
import { CompactMembershipPrioritySelector } from './CompactMembershipPrioritySelector';
import { recommendPlans } from '../lib/membershipPriorities';
import { leadSubmissionService } from '../lib/leadSubmissionService';
import { cn, fmtMoney } from '../lib/utils';

const log = createClientLogger('HeroCalculator');

const heroCalculatorSchema = z.object({
  householdType: z.enum(['member-only', 'member-spouse', 'member-child', 'member-family']),
  state: z.string().min(2, 'State is required'),
  primaryAge: z.number().min(18, 'Age must be 18+').max(64, 'Age must be under 65'),
  spouseAge: z.number().min(18, 'Spouse age must be 18+').max(64, 'Spouse age must be under 65').optional(),
  dependentsCount: z.number().min(0).max(10).optional(),
  membershipPriorities: z.array(z.string()).min(1, 'Select at least one membership priority'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
}).refine(
  (data) => {
    if (data.householdType === 'member-spouse' || data.householdType === 'member-family') {
      return data.spouseAge !== undefined && data.spouseAge >= 18 && data.spouseAge <= 64;
    }
    return true;
  },
  { message: 'Spouse age is required', path: ['spouseAge'] }
).refine(
  (data) => {
    if (data.householdType === 'member-child' || data.householdType === 'member-family') {
      return data.dependentsCount !== undefined && data.dependentsCount >= 1;
    }
    return true;
  },
  { message: 'Number of children is required', path: ['dependentsCount'] }
);

type HeroCalculatorInput = z.infer<typeof heroCalculatorSchema>;

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WV', 'WI', 'WY',
];

const householdTypes = [
  { value: 'member-only', label: 'Just Me', icon: '👤', description: 'Individual' },
  { value: 'member-spouse', label: 'Me + Spouse', icon: '👥', description: 'No children' },
  { value: 'member-child', label: 'Me + Kids', icon: '👨‍👧', description: 'Single parent' },
  { value: 'member-family', label: 'Full Family', icon: '👨‍👩‍👧‍👦', description: 'Spouse + kids' },
];

const TOTAL_STEPS = 3;

export default function HeroCalculator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { track } = useAnalytics();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<HeroCalculatorInput>({
    resolver: zodResolver(heroCalculatorSchema),
    mode: 'onChange',
    defaultValues: {
      householdType: 'member-only',
      membershipPriorities: [],
    },
  });

  const watchedHouseholdType = watch('householdType');
  const watchedPriorities = watch('membershipPriorities');
  const watchedState = watch('state');
  const watchedAge = watch('primaryAge');
  const watchedSpouseAge = watch('spouseAge');
  const watchedDependentsCount = watch('dependentsCount');
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');

  const estimateTraditionalInsurance = (householdType: string, age: number): number => {
    const baseCost = { 'member-only': 475, 'member-spouse': 950, 'member-child': 850, 'member-family': 1350 }[householdType] ?? 475;
    const ageFactor = age < 30 ? 0.85 : age < 40 ? 1.0 : age < 50 ? 1.2 : age < 60 ? 1.5 : 1.8;
    return Math.round(baseCost * ageFactor);
  };

  const canProceedStep1 = () => {
    if (!watchedState || !watchedAge) return false;
    if (watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') {
      return watchedSpouseAge !== undefined && watchedSpouseAge >= 18 && watchedSpouseAge <= 64;
    }
    if (watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') {
      return watchedDependentsCount !== undefined && watchedDependentsCount >= 1;
    }
    return true;
  };

  const canProceedStep2 = () => selectedPriorities.length > 0;

  // Pre-fill form when returning from "Edit your quote"
  useEffect(() => {
    const state = location.state as { editQuote?: boolean; formData?: Record<string, unknown> } | undefined;
    if (state?.editQuote && state?.formData) {
      const fd = state.formData;
      reset({
        householdType: (fd.householdType as HeroCalculatorInput['householdType']) ?? 'member-only',
        state: (fd.state as string) ?? '',
        primaryAge: (fd.primaryAge as number) ?? 18,
        spouseAge: fd.spouseAge as number | undefined,
        dependentsCount: fd.dependentsCount as number | undefined,
        membershipPriorities: (fd.membershipPriorities as string[]) ?? [],
        firstName: (fd.firstName as string) ?? '',
        lastName: (fd.lastName as string) ?? '',
        email: (fd.email as string) ?? '',
        phone: fd.phone as string | undefined,
      });
      setSelectedPriorities((fd.membershipPriorities as string[]) ?? []);
      setStep(3);
    }
  }, [location.state, reset]);

  const handleNextStep = async () => {
    if (step === 1) {
      const fields: (keyof HeroCalculatorInput)[] = ['state', 'primaryAge'];
      if (watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') fields.push('spouseAge');
      if (watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') fields.push('dependentsCount');
      const valid = await trigger(fields);
      if (valid && canProceedStep1()) setStep(2);
    } else if (step === 2 && canProceedStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => setStep(Math.max(1, step - 1));

  const onSubmit = async (data: HeroCalculatorInput) => {
    setIsCalculating(true);
    setIsSubmittingLead(true);
    setSubmissionError(null);

    try {
      const comparisonInput = {
        householdType: data.householdType,
        state: data.state,
        primaryAge: data.primaryAge,
        spouseAge: data.spouseAge ?? null,
        dependentsCount: data.dependentsCount || 0,
        primaryTobacco: false,
        spouseTobacco: false,
        currentMonthly: undefined,
      };

      const allEstimates = estimateAllMemberships(comparisonInput);
      const planRecommendations = recommendPlans(data.membershipPriorities || []);
      const traditional = estimateTraditionalInsurance(data.householdType, data.primaryAge);

      const allPlanRates: Record<string, any> = {};
      allEstimates.plans.forEach(plan => {
        allPlanRates[plan.planId] = {
          planLabel: plan.planLabel,
          lowestPrice: plan.lowestPrice,
          highestPrice: plan.highestPrice,
          flatRate: plan.flatRate,
          tiers: plan.tiers,
        };
      });

      let householdSize = 1;
      if (data.householdType === 'member-spouse') householdSize = 2;
      else if (data.householdType === 'member-child') householdSize = 1 + (data.dependentsCount || 0);
      else if (data.householdType === 'member-family') householdSize = 2 + (data.dependentsCount || 0);

      const submissionResult = await leadSubmissionService.submitLead({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone?.trim() || 'Not provided',
        householdSize,
        zipCode: '',
        sourcePage: window.location.pathname,
        sourceCTA: 'hero-calculator-all-plans-comparison',
        formData: {
          lead_type: 'Quick Rate Estimate Leads',
          household_type: data.householdType,
          state: data.state,
          primary_age: data.primaryAge,
          spouse_age: data.spouseAge,
          dependents_count: data.dependentsCount,
          membership_priorities: data.membershipPriorities,
          all_plan_rates: allPlanRates,
          priorities_matched: data.membershipPriorities,
          traditional_cost_estimate: traditional,
          best_match_plan: planRecommendations[0]?.planId || null,
          best_match_percentage: planRecommendations[0]?.matchPercentage || 0,
        },
      });

      track({
        event: AnalyticsEvents.CALCULATE_RATE,
        category: 'hero-calculator',
        label: 'all-plans-comparison',
        value: allEstimates.plans.length,
        custom_parameters: {
          household_type: data.householdType,
          state: data.state,
          primary_age: data.primaryAge,
          membership_priorities: data.membershipPriorities?.join(',') || '',
          traditional_cost: traditional,
          plans_shown: allEstimates.plans.map(p => p.planId).join(','),
          best_match: planRecommendations[0]?.planId || 'none',
          email_captured: true,
        },
      });

      navigate('/quote/results', {
        replace: true,
        state: {
          estimates: allEstimates,
          recommendations: planRecommendations,
          traditionalCost: traditional,
          email: data.email,
          submissionSuccess: submissionResult.success,
          submissionError: submissionResult.success
            ? undefined
            : submissionResult.error || 'We couldn\'t save your info. Your comparison is below — please reach out or try again.',
          formData: {
            householdType: data.householdType,
            state: data.state,
            primaryAge: data.primaryAge,
            spouseAge: data.spouseAge,
            dependentsCount: data.dependentsCount,
            membershipPriorities: data.membershipPriorities || [],
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
          },
        },
      });
    } catch (error) {
      console.error('[HeroCalculator] Error:', error);
      setSubmissionError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsCalculating(false);
      setIsSubmittingLead(false);
    }
  };

  return (
    <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden max-w-lg mx-auto">
      {/* Header with trust signals */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 px-5 py-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Quick Rate Estimate</h3>
            <p className="text-white/90 text-sm">Compare all plans in 30 seconds</p>
          </div>
        </div>
        <div className="relative mt-3 flex items-center gap-4 text-white/90 text-xs">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            50,000+ families
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Secure & private
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Household & location */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 1 of 3</p>
                <h4 className="text-base font-bold text-gray-900">Who&apos;s covered?</h4>
                <p className="text-sm text-gray-500 mt-0.5">Tell us about your household</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {householdTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('householdType', type.value as any)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-center min-h-[72px] flex flex-col items-center justify-center',
                      watchedHouseholdType === type.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="text-xs font-semibold text-gray-900">{type.label}</span>
                    <span className="text-[10px] text-gray-500">{type.description}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-state" className="text-sm font-semibold text-gray-700">State</Label>
                  <Select id="hero-state" {...register('state')} className="h-11 text-sm">
                    <option value="">Select</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  {errors.state && <p className="text-xs text-red-600">{errors.state.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-age" className="text-sm font-semibold text-gray-700">Your Age</Label>
                  <Input
                    id="hero-age"
                    type="number"
                    min={18}
                    max={64}
                    placeholder="e.g., 35"
                    className="h-11 text-sm"
                    {...register('primaryAge', { valueAsNumber: true })}
                  />
                  {errors.primaryAge && <p className="text-xs text-red-600">{errors.primaryAge.message}</p>}
                </div>
              </div>

              {(watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in duration-200">
                  <Label htmlFor="hero-spouse-age" className="text-sm font-semibold text-gray-700">Spouse Age</Label>
                  <Input
                    id="hero-spouse-age"
                    type="number"
                    min={18}
                    max={64}
                    placeholder="e.g., 33"
                    className="h-11 text-sm bg-white mt-1.5"
                    {...register('spouseAge', { valueAsNumber: true })}
                  />
                  {errors.spouseAge && <p className="text-xs text-red-600 mt-1">{errors.spouseAge.message}</p>}
                </div>
              )}

              {(watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in duration-200">
                  <Label htmlFor="hero-dependents" className="text-sm font-semibold text-gray-700"># of Children (under 26)</Label>
                  <Input
                    id="hero-dependents"
                    type="number"
                    min={1}
                    max={10}
                    placeholder="e.g., 2"
                    className="h-11 text-sm bg-white mt-1.5"
                    {...register('dependentsCount', { valueAsNumber: true })}
                  />
                  {errors.dependentsCount && <p className="text-xs text-red-600 mt-1">{errors.dependentsCount.message}</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Priorities */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 3</p>
                <h4 className="text-base font-bold text-gray-900">What matters most?</h4>
                <p className="text-sm text-gray-500 mt-0.5">We&apos;ll match you to the best plan</p>
              </div>

              <CompactMembershipPrioritySelector
                selectedPriorities={selectedPriorities}
                onChange={(p) => {
                  setSelectedPriorities(p);
                  setValue('membershipPriorities', p);
                }}
                className=""
              />
              {errors.membershipPriorities && (
                <p className="text-xs text-red-600">{errors.membershipPriorities.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 3 of 3</p>
                <h4 className="text-base font-bold text-gray-900">Get your personalized comparison</h4>
                <p className="text-sm text-gray-500 mt-0.5">A health advisor will send your results and reach out to discuss options</p>
              </div>

              {/* Savings preview */}
              {canProceedStep1() && watchedState && watchedAge && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl border-2 border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-900">Your estimated savings</p>
                  <p className="text-emerald-800 mt-1 text-sm">
                    Families like yours typically save{' '}
                    <strong>{fmtMoney(Math.round(estimateTraditionalInsurance(watchedHouseholdType, watchedAge) * 0.4))}–{fmtMoney(Math.round(estimateTraditionalInsurance(watchedHouseholdType, watchedAge) * 0.6))}</strong>
                    {' '}/mo vs traditional insurance
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-first-name" className="text-sm font-semibold text-gray-700">First Name</Label>
                  <Input id="hero-first-name" type="text" placeholder="John" className="h-11 text-sm" {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-last-name" className="text-sm font-semibold text-gray-700">Last Name</Label>
                  <Input id="hero-last-name" type="text" placeholder="Smith" className="h-11 text-sm" {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input id="hero-email" type="email" placeholder="your@email.com" className="h-11 text-sm" {...register('email')} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                <p className="text-xs text-gray-500">We&apos;ll send your comparison here</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Label htmlFor="hero-phone" className="text-sm font-semibold text-gray-700">
                  Phone <span className="font-normal text-gray-500">(optional)</span>
                </Label>
                <Input
                  id="hero-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="h-11 text-sm bg-white mt-1.5"
                  {...register('phone')}
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  A healthcare advisor will call to see if the plan fits you and walk you through your options.
                </p>
              </div>
            </div>
          )}

          {submissionError && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
              <X className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Submission failed</p>
                <p className="text-xs text-red-800">{submissionError}</p>
                <button type="button" onClick={() => setSubmissionError(null)} className="text-xs font-semibold text-red-700 underline mt-1">
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1 h-11">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : null}
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (step === 1 && !canProceedStep1()) ||
                  (step === 2 && !canProceedStep2())
                }
                className={cn('flex-1 h-11', step === 1 ? '' : 'flex-[2]')}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  isCalculating ||
                  isSubmittingLead ||
                  !watchedFirstName ||
                  !watchedLastName ||
                  !watchedEmail
                }
                className="flex-[2] h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isCalculating || isSubmittingLead ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Getting your comparison...
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get My Comparison
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <Lock className="h-3 w-3" />
          Estimates are informational only. Not insurance. Your info is secure.
        </div>
      </CardContent>
    </Card>
  );
}
