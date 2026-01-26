import React, { useState, useMemo } from 'react';
import { Check, Info, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { PlanWithFeatures } from '../../lib/plansService';
import { lookupPrice } from '../../lib/pricingService';

interface SimplePlanCardProps {
  plan: PlanWithFeatures;
  isPopular?: boolean;
  onLearnMore?: (slug: string) => void;
  isComparing?: boolean;
  onCompareToggle?: (slug: string, selected: boolean) => void;
}

export function SimplePlanCard({
  plan,
  isPopular = false,
  isComparing = false,
  onCompareToggle
}: SimplePlanCardProps) {
  const [familySize, setFamilySize] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Benefits']));

  const shouldExcludeFeature = (featureName: string, notes?: string | null): boolean => {
    const excludedTerms = [
      'Higher Initial Unshareable Amount',
      'Cannot have other health membership',
      'IUA',
      'other health coverage'
    ];

    const textToCheck = `${featureName} ${notes || ''}`.toLowerCase();
    return excludedTerms.some(term => textToCheck.includes(term.toLowerCase()));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const groupedFeatures = plan.features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof plan.features>);

  const categoryLabels: Record<string, string> = {
    'Core Benefits': 'Core Benefits',
    'Virtual Care': 'Virtual Care',
    'Virtual Health': 'Virtual Health',
    'Medical Cost Sharing': 'Medical Cost Sharing',
    'Member Support': 'Member Support',
    'Financial Benefits': 'Financial Benefits',
    'Additional Benefits': 'Additional Benefits',
    'Preventive Care': 'Preventive Care',
    'Minimum Essential Coverage': 'Minimum Essential Coverage',
    'Pharmacy Benefits': 'Pharmacy Benefits',
    'Exclusive Discounts': 'Exclusive Discounts',
    'Digital Health Tools': 'Digital Health Tools',
    'International Membership': 'International Membership',
  };

  const calculatePrice = useMemo(() => {
    const householdType = familySize === 1 ? 'individual' : familySize === 2 ? 'couple' : 'family';
    const dependentsCount = familySize > 2 ? familySize - 2 : 0;

    const pricingResult = lookupPrice({
      planId: plan.slug,
      householdType: householdType,
      primaryAge: 35,
      spouseAge: familySize >= 2 ? 35 : undefined,
      dependentsCount: dependentsCount,
      primaryTobacco: false,
      spouseTobacco: false,
    });

    if (pricingResult) {
      return `$${pricingResult.totalMonthly}`;
    }

    return plan.price_display || '$0';
  }, [familySize, plan.slug, plan.price_display]);

  const tierColors = {
    'individual': 'bg-blue-50 border-blue-200',
    'family': 'bg-green-50 border-green-200',
    'business': 'bg-purple-50 border-purple-200',
    'hsa': 'bg-orange-50 border-orange-200',
  };

  const tierColor = tierColors[plan.plan_type as keyof typeof tierColors] || 'bg-neutral-50 border-neutral-200';

  return (
    <Card className={`relative flex flex-col h-full transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'ring-2 ring-blue-500' : ''
    } ${isComparing ? 'ring-2 ring-blue-400' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
            {plan.name}
          </h3>
          <p className="text-xs text-neutral-600 italic mb-2">
            Best for: {plan.target_audience || 'individuals'}
          </p>
          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(plan.slug, !isComparing)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isComparing
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {isComparing ? 'Selected' : 'Compare'}
            </button>
          )}
          <p className="text-sm text-neutral-600 leading-relaxed min-h-[3rem] mt-2">
            {plan.tagline}
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-neutral-600" />
            <span className="text-xs text-neutral-600">Family Size:</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((size) => (
              <button
                key={size}
                onClick={() => setFamilySize(size)}
                className={`px-3 py-1 text-sm rounded-lg transition-all ${
                  familySize === size
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-neutral-600 mb-1">From</div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-blue-600">
              {calculatePrice}
            </span>
            <span className="text-neutral-600">/ month</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {familySize > 1 
              ? `Family of ${familySize}`
              : 'Individual'}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            onClick={() => {
              const calculator = document.getElementById('calculator');
              if (calculator) {
                calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.location.href = '/individuals-and-families#calculator';
              }
            }}
          >
            Get Your Quote
          </Button>
        </div>

        <div className="text-xs text-center text-neutral-600 mb-4">
          No hidden fees · Cancel anytime
        </div>

        <div className="border-t border-neutral-200 pt-4 flex-1">
          <h5 className="text-sm font-semibold text-neutral-900 mb-1">What's Included</h5>
          <p className="text-xs text-neutral-500 italic mb-3">*After IUA is met</p>
          <div className="space-y-2">
            {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
              <div key={category} className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-xs font-medium text-neutral-900">
                    {categoryLabels[category] || category}
                  </span>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="w-3 h-3 text-neutral-600" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-neutral-600" />
                  )}
                </button>

                {expandedCategories.has(category) && (
                  <div className="px-3 py-2 space-y-2">
                    {categoryFeatures
                      .filter(feature => !shouldExcludeFeature(feature.feature_name, feature.notes))
                      .map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm text-neutral-700"
                        >
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="flex-1 text-xs">{feature.feature_name}</span>
                          {feature.notes && (
                            <Info className="w-3 h-3 text-neutral-400 cursor-help flex-shrink-0 mt-0.5" title={feature.notes} />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(plan.is_hsa_compatible || plan.is_mec_compliant) && (
        <div className={`px-4 py-2 ${tierColor} border-t text-xs text-center font-medium`}>
          {plan.is_hsa_compatible && 'HSA Compatible'}
          {plan.is_hsa_compatible && plan.is_mec_compliant && ' • '}
          {plan.is_mec_compliant && 'MEC Compliant'}
        </div>
      )}
    </Card>
  );
}
