'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/Card';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Badge } from './ui/Badge';
import {
  Calculator,
  Info,
  ArrowRight,
  Users,
  TrendingDown,
  CheckCircle2,
  Building2,
  Clock,
  Shield,
  Briefcase
} from 'lucide-react';
import {
  businessRateCalculatorSchema,
  BusinessRateCalculatorInput,
  BusinessRateEstimate,
} from '../lib/schema';
import { estimateBusinessMonthly } from '../lib/businessPricingService';
import { getBenefitTiersForPlan } from '../lib/newRateEngine';
import { useAnalytics, AnalyticsEvents } from '../lib/analytics';
import { fmtMoney } from '../lib/utils';
import { typography } from '../lib/typography';

let calculationTimeout: NodeJS.Timeout | number | undefined;

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const businessTypes = [
  { value: 'sole-proprietor', label: 'Sole Proprietor', icon: '👤' },
  { value: 'llc', label: 'LLC', icon: '🏢' },
  { value: 'corporation', label: 'Corporation', icon: '🏛️' },
  { value: 'partnership', label: 'Partnership', icon: '🤝' },
];

const plans = [
  { value: 'mec-essentials', label: 'MEC+ Essentials', description: 'ACA compliant, cost-effective', icon: Shield },
  { value: 'secure-hsa', label: 'Secure HSA', description: 'HSA-compatible, tax advantages', icon: TrendingDown },
];

// Household types matching actual pricing structure
const householdTypes = [
  { value: 'member-only', label: 'Just Me', icon: '👤', description: 'Individual' },
  { value: 'member-spouse', label: 'Me + Spouse', icon: '👥', description: 'No children' },
  { value: 'member-child', label: 'Me + Kids', icon: '👨‍👧', description: 'Single parent' },
  { value: 'member-family', label: 'Full Family', icon: '👨‍👩‍👧‍👦', description: 'Spouse + kids' },
];

export default function BusinessRateCalculator() {
  const [estimate, setEstimate] = useState<BusinessRateEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { track } = useAnalytics();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessRateCalculatorInput>({
    resolver: zodResolver(businessRateCalculatorSchema) as any,
    defaultValues: {
      businessType: 'sole-proprietor',
      householdType: 'member-only',
      employeeCount: 1,
      dependentsCount: 0,
      primaryTobacco: false,
      spouseTobacco: false,
      selectedPlan: 'mec-essentials',
    },
  });

  const watchedBusinessType = watch('businessType');
  const watchedHouseholdType = watch('householdType');
  const watchedState = watch('state');
  const watchedPrimaryAge = watch('primaryAge');
  const watchedEmployeeCount = watch('employeeCount');
  const watchedSelectedPlan = watch('selectedPlan');
  const watchedBenefitTier = watch('benefitTier');

  useEffect(() => {
    let filledFields = 0;
    // Calculate total fields based on membership type
    const needsSpouse = watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family';
    const needsChildren = watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family';
    let totalFields = 5; // state, businessType, employeeCount, primaryAge, selectedPlan always required
    if (needsSpouse) totalFields++;
    if (needsChildren) totalFields++;

    if (watchedState) filledFields++;
    if (watchedBusinessType) filledFields++;
    if (watchedEmployeeCount) filledFields++;
    if (watchedPrimaryAge) filledFields++;
    if (watchedSelectedPlan) filledFields++;
    if (needsSpouse && watch('spouseAge')) filledFields++;
    if (needsChildren && watch('dependentsCount') >= 1) filledFields++;

    setProgress((filledFields / totalFields) * 100);
  }, [watchedState, watchedBusinessType, watchedEmployeeCount, watchedPrimaryAge, watchedSelectedPlan, watchedHouseholdType, watch]);

  const onSubmit = (data: BusinessRateCalculatorInput): void => {
    setIsCalculating(true);

    if (calculationTimeout != null) {
      clearTimeout(calculationTimeout);
    }

    calculationTimeout = setTimeout(() => {
      const result = estimateBusinessMonthly(data);
      setEstimate(result);
      setIsCalculating(false);
      calculationTimeout = undefined;

      track({
        event: AnalyticsEvents.CALCULATE_RATE,
        category: 'business_calculator',
        label: data.selectedPlan,
        value: result.totalBusinessCost,
        custom_parameters: {
          business_type: data.businessType,
          employee_count: data.employeeCount,
          household_type: data.householdType,
          state: data.state,
          primary_age: data.primaryAge,
          per_employee_cost: result.perEmployeeCost,
          total_business_cost: result.totalBusinessCost,
        },
      });
    }, 800);
  };

  const handleConsultationClick = () => {
    track({
      event: AnalyticsEvents.CONSULTATION_REQUEST,
      category: 'business_calculator',
      label: 'result_cta',
    });
    window.location.href = 'tel:8558164650';
  };

  return (
    <section
      id="business-calculator"
      className="relative py-24 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg border border-blue-100">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-blue-600 font-semibold tracking-wide">BUSINESS RATE CALCULATOR</span>
          </div>
          <h2 className={`${typography.headings.h1.hero} text-gray-900 mb-6`}>
            Calculate Your Business Healthcare Costs
          </h2>
          <p className={`${typography.body.large} text-gray-600 max-w-3xl mx-auto`}>
            Get an estimate for your small business or 1099 team in just 60 seconds.
            <span className="block mt-2 text-lg font-medium text-blue-600">Compare MEC+ Essentials and Secure HSA plans.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">ACA Compliant Options</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Takes 60 Seconds</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-cyan-600" />
              <span className="font-medium">Tax Advantages Available</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-3 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`${typography.headings.h3.card} text-gray-900 mb-1`}>
                    Business Information
                  </CardTitle>
                  <CardDescription className="text-base">
                    Provide details for an accurate business estimate
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 font-medium mb-1">Progress</div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Business Type *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('businessType', type.value as any)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200
                          ${watchedBusinessType === type.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <div className="text-xs font-medium text-gray-900">{type.label}</div>
                        {watchedBusinessType === type.value && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.businessType && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {errors.businessType.message}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount" className="text-base font-semibold text-gray-900">Number of Memberships *</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="e.g., 5"
                      className="h-12 text-base"
                      {...register('employeeCount', { valueAsNumber: true })}
                    />
                    {errors.employeeCount && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {errors.employeeCount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-base font-semibold text-gray-900">State *</Label>
                    <Select
                      id="state"
                      {...register('state')}
                      className="h-12 text-base"
                    >
                      <option value="">Select state</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Who's Covered? (Per Membership) *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {householdTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('householdType', type.value as any)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200
                          ${watchedHouseholdType === type.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-xs font-semibold text-gray-900">{type.label}</div>
                        <div className="text-[10px] text-gray-500">{type.description}</div>
                        {watchedHouseholdType === type.value && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.householdType && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {errors.householdType.message}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryAge" className="text-base font-semibold text-gray-900">Member Age *</Label>
                    <Input
                      id="primaryAge"
                      type="number"
                      min={18}
                      max={64}
                      placeholder="e.g., 35"
                      className="h-12 text-base"
                      {...register('primaryAge', { valueAsNumber: true })}
                    />
                    {errors.primaryAge && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {errors.primaryAge.message}
                      </p>
                    )}
                  </div>

                  {/* Show spouse age for member-spouse and member-family */}
                  {(watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <Label htmlFor="spouseAge" className="text-base font-semibold text-gray-900">
                        Spouse Age *
                      </Label>
                      <Input
                        id="spouseAge"
                        type="number"
                        min={18}
                        max={64}
                        placeholder="e.g., 32"
                        className="h-12 text-base"
                        {...register('spouseAge', { valueAsNumber: true })}
                      />
                      {errors.spouseAge && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          {errors.spouseAge.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Show children count for member-child and member-family */}
                {(watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && (
                  <div className="space-y-2 p-4 bg-green-50 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Children Details</p>
                    <Label htmlFor="dependentsCount" className="text-base font-semibold text-gray-900">
                      Number of Children (under 26) *
                    </Label>
                    <Input
                      id="dependentsCount"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g., 2"
                      className="h-12 text-base bg-white"
                      {...register('dependentsCount', { valueAsNumber: true })}
                    />
                    {errors.dependentsCount && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {errors.dependentsCount.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Tobacco Use</Label>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="primaryTobacco"
                        {...register('primaryTobacco')}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="primaryTobacco" className="text-sm font-medium cursor-pointer">
                        Any tobacco users
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Select Plan *</Label>
                  <div className="grid gap-4">
                    {plans.map((plan) => {
                      const Icon = plan.icon;
                      return (
                        <button
                          key={plan.value}
                          type="button"
                          onClick={() => {
                            setValue('selectedPlan', plan.value as any);
                            if (plan.value === 'secure-hsa') {
                              const tiers = getBenefitTiersForPlan(plan.value);
                              if (tiers.length > 0) {
                                setValue('benefitTier', tiers[0].id);
                              }
                            } else {
                              setValue('benefitTier', undefined);
                            }
                          }}
                          className={`
                            relative p-5 rounded-xl border-2 transition-all duration-200 text-left
                            ${watchedSelectedPlan === plan.value
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${watchedSelectedPlan === plan.value ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Icon className={`h-6 w-6 ${watchedSelectedPlan === plan.value ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-lg mb-1">{plan.label}</div>
                                <div className="text-sm text-gray-600">{plan.description}</div>
                              </div>
                            </div>
                            {watchedSelectedPlan === plan.value && (
                              <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.selectedPlan && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {errors.selectedPlan.message}
                    </p>
                  )}
                </div>

                {watchedSelectedPlan === 'secure-hsa' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <Label className="text-base font-semibold text-gray-900">
                      Benefit Tier (IUA Level) *
                    </Label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900">
                          <strong>IUA (Initial Unshareable Amount)</strong> is similar to a deductible. Lower IUA means higher monthly cost but less out-of-pocket before sharing begins.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {getBenefitTiersForPlan('secure-hsa').map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setValue('benefitTier', tier.id)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${watchedBenefitTier === tier.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">{tier.displayLabel}</div>
                              {tier.iua && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Initial Unshareable Amount: {tier.iua}
                                </div>
                              )}
                            </div>
                            {watchedBenefitTier === tier.id && (
                              <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.benefitTier && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                        <Info className="h-4 w-4" />
                        {errors.benefitTier.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentMonthly" className="text-base font-semibold text-gray-900">
                    Current Monthly Business Cost (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">
                      $
                    </span>
                    <Input
                      id="currentMonthly"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g., 3000"
                      className="pl-10 h-12 text-base text-right"
                      {...register('currentMonthly', {
                        valueAsNumber: true,
                        setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                      })}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    We'll show you how much your business could save
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Calculating...
                    </div>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-6 w-6" />
                      Calculate Rate
                      <ArrowRight className="ml-2 h-6 w-6" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {estimate ? (
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-3xl" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`${typography.headings.h3.card} text-gray-900 mb-1`}>
                        Your Business Estimate
                      </CardTitle>
                      <CardDescription className="text-base">Monthly cost for {estimate.employeeCount} {estimate.employeeCount === 1 ? 'membership' : 'memberships'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div className="text-center py-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-inner border border-white/50">
                    <div className={`${typography.display.hero} ${typography.gradients.success} mb-3`}>
                      {fmtMoney(estimate.totalBusinessCost)}
                    </div>
                    <div className="text-lg text-gray-600 font-medium">per month total</div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 px-4 py-1 text-sm font-semibold">
                        {fmtMoney(estimate.perEmployeeCost)} per membership
                      </Badge>
                    </div>
                  </div>

                  {estimate.comparison && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                      {estimate.comparison.direction === 'savings' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 justify-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <TrendingDown className="h-5 w-5 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-green-600">
                              Business Savings!
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center bg-green-50 rounded-xl p-4">
                              <div className="text-3xl font-bold text-green-600 mb-1">
                                {fmtMoney(estimate.comparison.deltaMonthly)}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">
                                Per Month
                              </div>
                            </div>
                            <div className="text-center bg-green-50 rounded-xl p-4">
                              <div className="text-3xl font-bold text-green-600 mb-1">
                                {fmtMoney(estimate.comparison.deltaAnnual)}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">
                                Per Year
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Cost Breakdown
                    </h4>
                    <div className="space-y-3">
                      {estimate.lineItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                        >
                          <span className="text-gray-700 text-sm font-medium">
                            {item.description}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {fmtMoney(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Ready to Get Started?</h4>
                        <p className="text-sm text-gray-600">Request your personalized business quote</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                        asChild
                      >
                        <a
                          href={`/get-a-quote?plan=${watchedSelectedPlan}&type=business`}
                        >
                          <ArrowRight className="mr-2 h-5 w-5" />
                          Get Your Quote
                        </a>
                      </Button>
                      <Button
                        className="w-full h-12 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                        onClick={handleConsultationClick}
                      >
                        <Users className="mr-2 h-5 w-5" />
                        Call (855) 816-4650
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className={`${typography.headings.h3.card} text-gray-900 mb-3`}>
                    Ready to Calculate?
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                    Fill out the form to see your personalized business rate estimate
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <Info className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      <strong className="font-bold">Important:</strong>{' '}
                      {estimate?.disclaimer ||
                        'Estimates are informational and not insurance. Final sharing levels and eligibility are determined during enrollment. This is not a binding quote.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
