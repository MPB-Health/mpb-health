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
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Calculator, Info, ArrowRight, CheckCircle2, Clock, Shield, LayoutGrid } from 'lucide-react';
import {
  comparisonCalculatorSchema,
  ComparisonCalculatorInput,
} from '../lib/schema';
import { estimateAllMemberships, AllMembershipsEstimate } from '../lib/newRateEngine';
import { useAnalytics, AnalyticsEvents } from '../lib/analytics';
import { typography } from '../lib/typography';
import MembershipComparisonGrid from './blocks/MembershipComparisonGrid';

let calculationTimeout: NodeJS.Timeout | number | undefined;

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

export default function RateCalculator() {
  const [allEstimates, setAllEstimates] = useState<AllMembershipsEstimate | null>(null);
  const [currentMonthly, setCurrentMonthly] = useState<number | undefined>(undefined);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { track } = useAnalytics();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComparisonCalculatorInput>({
    resolver: zodResolver(comparisonCalculatorSchema),
    defaultValues: {
      householdType: 'member-only',
      dependentsCount: 0,
      primaryTobacco: false,
      spouseTobacco: false,
    },
  });

  const watchedHouseholdType = watch('householdType');
  const watchedState = watch('state');
  const watchedPrimaryAge = watch('primaryAge');

  useEffect(() => {
    let filledFields = 0;
    // Calculate total fields based on membership type
    const needsSpouse = watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family';
    const needsChildren = watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family';
    let totalFields = 2; // state + primaryAge always required
    if (needsSpouse) totalFields++;
    if (needsChildren) totalFields++;

    if (watchedState) filledFields++;
    if (watchedPrimaryAge) filledFields++;
    if (needsSpouse && watch('spouseAge')) filledFields++;
    if (needsChildren && watch('dependentsCount') >= 1) filledFields++;

    setProgress((filledFields / totalFields) * 100);
  }, [watchedState, watchedPrimaryAge, watchedHouseholdType, watch]);

  const onSubmit = (data: ComparisonCalculatorInput) => {
    setIsCalculating(true);
    setCurrentMonthly(data.currentMonthly ?? undefined);

    if (calculationTimeout != null) {
      clearTimeout(calculationTimeout);
    }

    calculationTimeout = setTimeout(() => {
      const result = estimateAllMemberships(data);
      setAllEstimates(result);
      setIsCalculating(false);
      calculationTimeout = undefined;

      // Track analytics for all calculated plans
      const lowestPrice = Math.min(...result.plans.map(p => p.lowestPrice));
      track({
        event: AnalyticsEvents.CALCULATE_RATE,
        category: 'calculator',
        label: 'all_memberships',
        value: lowestPrice,
        custom_parameters: {
          household_type: data.householdType,
          state: data.state,
          primary_age: data.primaryAge,
          dependents: data.dependentsCount,
          currentMonthly: data.currentMonthly ?? null,
          plans_calculated: result.plans.length,
          lowest_price: lowestPrice,
        },
      });
    }, 800);
  };

  const handleRecalculate = () => {
    setAllEstimates(null);
    setCurrentMonthly(undefined);
  };

  return (
    <section
      id="calculator"
      className="relative py-12 md:py-16 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/40 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-4 shadow-sm">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 font-medium text-sm">MEMBERSHIP COMPARISON</span>
          </div>
          <h2 className={`${typography.headings.h2.section} text-gray-900 mb-3`}>
            Compare All Memberships at Once
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-5">
            Enter your information once and see personalized pricing for all available memberships. No need to fill out multiple forms.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="h-4 w-4 text-blue-600" />
              <span>All Options in One View</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>60 Seconds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600" />
              <span>No Personal Info Required</span>
            </div>
          </div>
        </div>

        {/* Show results or form based on state */}
        {allEstimates ? (
          <div className="space-y-6">
            {/* Results Header with Recalculate */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600">
                  Showing rates for <span className="font-semibold">{allEstimates.inputSummary.householdType}</span> coverage, 
                  age <span className="font-semibold">{allEstimates.inputSummary.primaryAge}</span>
                  {allEstimates.inputSummary.spouseAge && <>, spouse age <span className="font-semibold">{allEstimates.inputSummary.spouseAge}</span></>}
                  {allEstimates.inputSummary.dependentsCount > 0 && <>, <span className="font-semibold">{allEstimates.inputSummary.dependentsCount}</span> dependents</>}
                  {' '}in <span className="font-semibold">{allEstimates.inputSummary.state}</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRecalculate}
                className="whitespace-nowrap"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Change Details
              </Button>
            </div>

            {/* Comparison Grid */}
            <MembershipComparisonGrid
              estimates={allEstimates}
              currentMonthly={currentMonthly}
            />

            {/* Disclaimer */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <strong className="font-semibold">Important:</strong>{' '}
                      Estimates are informational and not insurance. Final sharing levels and eligibility are determined during enrollment. This is not a binding quote.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`${typography.headings.h4.default} text-gray-900 mb-0.5`}>
                    Your Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                      We'll show you pricing for all memberships
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 font-medium mb-1">Progress</div>
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Who's Covered? *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {householdTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('householdType', type.value as any)}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all duration-200
                          ${watchedHouseholdType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-xs font-semibold text-gray-900">{type.label}</div>
                        <div className="text-[10px] text-gray-500">{type.description}</div>
                        {watchedHouseholdType === type.value && (
                          <div className="absolute top-1.5 right-1.5">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-900">State *</Label>
                    <Select
                      id="state"
                      {...register('state')}
                      className="h-10 text-sm"
                    >
                      <option value="">Select your state</option>
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

                  <div className="space-y-2">
                    <Label htmlFor="primaryAge" className="text-sm font-medium text-gray-900">Your Age *</Label>
                    <Input
                      id="primaryAge"
                      type="number"
                      min={18}
                      max={64}
                      placeholder="e.g., 35"
                      className="h-10 text-sm"
                      {...register('primaryAge', { valueAsNumber: true })}
                    />
                    {errors.primaryAge && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {errors.primaryAge.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Show spouse age for member-spouse and member-family */}
                {(watchedHouseholdType === 'member-spouse' || watchedHouseholdType === 'member-family') && (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Spouse Details</p>
                    <Label htmlFor="spouseAge" className="text-sm font-medium text-gray-900">
                      Spouse Age *
                    </Label>
                    <Input
                      id="spouseAge"
                      type="number"
                      min={18}
                      max={64}
                      placeholder="e.g., 32"
                      className="h-10 text-sm bg-white"
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

                {/* Show children count for member-child and member-family */}
                {(watchedHouseholdType === 'member-child' || watchedHouseholdType === 'member-family') && (
                  <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Children Details</p>
                    <Label htmlFor="dependentsCount" className="text-sm font-medium text-gray-900">
                      Number of Children (under 26) *
                    </Label>
                    <Input
                      id="dependentsCount"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g., 2"
                      className="h-10 text-sm bg-white"
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Tobacco Use</Label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primaryTobacco"
                        {...register('primaryTobacco')}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="primaryTobacco" className="text-sm cursor-pointer">
                        Any tobacco users
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentMonthly" className="text-sm font-medium text-gray-900">
                    Current Monthly Cost (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      $
                    </span>
                    <Input
                      id="currentMonthly"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g., 750"
                      className="pl-8 h-10 text-sm text-right"
                      {...register('currentMonthly', {
                        valueAsNumber: true,
                        setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                      })}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                      We'll show you how much you could save with each membership
                  </p>
                  {errors.currentMonthly && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {errors.currentMonthly.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calculating All Memberships...
                    </div>
                  ) : (
                    <>
                        <LayoutGrid className="mr-2 h-5 w-5" />
                        Compare All Memberships
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

            {/* Disclaimer */}
            <Card className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <strong className="font-semibold">Important:</strong>{' '}
                      Estimates are informational and not insurance. Final sharing levels and eligibility are determined during enrollment. This is not a binding quote.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
