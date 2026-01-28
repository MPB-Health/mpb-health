import { usePlanComparison } from '@/hooks/usePlans';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getAllUniqueCategories,
  getCategoryLabel,
  getPlanBadges,
  getFeatureForPlan,
} from '@/lib/planUtils';
import { Check, X, ExternalLink } from 'lucide-react';

interface PlanComparisonTableProps {
  planSlugs: string[];
}

export function PlanComparisonTable({ planSlugs }: PlanComparisonTableProps) {
  const { plans, loading, error } = usePlanComparison(planSlugs);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-accent-50 to-white border-accent-200">
        <p className="text-accent-600 font-medium">Error loading plans: {error.message}</p>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-neutral-50 to-white border-neutral-200">
        <p className="text-neutral-600 font-medium">No plans selected for comparison</p>
      </Card>
    );
  }

  const categories = getAllUniqueCategories(plans);

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-2xl">
        <div className="inline-block min-w-full align-middle">
          <div className="grid gap-6" style={{ gridTemplateColumns: `300px repeat(${plans.length}, 1fr)` }}>
            <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 z-10 backdrop-blur-sm">
              <div className="h-full flex items-end pb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">Features</h3>
              </div>
            </div>

            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                className="p-6 bg-gradient-to-br from-white via-primary-50/20 to-white border-2 border-primary-200 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="space-y-5">
                  <div className="relative">
                    <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-primary-200/30 to-success-200/30 rounded-full blur-2xl"></div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent relative">
                      {plan.name}
                    </h3>
                    {plan.tagline && (
                      <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{plan.tagline}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {getPlanBadges(plan).map((badge, idx) => (
                      <Badge
                        key={idx}
                        variant={badge.variant}
                        className="shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    asChild
                  >
                    <a href={`/${plan.slug}`} className="inline-flex items-center justify-center">
                      View Details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}

            {categories.map(category => {
              const allFeatureNames = Array.from(
                new Set(
                  plans.flatMap(plan =>
                    plan.features
                      .filter(f => f.category === category)
                      .map(f => f.feature_name)
                  )
                )
              );

              return (
                <div key={category} className="contents">
                  {/* Category Header - spans full width */}
                  <div
                    className="border-t-2 border-primary-100 pt-8 pb-3 bg-white"
                    style={{ gridColumn: `1 / -1` }}
                  >
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-success-600 bg-clip-text text-transparent">
                      {getCategoryLabel(category)}
                    </h4>
                  </div>

                  {allFeatureNames.map((featureName) => (
                    <div key={featureName} className="contents group">
                      <div className="sticky left-0 bg-white py-4 border-b border-neutral-100 z-10">
                        <p className="text-sm font-semibold text-neutral-800">{featureName}</p>
                      </div>

                      {plans.map(plan => {
                        const feature = getFeatureForPlan(plan, category, featureName);

                        return (
                          <div
                            key={plan.id}
                            className="py-4 border-b border-neutral-100 bg-white"
                          >
                            {feature ? (
                              <div className="space-y-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm">
                                    <Check className="h-4 w-4 text-white flex-shrink-0" />
                                  </div>
                                  {feature.cost && (
                                    <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                      {feature.cost}
                                    </span>
                                  )}
                                </div>
                                {feature.feature_value && (
                                  <p className="text-sm text-neutral-700 ml-8 leading-relaxed">
                                    {feature.feature_value}
                                  </p>
                                )}
                                {feature.notes && (
                                  <p className="text-xs text-neutral-500 ml-8 italic leading-relaxed">
                                    {feature.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3">
                                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
                                  <X className="h-4 w-4 text-neutral-400" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}

            {plans.some(p => p.sharing_details) && (
              <>
                {/* Section Header */}
                <div
                  className="border-t-2 border-primary-100 pt-8 pb-3 mt-8 bg-white"
                  style={{ gridColumn: `1 / -1` }}
                >
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-success-600 bg-clip-text text-transparent">
                    Medical Cost Sharing Details
                  </h4>
                </div>

                {/* Lifetime Cap Row */}
                <div className="sticky left-0 bg-white py-4 border-b border-neutral-100 z-10">
                  <p className="text-sm font-semibold text-neutral-800">Lifetime Cap</p>
                </div>
                {plans.map(plan => (
                  <div key={`lifetime-${plan.id}`} className="py-4 px-3 border-b border-neutral-100 bg-white">
                    {plan.sharing_details ? (
                      plan.sharing_details.has_lifetime_cap ? (
                        <span className="text-sm text-neutral-700 font-medium">Has cap</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">No cap</span>
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-neutral-400">N/A</span>
                    )}
                  </div>
                ))}

                {/* Annual Cap Row */}
                <div className="sticky left-0 bg-white py-4 border-b border-neutral-100 z-10">
                  <p className="text-sm font-semibold text-neutral-800">Annual Cap</p>
                </div>
                {plans.map(plan => (
                  <div key={`annual-${plan.id}`} className="py-4 px-3 border-b border-neutral-100 bg-white">
                    {plan.sharing_details ? (
                      plan.sharing_details.has_annual_cap ? (
                        <span className="text-sm text-neutral-700 font-medium">Has cap</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">No cap</span>
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-neutral-400">N/A</span>
                    )}
                  </div>
                ))}

                {/* Pre-membership Lookback Row */}
                <div className="sticky left-0 bg-white py-4 border-b border-neutral-100 z-10">
                  <p className="text-sm font-semibold text-neutral-800">Pre-membership Lookback</p>
                </div>
                {plans.map(plan => (
                  <div key={`lookback-${plan.id}`} className="py-4 px-3 border-b border-neutral-100 bg-white">
                    {plan.sharing_details?.preexisting_lookback_months ? (
                      <span className="text-sm font-medium text-neutral-700">
                        {Math.floor(plan.sharing_details.preexisting_lookback_months / 12)} years
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-400">N/A</span>
                    )}
                  </div>
                ))}

                {/* Maternity Waiting Period Row */}
                <div className="sticky left-0 bg-white py-4 border-b border-neutral-100 z-10">
                  <p className="text-sm font-semibold text-neutral-800">Maternity Waiting Period</p>
                </div>
                {plans.map(plan => (
                  <div key={`maternity-${plan.id}`} className="py-4 px-3 border-b border-neutral-100 bg-white">
                    {plan.sharing_details?.maternity_waiting_months ? (
                      <span className="text-sm font-medium text-neutral-700">
                        {plan.sharing_details.maternity_waiting_months} months
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-400">N/A</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
