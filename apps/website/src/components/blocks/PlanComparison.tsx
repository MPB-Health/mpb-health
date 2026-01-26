import React from 'react';
import { X, CheckCircle2, MinusCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    plans: Record<string, boolean | string>;
  }[];
}

interface PlanComparisonProps {
  selectedPlans: string[];
  planDetails: Record<
    string,
    {
      price: string;
      enrollUrl: string;
      tier: string;
    }
  >;
  features: ComparisonFeature[];
  onClose: () => void;
  onRemovePlan: (planName: string) => void;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  selectedPlans,
  planDetails,
  features,
  onClose,
  onRemovePlan,
}) => {
  if (selectedPlans.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 animate-in fade-in duration-200">
      <div className="absolute inset-0 overflow-auto">
        <div className="min-h-full flex items-start justify-center p-4 sm:p-6 lg:p-8">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Compare Plans</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                Side-by-side comparison of {selectedPlans.length} selected plan
                {selectedPlans.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="sticky left-0 z-10 bg-neutral-50 px-6 py-4 text-left">
                      <div className="text-sm font-semibold text-neutral-900">Features</div>
                    </th>
                    {selectedPlans.map((planName) => (
                      <th key={planName} className="px-6 py-4 min-w-[250px]">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-neutral-900">{planName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemovePlan(planName)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {planDetails[planName]?.price}
                            <span className="text-sm font-normal text-neutral-600">/mo</span>
                          </div>
                          <button
                            onClick={() => {
                              onClose();
                              setTimeout(() => {
                                const calculator = document.getElementById('calculator');
                                if (calculator) {
                                  calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 text-sm"
                          >
                            Get Your Quote
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {features.map((category, categoryIdx) => (
                    <React.Fragment key={categoryIdx}>
                      <tr className="bg-neutral-100">
                        <td
                          colSpan={selectedPlans.length + 1}
                          className="px-6 py-3 text-sm font-semibold text-neutral-900"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIdx) => (
                        <tr
                          key={featureIdx}
                          className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm text-neutral-700">
                            {feature.name}
                          </td>
                          {selectedPlans.map((planName) => {
                            const value = feature.plans[planName];
                            return (
                              <td key={planName} className="px-6 py-4 text-center">
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
                                  ) : (
                                    <MinusCircle className="w-5 h-5 text-neutral-300 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-sm text-neutral-700">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Need help choosing? Talk to a healthcare advisor
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Close Comparison
                  </Button>
                  <a
                    href="tel:8558164650"
                    className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Call (855) 816-4650
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
