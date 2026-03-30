import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePlans } from '@/hooks/usePlans';
import { PlanComparisonTable } from '@/components/blocks/PlanComparisonTable';
import { PlanComparisonGuide } from '@/components/blocks/PlanComparisonGuide';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { Shield, HeartPulse, Building2, Briefcase, Heart, Printer, FileText } from 'lucide-react';

const planIcons: Record<string, React.ElementType> = {
  essentials: Shield,
  'mec-essentials': HeartPulse,
  'care-plus': Heart,
  careplus: Heart,
  direct: Building2,
  'secure-hsa': Briefcase,
  securehsa: Briefcase,
};

export default function PlanComparison() {
  const { plans, loading } = usePlans();
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

  const handlePlanToggle = (slug: string) => {
    setSelectedPlans(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlans(plans.map(p => p.slug));
  };

  const handleClearAll = () => {
    setSelectedPlans([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <Helmet>
      <title>Compare Health Sharing Plans Side by Side | MPB Health 2026</title>
      <meta name="description" content="Compare MPB Health sharing plans: Essentials, Care Plus, Direct, and Secure HSA. See pricing, benefits, and features side by side to find your best fit." />
      <link rel="canonical" href="https://mpb.health/compare-plans" />
      <meta property="og:title" content="Compare Health Sharing Plans | MPB Health" />
      <meta property="og:description" content="Side-by-side plan comparison. Find the right health sharing plan for your family." />
      <meta property="og:url" content="https://mpb.health/compare-plans" />
    </Helmet>
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/40 via-transparent to-transparent"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-primary-200/20 to-accent-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-tr from-success-200/20 to-primary-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent">
              Compare Plans
            </h1>
            <p className="mt-4 text-xl text-neutral-600 max-w-3xl mx-auto">
              Select plans to compare features, benefits, and coverage options side-by-side
            </p>
          </div>

          <Card className="p-8 backdrop-blur-sm bg-white/80 border-primary-100 shadow-2xl animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
                  Select Plans to Compare
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleSelectAll}
                    className="border-2 border-primary-300 hover:border-primary-500 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-300"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleClearAll}
                    className="border-2 border-neutral-300 hover:border-neutral-500 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100 transition-all duration-300"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {plans.map((plan, index) => {
                  const isSelected = selectedPlans.includes(plan.slug);
                  const Icon = planIcons[plan.slug] || Shield;

                  return (
                    <div
                      key={plan.id}
                      className={`group relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        isSelected
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 via-white to-primary-50 shadow-xl'
                          : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handlePlanToggle(plan.slug)}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-success-500/5 rounded-xl"></div>
                      )}
                      <div className="relative z-10 flex items-start space-x-4 w-full">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg'
                            : 'bg-gradient-to-br from-neutral-100 to-neutral-200 group-hover:from-primary-100 group-hover:to-primary-200'
                        }`}>
                          <Icon className={`w-6 h-6 transition-colors duration-300 ${
                            isSelected ? 'text-white' : 'text-neutral-600 group-hover:text-primary-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <Label
                                htmlFor={plan.slug}
                                className={`font-semibold cursor-pointer transition-colors duration-300 ${
                                  isSelected ? 'text-primary-700' : 'text-neutral-900 group-hover:text-primary-700'
                                }`}
                              >
                                {plan.name}
                              </Label>
                              {plan.tagline && (
                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{plan.tagline}</p>
                              )}
                            </div>
                            <Checkbox
                              id={plan.slug}
                              checked={isSelected}
                              onCheckedChange={() => handlePlanToggle(plan.slug)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPlans.length > 0 && (
                <div className="pt-6 border-t border-primary-100">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-base font-medium bg-gradient-to-r from-primary-700 to-success-600 bg-clip-text text-transparent">
                        {selectedPlans.length} {selectedPlans.length === 1 ? 'plan' : 'plans'} selected
                      </p>
                      <div className="h-2 w-48 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-500"
                          style={{ width: `${(selectedPlans.length / plans.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-3 print:hidden">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => window.print()}
                        className="border-2 border-primary-300 hover:border-primary-500 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-300"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Save PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        asChild
                        className="border-2 border-success-300 hover:border-success-500 hover:bg-gradient-to-r hover:from-success-50 hover:to-success-100 transition-all duration-300"
                      >
                        <a href="/docs/plan-comparison-guide.html" target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Full Comparison Guide
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {selectedPlans.length > 0 ? (
            <div className="animate-fade-in">
              <PlanComparisonTable planSlugs={selectedPlans} />
            </div>
          ) : (
            <Card className="p-16 text-center bg-gradient-to-br from-neutral-50 to-white border-neutral-200 shadow-lg">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary-600" />
                </div>
                <p className="text-xl font-medium text-neutral-700">
                  Select at least one plan above to start comparing
                </p>
                <p className="text-sm text-neutral-500">
                  Choose multiple plans to see a detailed side-by-side comparison of features and benefits
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Full Plan Comparison Guide */}
      <PlanComparisonGuide
        title="Complete Plan Comparison Guide"
        subtitle="View all plans and features at a glance"
      />
    </div>
    </>
  );
}
