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

  // Calculate column width based on number of plans
  const planColumnWidth = `${Math.floor(75 / plans.length)}%`;

  return (
    <div className="space-y-8">
      {/* Plan Header Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}>
        <div className="flex items-end pb-4">
          <h3 className="text-xl font-bold text-primary-700">Features</h3>
        </div>
        {plans.map((plan, index) => (
          <Card
            key={plan.id}
            className="p-6 bg-gradient-to-br from-white via-primary-50/20 to-white border-2 border-primary-200 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
          >
            <div className="space-y-4">
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
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-lg bg-white">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary-700 to-primary-600">
              <th className="text-left py-4 px-6 text-white font-semibold w-1/4 sticky left-0 bg-gradient-to-r from-primary-700 to-primary-600">
                Features
              </th>
              {plans.map(plan => (
                <th 
                  key={plan.id} 
                  className="text-center py-4 px-4 text-white font-semibold"
                  style={{ width: planColumnWidth }}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
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
                <>
                  {/* Category Header Row */}
                  <tr key={`cat-${category}`} className="bg-primary-50">
                    <td 
                      colSpan={plans.length + 1} 
                      className="py-3 px-6 font-bold text-primary-800 text-lg border-l-4 border-primary-500"
                    >
                      {getCategoryLabel(category)}
                    </td>
                  </tr>

                  {/* Feature Rows */}
                  {allFeatureNames.map((featureName, rowIndex) => (
                    <tr 
                      key={`${category}-${featureName}`}
                      className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-primary-50/50 transition-colors`}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 bg-inherit">
                        {featureName}
                      </td>
                      {plans.map(plan => {
                        const feature = getFeatureForPlan(plan, category, featureName);
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center">
                            {feature ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-bold text-success-600">
                                    {feature.cost || 'Included'}
                                  </span>
                                </div>
                                {feature.feature_value && (
                                  <p className="text-xs text-neutral-600 leading-relaxed">
                                    {feature.feature_value}
                                  </p>
                                )}
                                {feature.notes && (
                                  <p className="text-xs text-neutral-500 italic leading-relaxed">
                                    {feature.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                  <X className="h-4 w-4 text-neutral-400" />
                                </div>
                                <span className="text-sm text-neutral-400">Not Included</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              );
            })}

            {/* Medical Cost Sharing Details Section */}
            {plans.some(p => p.sharing_details) && (
              <>
                <tr className="bg-primary-50">
                  <td 
                    colSpan={plans.length + 1} 
                    className="py-3 px-6 font-bold text-primary-800 text-lg border-l-4 border-primary-500"
                  >
                    Medical Cost Sharing Details
                  </td>
                </tr>

                {/* Lifetime Cap Row */}
                <tr className="bg-white hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 bg-inherit">
                    Lifetime Cap
                  </td>
                  {plans.map(plan => (
                    <td key={`lifetime-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details ? (
                        plan.sharing_details.has_lifetime_cap ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                              <X className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-amber-700 font-medium">Has cap</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-success-600">No cap</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Annual Cap Row */}
                <tr className="bg-neutral-50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 bg-inherit">
                    Annual Cap
                  </td>
                  {plans.map(plan => (
                    <td key={`annual-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details ? (
                        plan.sharing_details.has_annual_cap ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                              <X className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-amber-700 font-medium">Has cap</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-success-600">No cap</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Pre-membership Lookback Row */}
                <tr className="bg-white hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 bg-inherit">
                    Pre-membership Lookback
                  </td>
                  {plans.map(plan => (
                    <td key={`lookback-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details?.preexisting_lookback_months ? (
                        <div className="flex items-center justify-center gap-2">
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
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Maternity Waiting Period Row */}
                <tr className="bg-neutral-50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 bg-inherit">
                    Maternity Waiting Period
                  </td>
                  {plans.map(plan => (
                    <td key={`maternity-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details?.maternity_waiting_months ? (
                        <div className="flex items-center justify-center gap-2">
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
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
