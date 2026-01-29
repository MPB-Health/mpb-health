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
                    className="mt-6 mb-2 py-4 px-6 bg-gradient-to-r from-primary-50 to-primary-100/50 border-l-4 border-primary-500 rounded-r-xl shadow-sm"
                    style={{ gridColumn: `1 / -1` }}
                  >
                    <h4 className="text-xl font-bold text-primary-700">
                      {getCategoryLabel(category)}
                    </h4>
                  </div>

                  {allFeatureNames.map((featureName) => (
                    <div key={featureName} className="contents group">
                      <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 py-4 px-4 border-b border-neutral-100 z-10 backdrop-blur-sm rounded-lg">
                        <p className="text-sm font-semibold text-neutral-800">{featureName}</p>
                      </div>

                      {plans.map(plan => {
                        const feature = getFeatureForPlan(plan, category, featureName);

                        return (
                          <div
                            key={plan.id}
                            className="py-4 px-4 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 rounded-lg mx-1"
                          >
                            {feature ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-bold text-success-600">
                                    {feature.cost || 'Included'}
                                  </span>
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
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                  <X className="h-4 w-4 text-neutral-400" />
                                </div>
                                <span className="text-sm text-neutral-400">Not Included</span>
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
                  className="mt-6 mb-2 py-4 px-6 bg-gradient-to-r from-primary-50 to-primary-100/50 border-l-4 border-primary-500 rounded-r-xl shadow-sm"
                  style={{ gridColumn: `1 / -1` }}
                >
                  <h4 className="text-xl font-bold text-primary-700">
                    Medical Cost Sharing Details
                  </h4>
                </div>

                {/* Lifetime Cap Row */}
                <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 py-4 px-4 border-b border-neutral-100 z-10 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-semibold text-neutral-800">Lifetime Cap</p>
                </div>
                {plans.map(plan => (
                  <div key={`lifetime-${plan.id}`} className="py-4 px-4 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 rounded-lg mx-1">
                    {plan.sharing_details ? (
                      plan.sharing_details.has_lifetime_cap ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="text-sm text-amber-700 font-medium">Has cap</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-success-600">No cap</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                          <X className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-sm text-neutral-400">N/A</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Annual Cap Row */}
                <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 py-4 px-4 border-b border-neutral-100 z-10 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-semibold text-neutral-800">Annual Cap</p>
                </div>
                {plans.map(plan => (
                  <div key={`annual-${plan.id}`} className="py-4 px-4 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 rounded-lg mx-1">
                    {plan.sharing_details ? (
                      plan.sharing_details.has_annual_cap ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="text-sm text-amber-700 font-medium">Has cap</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-success-600">No cap</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                          <X className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-sm text-neutral-400">N/A</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pre-membership Lookback Row */}
                <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 py-4 px-4 border-b border-neutral-100 z-10 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-semibold text-neutral-800">Pre-membership Lookback</p>
                </div>
                {plans.map(plan => (
                  <div key={`lookback-${plan.id}`} className="py-4 px-4 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 rounded-lg mx-1">
                    {plan.sharing_details?.preexisting_lookback_months ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600">
                            {Math.floor(plan.sharing_details.preexisting_lookback_months / 12)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-neutral-700">
                          {Math.floor(plan.sharing_details.preexisting_lookback_months / 12)} years
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                          <X className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-sm text-neutral-400">N/A</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Maternity Waiting Period Row */}
                <div className="sticky left-0 bg-gradient-to-r from-white to-neutral-50/80 py-4 px-4 border-b border-neutral-100 z-10 backdrop-blur-sm rounded-lg">
                  <p className="text-sm font-semibold text-neutral-800">Maternity Waiting Period</p>
                </div>
                {plans.map(plan => (
                  <div key={`maternity-${plan.id}`} className="py-4 px-4 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 rounded-lg mx-1">
                    {plan.sharing_details?.maternity_waiting_months ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600">
                            {plan.sharing_details.maternity_waiting_months}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-neutral-700">
                          {plan.sharing_details.maternity_waiting_months} months
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                          <X className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-sm text-neutral-400">N/A</span>
                      </div>
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
