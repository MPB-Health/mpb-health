import React, { useState, useMemo } from 'react';
import { CheckCircle2, Info, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/button';
import { lookupPrice } from '../../lib/pricingService';

interface PlanFeature {
  name: string;
  tooltip?: string;
  category: 'virtual-care' | 'sharing' | 'support' | 'financial' | 'additional';
}

interface PricingCardProps {
  name: string;
  price: string;
  priceDetail?: string;
  description: string;
  whoIsThisFor: string;
  features: PlanFeature[];
  enrollUrl: string;
  popular?: boolean;
  tier: 'basic' | 'standard' | 'premium' | 'elite';
  footnote?: string;
  enrolledThisMonth?: number;
  guaranteeText?: string;
  onCompareToggle?: (planName: string, selected: boolean) => void;
  isSelected?: boolean;
  onViewDetails?: (planName: string) => void;
  planId: string;
}

const tierStyles = {
  basic: {
    border: 'border-neutral-200',
    gradient: 'from-neutral-50 to-white',
    badge: 'bg-neutral-100 text-neutral-700',
    icon: 'text-neutral-600',
  },
  standard: {
    border: 'border-blue-200',
    gradient: 'from-blue-50/30 to-white',
    badge: 'bg-blue-100 text-blue-700',
    icon: 'text-blue-600',
  },
  premium: {
    border: 'border-primary ring-2 ring-primary/20',
    gradient: 'from-primary/5 to-white',
    badge: 'bg-primary text-white',
    icon: 'text-primary',
  },
  elite: {
    border: 'border-cyan-200',
    gradient: 'from-cyan-50/30 to-white',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: 'text-cyan-600',
  },
};

const categoryLabels = {
  'virtual-care': 'Virtual Healthcare',
  'sharing': 'Medical Sharing',
  'support': 'Member Support',
  'financial': 'Financial Benefits',
  'additional': 'Additional Perks',
};

export const EnhancedPricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  priceDetail = '/ month',
  description,
  whoIsThisFor,
  features,
  popular = false,
  tier,
  footnote,
  guaranteeText = 'No hidden fees · Cancel anytime',
  onCompareToggle,
  isSelected = false,
  onViewDetails,
  planId,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['virtual-care', 'sharing'])
  );
  const [familySize, setFamilySize] = useState(1);

  const styles = tierStyles[tier];

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

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PlanFeature[]>);

  const calculatePrice = useMemo(() => {
    const householdType = familySize === 1 ? 'individual' : familySize === 2 ? 'couple' : 'family';
    const dependentsCount = familySize > 2 ? familySize - 2 : 0;

    const pricingResult = lookupPrice({
      planId: planId,
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

    return price;
  }, [familySize, planId, price]);

  return (
    <Card
      className={`relative p-6 flex flex-col transition-all duration-300 hover:shadow-xl ${styles.border} bg-gradient-to-b ${styles.gradient} group`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className={`${styles.badge} px-4 py-1 text-sm font-semibold shadow-md`}>
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-2xl font-bold text-neutral-900 mb-1">{name}</h4>
            <p className="text-xs text-neutral-600 italic">{whoIsThisFor}</p>
          </div>
          {onCompareToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCompareToggle(name, !isSelected)}
              className={isSelected ? 'bg-primary text-white border-primary' : ''}
            >
              {isSelected ? 'Selected' : 'Compare'}
            </Button>
          )}
        </div>

        <p className="text-sm text-neutral-700 mb-4 leading-relaxed">{description}</p>

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
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-neutral-600 mb-1">Starting at</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{calculatePrice}</span>
            <span className="text-lg text-neutral-600">{priceDetail}</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {familySize > 1 
              ? `Family of ${familySize}`
              : 'Individual'}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              const calculator = document.getElementById('calculator');
              if (calculator) {
                calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.location.href = '/individuals-and-families#calculator';
              }
            }}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Get Your Quote
          </button>
          {onViewDetails && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onViewDetails(name)}
            >
              View Full Details
            </Button>
          )}
        </div>

        <div className="mt-3 text-xs text-center text-neutral-600">{guaranteeText}</div>
      </div>

      <div className="border-t border-neutral-200 pt-6 flex-1">
        <h5 className="text-sm font-semibold text-neutral-900 mb-1">What's Included</h5>
        <p className="text-xs text-neutral-500 italic mb-4">*After IUA is met</p>

        <div className="space-y-3">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <span className="text-sm font-medium text-neutral-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                {expandedCategories.has(category) ? (
                  <ChevronUp className="w-4 h-4 text-neutral-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-600" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="px-3 py-2 space-y-2">
                  {categoryFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-neutral-700"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${styles.icon} flex-shrink-0 mt-0.5`}
                      />
                      <span className="flex-1">{feature.name}</span>
                      {feature.tooltip && (
                        <Tooltip content={feature.tooltip}>
                          <Info className="w-3 h-3 text-neutral-400 cursor-help flex-shrink-0 mt-0.5" />
                        </Tooltip>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {footnote && (
          <p className="text-xs text-neutral-600 mt-4 p-2 bg-neutral-50 rounded border border-neutral-200">
            {footnote}
          </p>
        )}
      </div>
    </Card>
  );
};
