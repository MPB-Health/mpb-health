import React from 'react';
import { X, Check, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PlanWithFeatures } from '../../lib/plansService';

interface SimpleComparisonViewProps {
  plans: PlanWithFeatures[];
  onClose: () => void;
}

export function SimpleComparisonView({ plans, onClose }: SimpleComparisonViewProps) {
  const allFeatureNames = Array.from(
    new Set(
      plans.flatMap(p => p.features.map(f => f.feature_name))
    )
  );

  const featuresByCategory = plans[0]?.features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    if (!acc[feature.category].includes(feature.feature_name)) {
      acc[feature.category].push(feature.feature_name);
    }
    return acc;
  }, {} as Record<string, string[]>) || {};

  allFeatureNames.forEach(featureName => {
    let foundInCategory = false;
    for (const category in featuresByCategory) {
      if (featuresByCategory[category].includes(featureName)) {
        foundInCategory = true;
        break;
      }
    }
    if (!foundInCategory) {
      if (!featuresByCategory['additional']) {
        featuresByCategory['additional'] = [];
      }
      featuresByCategory['additional'].push(featureName);
    }
  });

  const categoryLabels: Record<string, string> = {
    'core': 'Core Benefits',
    'support': 'Support Services',
    'additional': 'Additional Features'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">
            Compare Plans
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${plans.length}, 1fr)` }}>
            <div className="sticky left-0 bg-white z-10">
              <div className="h-32 flex items-end pb-4">
                <span className="text-sm font-semibold text-neutral-700">Feature</span>
              </div>
            </div>

            {plans.map((plan) => (
              <div key={plan.id} className="text-center">
                <div className="h-32 flex flex-col justify-end pb-4 border-b-2 border-blue-600">
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {plan.price_display}
                    <span className="text-sm text-neutral-600 font-normal">/mo</span>
                  </p>
                </div>
              </div>
            ))}

            {Object.entries(featuresByCategory).map(([category, features]) => (
              <React.Fragment key={category}>
                <div className="col-span-full mt-6 mb-2">
                  <h4 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </h4>
                </div>

                {features.map((featureName) => (
                  <React.Fragment key={featureName}>
                    <div className="sticky left-0 bg-white z-10 py-3 border-b border-neutral-100">
                      <span className="text-sm text-neutral-700">{featureName}</span>
                    </div>

                    {plans.map((plan) => {
                      const feature = plan.features.find(f => f.feature_name === featureName);
                      return (
                        <div key={plan.id} className="py-3 border-b border-neutral-100 flex items-center justify-center">
                          {feature ? (
                            <div className="flex flex-col items-center gap-1">
                              <Check className="w-5 h-5 text-green-600" />
                              {feature.feature_value && (
                                <span className="text-xs text-neutral-600">{feature.feature_value}</span>
                              )}
                            </div>
                          ) : (
                            <Minus className="w-5 h-5 text-neutral-300" />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            <div className="col-span-full mt-6 pt-6 border-t border-neutral-200">
              <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${plans.length}, 1fr)` }}>
                <div></div>
                {plans.map((plan) => (
                  <Button
                    key={plan.id}
                    className="w-full"
                    onClick={() => window.location.href = plan.enroll_url || '/get-started'}
                  >
                    Choose {plan.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
