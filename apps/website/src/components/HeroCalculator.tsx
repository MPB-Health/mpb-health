'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientLogger } from '@mpbhealth/utils';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Calculator, Sparkles, CheckCircle2, X, ArrowLeft, BarChart3 } from 'lucide-react';
import { estimateAllMemberships, AllMembershipsEstimate } from '../lib/newRateEngine';
import { useAnalytics, AnalyticsEvents } from '../lib/analytics';
import { CompactMembershipPrioritySelector } from './CompactMembershipPrioritySelector';
import { AllPlansComparisonTable } from './AllPlansComparisonTable';
import { recommendPlans, PlanRecommendation } from '../lib/membershipPriorities';
import { leadSubmissionService } from '../lib/leadSubmissionService';

const log = createClientLogger('HeroCalculator');

// Simplified schema - no plan selection required upfront
// Uses correct membership types to match pricing: MemberOnly, MemberSpouse, MemberChild, MemberFamily
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
}).refine(
  (data) => {
    // Spouse age required for member-spouse and member-family
    if (data.householdType === 'member-spouse' || data.householdType === 'member-family') {
      return data.spouseAge !== undefined && data.spouseAge >= 18 && data.spouseAge <= 64;
    }
    return true;
  },
  {
    message: 'Spouse age is required',
    path: ['spouseAge'],
  }
).refine(
  (data) => {
    // Dependents required for member-child and member-family
    if (data.householdType === 'member-child' || data.householdType === 'member-family') {
      return data.dependentsCount !== undefined && data.dependentsCount >= 1;
    }
    return true;
  },
  {
    message: 'Number of children is required',
    path: ['dependentsCount'],
  }
);

type HeroCalculatorInput = z.infer<typeof heroCalculatorSchema>;

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// Household types matching actual pricing structure
const householdTypes = [
  { value: 'member-only', label: 'Just Me', icon: '👤', description: 'Individual member' },
  { value: 'member-spouse', label: 'Me + Spouse', icon: '👥', description: 'No children' },
  { value: 'member-child', label: 'Me + Kids', icon: '👨‍👧', description: 'Single parent' },
  { value: 'member-family', label: 'Full Family', icon: '👨‍👩‍👧‍👦', description: 'Spouse + kids' },
];

export default function HeroCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { track } = useAnalytics();

  // New state for all-plans comparison
  const [allPlansEstimate, setAllPlansEstimate] = useState<AllMembershipsEstimate | null>(null);
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [traditionalCost, setTraditionalCost] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset: _reset,
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

  const estimateTraditionalInsurance = (householdType: string, age: number): number => {
    let baseCost = 0;

    switch (householdType) {
      case 'member-only':
        baseCost = 475;
        break;
      case 'member-spouse':
        baseCost = 950;
        break;
      case 'member-child':
        baseCost = 850; // Single parent typically less than couple
        break;
      case 'member-family':
        baseCost = 1350;
        break;
    }

    const ageFactor = age < 30 ? 0.85 : age < 40 ? 1.0 : age < 50 ? 1.2 : age < 60 ? 1.5 : 1.8;
    return Math.round(baseCost * ageFactor);
  };

  const onSubmit = async (data: HeroCalculatorInput) => {
    setIsCalculating(true);
    setIsSubmittingLead(true);
    setSubmissionError(null);
    setShowSuccessMessage(false);

    log.info('Starting form submission with all-plans comparison...');

    try {
      // Calculate estimates for ALL plans at once
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

      log.info('All plans estimates:', allEstimates);
      log.info('Recommendations:', planRecommendations);

      // Build the all_plan_rates object for storage
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

      // Submit the lead with all plan rates
      log.info('Submitting lead with all plan comparisons:', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });

      // Calculate household size based on membership type
      let householdSize = 1; // member-only starts with 1
      if (data.householdType === 'member-spouse') householdSize = 2;
      else if (data.householdType === 'member-child') householdSize = 1 + (data.dependentsCount || 0);
      else if (data.householdType === 'member-family') householdSize = 2 + (data.dependentsCount || 0);

      const submissionResult = await leadSubmissionService.submitLead({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: 'Not provided',
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
          // NEW: All plan rates instead of single plan
          all_plan_rates: allPlanRates,
          priorities_matched: data.membershipPriorities,
          traditional_cost_estimate: traditional,
          best_match_plan: planRecommendations[0]?.planId || null,
          best_match_percentage: planRecommendations[0]?.matchPercentage || 0,
        },
      });

      log.info('Submission result:', submissionResult);

      if (submissionResult.success) {
        log.info('Submission successful!');
        setShowSuccessMessage(true);
        setAllPlansEstimate(allEstimates);
        setRecommendations(planRecommendations);
        setTraditionalCost(traditional);
        setShowResults(true);
        setTimeout(() => setShowSuccessMessage(false), 8000);
      } else {
        console.error('[HeroCalculator] Submission failed:', submissionResult.error);
        setSubmissionError(submissionResult.error || 'Failed to submit your information. Please try again.');
        return;
      }

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
    } catch (error) {
      console.error('[HeroCalculator] Error submitting lead:', error);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsCalculating(false);
      setIsSubmittingLead(false);
    }
  };

  // Handle going back to form from results
  const handleBackToForm = () => {
    setShowResults(false);
    setAllPlansEstimate(null);
    setRecommendations([]);
  };

  // If showing results, display the comparison table
  if (showResults && allPlansEstimate) {
    return (
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Your Plan Comparison</h3>
                <p className="text-white/90 text-xs">Compare all options side-by-side</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackToForm}
              className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              New Quote
            </button>
          </div>
        </div>

        <CardContent className="p-5">
          {showSuccessMessage && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-green-900 mb-1">Success! Your Rates Are Ready</h4>
                  <p className="text-xs text-green-800 leading-relaxed">
                    We've sent your personalized rate comparison to <strong>{watchedEmail}</strong>. 
                    A health advisor will contact you shortly to discuss your options.
                  </p>
                </div>
              </div>
            </div>
          )}

          <AllPlansComparisonTable
            estimates={allPlansEstimate}
            recommendations={recommendations}
            traditionalCostEstimate={traditionalCost}
          />
        </CardContent>
      </Card>
    );
  }

  // Show the input form
  return (
    <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight">Quick Rate Estimate</h3>
            <p className="text-white/90 text-xs">Compare all plans in 30 seconds</p>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Who's Covered?</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {householdTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue('householdType', type.value as any)}
                  className={`
                    p-2 rounded-lg border-2 transition-all text-center
                    ${watchedHouseholdType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="text-lg mb-0.5">{type.icon}</div>
                  <div className="text-[10px] font-semibold text-gray-900">{type.label}</div>
                  <div className="text-[9px] text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="hero-state" className="text-xs font-semibold text-gray-700">State</Label>
              <Select
                id="hero-state"
                {...register('state')}
                className="h-9 text-sm"
              >
                <option value="">Select</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Select>
              {errors.state && (
                <p className="text-[10px] text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-age" className="text-xs font-semibold text-gray-700">Your Age</Label>
              <Input
                id="hero-age"
                type="number"
                min={18}
                max={64}
                placeholder="e.g., 35"
                className="h-9 text-sm"
                {...register('primaryAge', { valueAsNumber: true })}
              />
              {errors.primaryAge && (
                <p className="text-[10px] text-red-600">{errors.primaryAge.message}</p>
              )}
            </div>
          </div>

          {/* Show spouse age for member-spouse and member-family */}
          {(watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                Spouse Details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="hero-spouse-age" className="text-xs font-semibold text-gray-700">Spouse Age *</Label>
                <Input
                  id="hero-spouse-age"
                  type="number"
                  min={18}
                  max={64}
                  placeholder="e.g., 33"
                  className="h-9 text-sm bg-white"
                  {...register('spouseAge', { valueAsNumber: true })}
                />
                {errors.spouseAge && (
                  <p className="text-[10px] text-red-600">{errors.spouseAge.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Show children count for member-child and member-family */}
          {(watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">
                Children Details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="hero-dependents" className="text-xs font-semibold text-gray-700"># of Children (under 26) *</Label>
                <Input
                  id="hero-dependents"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="e.g., 2"
                  className="h-9 text-sm bg-white"
                  {...register('dependentsCount', { valueAsNumber: true })}
                />
                {errors.dependentsCount && (
                  <p className="text-[10px] text-red-600">{errors.dependentsCount.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">What's Most Important to You?</Label>
            <CompactMembershipPrioritySelector
              selectedPriorities={selectedPriorities}
              onChange={(priorities) => {
                setSelectedPriorities(priorities);
                setValue('membershipPriorities', priorities);
              }}
            />
            {errors.membershipPriorities && (
              <p className="text-[10px] text-red-600">{errors.membershipPriorities.message}</p>
            )}
          </div>

          {/* Name and Email - Always visible now (no plan selection needed) */}
          {selectedPriorities.length > 0 && (
            <>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Enter your details to see rates for <strong>all plans</strong></span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-first-name" className="text-xs font-semibold text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="hero-first-name"
                    type="text"
                    placeholder="John"
                    className="h-9 text-sm"
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-[10px] text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hero-last-name" className="text-xs font-semibold text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="hero-last-name"
                    type="text"
                    placeholder="Smith"
                    className="h-9 text-sm"
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-[10px] text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="hero-email" className="text-xs font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="hero-email"
                  type="email"
                  placeholder="your@email.com"
                  className="h-9 text-sm"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-600">{errors.email.message}</p>
                )}
                <p className="text-[9px] text-gray-500 leading-relaxed">
                  We'll send your personalized rate comparison to this email
                </p>
              </div>
            </>
          )}

          {submissionError && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-start gap-2">
                <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 mb-1">Submission Failed</h4>
                  <p className="text-xs text-red-800 leading-relaxed mb-2">
                    {submissionError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmissionError(null)}
                    className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isCalculating ||
              isSubmittingLead ||
              !watchedState ||
              !watchedAge ||
              ((watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && !watchedSpouseAge) ||
              ((watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && !watchedDependentsCount) ||
              !watchedPriorities ||
              watchedPriorities.length === 0 ||
              !watchedFirstName ||
              !watchedLastName ||
              !watchedEmail
            }
          >
            {isCalculating || isSubmittingLead ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isSubmittingLead ? 'Getting Your Rates...' : 'Calculating...'}
              </div>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare All Plans
              </>
            )}
          </Button>

          {/* Validation helper - show what's missing */}
          {(() => {
            const missingFields: string[] = [];
            if (!watchedState) missingFields.push('State');
            if (!watchedAge) missingFields.push('Your Age');
            if ((watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && !watchedSpouseAge) {
              missingFields.push('Spouse Age');
            }
            if ((watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && !watchedDependentsCount) {
              missingFields.push('# of Children');
            }
            if (!watchedPriorities || watchedPriorities.length === 0) {
              missingFields.push('Priorities');
            }
            if (selectedPriorities.length > 0) {
              if (!watchedFirstName) missingFields.push('First Name');
              if (!watchedLastName) missingFields.push('Last Name');
              if (!watchedEmail) missingFields.push('Email');
            }

            if (missingFields.length === 0) return null;

            return (
              <div className="text-center">
                <p className="text-[10px] text-amber-600 font-medium">
                  {missingFields.length === 1
                    ? `Please enter: ${missingFields[0]}`
                    : `Missing: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? ` +${missingFields.length - 3} more` : ''}`}
                </p>
              </div>
            );
          })()}
        </form>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 text-center leading-relaxed">
            Estimates are informational only. Not insurance. Final rates determined during enrollment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
