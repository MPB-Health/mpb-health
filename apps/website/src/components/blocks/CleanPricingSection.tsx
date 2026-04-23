import React, { useState, useEffect } from 'react';
import { SimplePlanCard } from './SimplePlanCard';
import { SimpleComparisonView } from './SimpleComparisonView';
import { getActivePlans, type PlanWithFeatures } from '../../lib/plansService';
import { AlertCircle } from 'lucide-react';

const fallbackPlans: PlanWithFeatures[] = [
  {
    id: 'fallback-1',
    slug: 'essentials',
    name: 'Essentials',
    tagline: 'Hospital debt relief — no medical cost sharing',
    target_audience: 'Self Employed or 1099 Individuals',
    plan_type: 'individual',
    is_medical_cost_sharing: false,
    is_mec_compliant: false,
    is_hsa_compatible: false,
    sort_order: 1,
    is_active: true,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    price_display: '$50',
    enroll_url: 'https://essentials.enrollmpb.com/',
    features: [
      { id: '1', feature_name: 'Virtual Care Access', category: 'Core Benefits', notes: '24/7 urgent, primary, and virtual behavioral health care' },
      { id: '2', feature_name: 'MPB Concierge', category: 'Member Support', notes: 'Personal healthcare navigation' },
      { id: '3', feature_name: 'Rx & Vitamin Discounts', category: 'Additional Benefits', notes: 'Save up to 80% on prescriptions' },
      { id: '5', feature_name: 'Debt Dismissal Program', category: 'Additional Benefits', notes: 'Medical debt assistance' }
    ]
  },
  {
    id: 'fallback-2',
    slug: 'mec-essentials',
    name: 'MEC+ Essentials',
    tagline: 'ACA MEC + Debt Dismissal + HSA',
    target_audience: 'Individuals seeking ACA compliance',
    plan_type: 'individual',
    is_medical_cost_sharing: false,
    is_mec_compliant: true,
    is_hsa_compatible: false,
    sort_order: 2,
    is_active: true,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    price_display: '$125',
    enroll_url: 'https://mec.enrollmpb.com/',
    features: [
      { id: '1', feature_name: 'ACA-Mandated Preventive Care', category: 'Core Benefits', notes: 'No-cost preventive screenings' },
      { id: '2', feature_name: 'Virtual Care Access', category: 'Core Benefits', notes: '24/7 urgent, primary, virtual behavioral health' },
      { id: '3', feature_name: 'MPB Concierge', category: 'Member Support' },
      { id: '4', feature_name: 'Rx & Vitamin Discounts', category: 'Additional Benefits' }
    ]
  },
  {
    id: 'fallback-3',
    slug: 'care-plus',
    name: 'Care Plus',
    tagline: 'Medical cost sharing for unexpected expenses',
    target_audience: 'Families wanting bundled care',
    plan_type: 'family',
    is_medical_cost_sharing: true,
    is_mec_compliant: false,
    is_hsa_compatible: false,
    sort_order: 3,
    is_active: true,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    price_display: '$166',
    enroll_url: 'https://careplus.enrollmpb.com/',
    features: [
      { id: '1', feature_name: 'Medical Cost Sharing', category: 'Core Benefits', notes: 'Share eligible expenses after IUA' },
      { id: '2', feature_name: 'Virtual Care Access', category: 'Core Benefits', notes: '24/7 urgent, primary, virtual behavioral health' },
      { id: '3', feature_name: 'MPB Concierge', category: 'Member Support', notes: 'Personal navigation' },
      { id: '4', feature_name: 'Rx & Vitamin Discounts', category: 'Additional Benefits' },
      { id: '5', feature_name: 'Virtual Pet Care', category: 'Additional Benefits' }
    ]
  },
  {
    id: 'fallback-4',
    slug: 'direct',
    name: 'Direct',
    tagline: 'Large Medical Expense Protection with comprehensive cost sharing',
    target_audience: 'Those with existing primary care',
    plan_type: 'family',
    is_medical_cost_sharing: true,
    is_mec_compliant: false,
    is_hsa_compatible: false,
    sort_order: 4,
    is_active: true,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    price_display: '$201',
    enroll_url: 'https://direct.enrollmpb.com/',
    features: [
      { id: '1', feature_name: 'Preventive Care Sharing', category: 'Core Benefits', notes: 'Wellness visits and screenings shared' },
      { id: '1b', feature_name: 'Screening mammography & colonoscopy', category: 'Core Benefits', notes: '6-month waiting period on Direct' },
      { id: '2', feature_name: 'Medical Cost Sharing', category: 'Core Benefits', notes: 'Share eligible expenses after IUA' },
      { id: '3', feature_name: 'Virtual Care Access', category: 'Core Benefits', notes: '24/7 urgent, primary, virtual behavioral health' },
      { id: '4', feature_name: 'MPB Concierge', category: 'Member Support' },
      { id: '5', feature_name: 'Rx & Vitamin Discounts', category: 'Additional Benefits' }
    ]
  },
  {
    id: 'fallback-5',
    slug: 'secure-hsa',
    name: 'Secure HSA',
    tagline: 'HSA-compatible plan with tax advantages for self-employed',
    target_audience: 'Self-employed individuals with 1099 or business ID',
    plan_type: 'individual',
    is_medical_cost_sharing: true,
    is_mec_compliant: false,
    is_hsa_compatible: true,
    sort_order: 5,
    is_active: true,
    enrollment_fee: 0,
    annual_membership_fee: 0,
    tobacco_surcharge_pct: 0,
    price_display: '$239',
    enroll_url: 'https://securehsa.enrollmpb.com/',
    features: [
      { id: '1', feature_name: 'HSA Compatibility', category: 'Core Benefits', notes: 'Triple tax advantages' },
      { id: '2', feature_name: 'Medical Cost Sharing', category: 'Core Benefits', notes: 'Share eligible expenses after IUA' },
      { id: '3', feature_name: 'ACA-Mandated Preventive Care', category: 'Core Benefits' },
      { id: '4', feature_name: 'Virtual Care Access', category: 'Core Benefits' },
      { id: '5', feature_name: 'Rx Benefits', category: 'Additional Benefits' }
    ]
  }
];

export function CleanPricingSection() {
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await getActivePlans();

      if (data && data.length > 0) {
        setPlans(data);
      } else {
        setPlans(fallbackPlans);
      }
      setError(null);
    } catch (err) {
      console.warn('Failed to load plans from database, using fallback data:', err);
      setPlans(fallbackPlans);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  const handleCompareToggle = (slug: string, selected: boolean) => {
    if (selected) {
      if (selectedPlans.length < 3) {
        setSelectedPlans([...selectedPlans, slug]);
      }
    } else {
      setSelectedPlans(selectedPlans.filter(s => s !== slug));
    }
  };

  const handleShowComparison = () => {
    if (selectedPlans.length >= 2) {
      setShowComparison(true);
    }
  };

  const popularPlanSlug = 'care-plus';

  const topPlans = plans.filter(p =>
    p.slug === 'care-plus' || p.slug === 'careplus' || p.slug === 'care_plus' ||
    p.slug === 'direct' ||
    p.slug === 'secure-hsa' || p.slug === 'securehsa' || p.slug === 'secure_hsa'
  );

  const bottomPlans = plans.filter(p =>
    p.slug === 'essentials' ||
    p.slug === 'mec-essentials'
  );

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-neutral-600">Loading plans...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="chooseplan" className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
              Find Your Perfect Match
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Compare our most popular memberships and discover which approach aligns with your healthcare needs and budget
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPlans.map((plan) => (
                <SimplePlanCard
                  key={plan.id}
                  plan={plan}
                  isPopular={plan.slug === popularPlanSlug}
                  isComparing={selectedPlans.includes(plan.slug)}
                  onCompareToggle={handleCompareToggle}
                />
              ))}
            </div>

            {bottomPlans.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {bottomPlans.map((plan) => (
                  <SimplePlanCard
                    key={plan.id}
                    plan={plan}
                    isPopular={plan.slug === popularPlanSlug}
                    isComparing={selectedPlans.includes(plan.slug)}
                    onCompareToggle={handleCompareToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedPlans.length >= 2 && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleShowComparison}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Compare {selectedPlans.length} Plans
              </button>
            </div>
          )}

          <div className="mt-12 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <strong>2026 Rates Now Active:</strong> All pricing displayed reflects our current 2026 rate schedule.{' '}
              <a
                href="https://mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-blue-700"
              >
                View official price sheet
              </a>
            </div>

            <div className="text-center">
              <div className="inline-flex flex-col items-center gap-4 p-6 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <p className="text-neutral-700 font-medium">
                  Need help choosing the right plan?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:8558164650"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Call (855) 816-4650
                  </a>
                  <a
                    href="/get-started"
                    className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Get Personalized Quote
                  </a>
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 text-center max-w-3xl mx-auto leading-relaxed">
              MPB Health provides membership services and access to qualified health share programs.
              MPB Health itself is not a Health Share Organization or Health Care Sharing Ministry.
              Memberships offer an alternative to traditional insurance and provide access to
              organizations that share eligible medical expenses.
            </div>
          </div>
        </div>
      </section>

      {showComparison && (
        <SimpleComparisonView
          plans={plans.filter(p => selectedPlans.includes(p.slug))}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
}
