'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Star,
  TrendingDown,
  Shield,
  Heart,
  Users,
  ArrowRight,
  Sparkles,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { PlanEstimate, AllMembershipsEstimate } from '../../lib/newRateEngine';
import { fmtMoney } from '../../lib/utils';
import { trackAndNavigateToQuote } from '../../lib/leadRoutingTracker';

interface MembershipComparisonGridProps {
  estimates: AllMembershipsEstimate;
  currentMonthly?: number;
  onSelectPlan?: (planId: string, tierId?: string) => void;
}

// Feature highlights for each plan
const PLAN_FEATURES: Record<string, string[]> = {
  'essentials': [
    '24/7 Virtual Care included',
    'Pharmacy discounts up to 80%',
    'Medical cost sharing protection',
    'No network restrictions'
  ],
  'mec-essentials': [
    'ACA Minimum Essential Coverage',
    '24/7 Virtual Care included',
    'Satisfies employer mandate',
    'Preventive care benefits'
  ],
  'care-plus': [
    'Low IUA options ($1,250+)',
    'Comprehensive medical sharing',
    'Maternity sharing available',
    'Prescription benefits included'
  ],
  'direct': [
    'Budget-friendly monthly cost',
    'Higher IUA for lower premiums',
    'Full medical cost sharing',
    'Great for healthy individuals'
  ],
  'secure-hsa': [
    'HSA-compatible membership',
    'Tax-deductible contributions',
    'Preventive care at $0 copay',
    'RX benefits $0-$15'
  ]
};

// Icons for each plan
const PLAN_ICONS: Record<string, React.ElementType> = {
  'essentials': Heart,
  'mec-essentials': Shield,
  'care-plus': Sparkles,
  'direct': Users,
  'secure-hsa': TrendingDown
};

function PlanCard({
  plan,
  currentMonthly,
  onSelect,
  householdSize: _householdSize
}: { 
  plan: PlanEstimate; 
  currentMonthly?: number;
  onSelect: (planId: string, tierId?: string) => void;
  householdSize: number;
}) {
  const [selectedTierId, setSelectedTierId] = useState<string>(
    plan.tiers.length > 0 ? plan.tiers[Math.floor(plan.tiers.length / 2)].tierId : ''
  );
  
  const Icon = PLAN_ICONS[plan.planId] || Heart;
  const features = PLAN_FEATURES[plan.planId] || [];
  
  // Get current price based on selected tier or flat rate
  const currentPrice = plan.flatRate ?? 
    plan.tiers.find(t => t.tierId === selectedTierId)?.monthly ?? 
    plan.lowestPrice;
  
  // Calculate savings if current monthly provided
  const savings = currentMonthly && currentMonthly > currentPrice 
    ? currentMonthly - currentPrice 
    : null;
  
  const selectedTier = plan.tiers.find(t => t.tierId === selectedTierId);

  return (
    <Card className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl ${
      plan.popular 
        ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-100' 
        : 'border border-gray-200 hover:border-gray-300'
    }`}>
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-1 text-xs font-semibold shadow-md">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {/* HSA Compatible badge */}
      {plan.hsaCompatible && !plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1 text-xs font-semibold shadow-md">
            <Building2 className="w-3 h-3 mr-1" />
            HSA Compatible
          </Badge>
        </div>
      )}

      <CardHeader className={`pb-4 pt-6 ${plan.popular || plan.hsaCompatible ? 'pt-8' : ''}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${
            plan.popular 
              ? 'bg-gradient-to-br from-blue-100 to-teal-100' 
              : 'bg-gray-100'
          }`}>
            <Icon className={`h-6 w-6 ${
              plan.popular ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{plan.planLabel}</h3>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{plan.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Price Display */}
        <div className="text-center py-4 bg-gray-50 rounded-xl mb-4">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {fmtMoney(currentPrice)}
          </div>
          <div className="text-sm text-gray-600">per month</div>
          
          {savings && (
            <div className="mt-2 inline-flex items-center gap-1 text-green-600 text-sm font-medium">
              <TrendingDown className="w-4 h-4" />
              Save {fmtMoney(savings)}/mo
            </div>
          )}
          
          {plan.tiers.length > 1 && (
            <div className="text-xs text-gray-500 mt-2">
              Range: {fmtMoney(plan.lowestPrice)} - {fmtMoney(plan.highestPrice)}
            </div>
          )}
        </div>

        {/* IUA Tier Selector */}
        {plan.tiers.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Initial Unshareable Amount (IUA)
            </label>
            <Select
              value={selectedTierId}
              onChange={(e) => setSelectedTierId(e.target.value)}
              className="w-full text-sm h-10"
            >
              {plan.tiers.map((tier) => (
                <option key={tier.tierId} value={tier.tierId}>
                  {tier.iua} IUA - {fmtMoney(tier.monthly)}/mo
                </option>
              ))}
            </Select>
            {selectedTier && (
              <p className="text-xs text-gray-500 mt-1.5">
                Pay {selectedTier.iua} out-of-pocket before sharing begins
              </p>
            )}
          </div>
        )}

        {/* Features List */}
        <div className="flex-1">
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={() => onSelect(plan.planId, selectedTierId || undefined)}
            className={`w-full h-11 font-semibold transition-all duration-200 ${
              plan.popular
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg'
                : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            }`}
          >
            Select This Membership
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MembershipComparisonGrid({
  estimates,
  currentMonthly,
  onSelectPlan
}: MembershipComparisonGridProps) {
  const householdSize = estimates.inputSummary.householdType === 'individual' 
    ? 1 
    : estimates.inputSummary.householdType === 'couple' 
      ? 2 
      : 2 + (estimates.inputSummary.dependentsCount || 0);

  const handleSelectPlan = (planId: string, tierId?: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId, tierId);
    } else {
      // Default behavior: navigate to quote with selected plan
      const plan = estimates.plans.find(p => p.planId === planId);
      const selectedTier = tierId ? plan?.tiers.find(t => t.tierId === tierId) : null;
      const price = selectedTier?.monthly ?? plan?.flatRate ?? plan?.lowestPrice ?? 0;
      
      trackAndNavigateToQuote({
        ctaType: 'comparison_grid_select',
        ctaText: 'Select This Membership',
        ctaLocation: 'membership_comparison_grid',
        planType: planId,
        householdSize,
        estimatedPremium: price
      });
    }
  };

  // Sort plans: popular first, then by lowest price
  const sortedPlans = [...estimates.plans].sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.lowestPrice - b.lowestPrice;
  });

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Your Personalized Membership Options
        </h3>
        <p className="text-gray-600">
          Based on {estimates.inputSummary.householdType === 'individual' ? 'individual' : 
            estimates.inputSummary.householdType === 'couple' ? 'couple' : 
            `family of ${householdSize}`} coverage in {estimates.inputSummary.state}
        </p>
        {currentMonthly && (
          <p className="text-sm text-blue-600 mt-1 font-medium">
            Comparing to your current ${currentMonthly}/month
          </p>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <PlanCard
            key={plan.planId}
            plan={plan}
            currentMonthly={currentMonthly}
            onSelect={handleSelectPlan}
            householdSize={householdSize}
          />
        ))}
      </div>

      {/* Help CTA */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-600 mb-3">
          Not sure which membership is right for you?
        </p>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
          asChild
        >
          <a href="/advisor-directory" className="inline-flex items-center gap-2">
            <Users className="w-4 h-4" />
            Speak with an Advisor
          </a>
        </Button>
      </div>
    </div>
  );
}
