import React, { useState, useEffect } from 'react';
import { EnhancedPricingCard } from './EnhancedPricingCard';
import { PlanComparison } from './PlanComparison';
import { MobilePricingCarousel } from './MobilePricingCarousel';
import { StickyComparisonBar } from './StickyComparisonBar';

interface PlanFeature {
  name: string;
  tooltip?: string;
  category: 'virtual-care' | 'sharing' | 'support' | 'financial' | 'additional';
}

interface PlanData {
  name: string;
  planId: string;
  price: string;
  description: string;
  whoIsThisFor: string;
  features: PlanFeature[];
  enrollUrl: string;
  popular?: boolean;
  tier: 'basic' | 'standard' | 'premium' | 'elite';
  footnote?: string;
  enrolledThisMonth?: number;
}

const businessPlansData: PlanData[] = [
  {
    name: 'MEC+Essentials',
    planId: 'mec-essentials',
    price: '$125',
    description: 'ACA MEC + Debt Dismissal + HSA for small businesses (2–50 employees).',
    whoIsThisFor: 'Best for: Cost-conscious businesses & 1099 professionals',
    tier: 'basic',
    enrollUrl: 'https://mec.enrollmpb.com/',
    footnote: '*Eligibility requirements apply; speak to a healthcare advisor for details.',
    features: [
      { name: 'HSA Compatible', category: 'financial', tooltip: 'Contribute pre-tax dollars to a Health Savings Account' },
      { name: 'Tax Advantages', category: 'financial', tooltip: 'Potential tax deductions for self-employed individuals' },
      { name: 'Minimum Essential Coverage', category: 'financial', tooltip: 'Satisfies ACA employer mandate for applicable large employers' },
      { name: 'Debt Dismissal Program', category: 'financial', tooltip: 'Assistance with qualifying medical debt' },
      { name: 'Virtual Urgent Care', category: 'virtual-care', tooltip: 'Access to urgent care physicians' },
      { name: 'Virtual Primary Care', category: 'virtual-care', tooltip: 'Continuous care with dedicated primary care physicians' },
      { name: 'Virtual Behavioral Health', category: 'virtual-care', tooltip: 'Unlimited behavioral health support' },
      { name: 'MPB Concierge Assistance', category: 'support', tooltip: 'Personalized member advocacy and support' },
      { name: 'Pharmacy Discounts', category: 'financial', tooltip: 'Save up to 80% on prescriptions at 65,000+ pharmacies nationwide' },
      { name: 'Vitamin Discounts', category: 'financial', tooltip: 'Save 30% on high-quality vitamins and supplements' },
      { name: 'DNA Test Discounts', category: 'additional', tooltip: 'Discounted genetic testing services' },
      { name: 'Virtual Pet Care', category: 'additional', tooltip: 'Veterinary consultations for your pets' },
    ],
  },
  {
    name: 'Secure HSA',
    planId: 'secure-hsa',
    price: '$239',
    description: 'HSA-compatible membership with tax advantages, high-deductible protection, and comprehensive medical cost sharing for self-employed and business owners.',
    whoIsThisFor: 'Best for: Self-employed & business owners seeking tax advantages',
    tier: 'elite',
    popular: true,
    enrollUrl: 'https://securehsa.enrollmpb.com/',
    footnote: '*1099 or business ID requirement',
    features: [
      { name: 'HSA Compatible', category: 'financial', tooltip: 'Contribute pre-tax dollars to a Health Savings Account' },
      { name: 'Tax Advantages', category: 'financial', tooltip: 'Potential tax deductions for self-employed individuals' },
      { name: 'Annual Wellness Visit ($0 copay)', category: 'sharing', tooltip: 'Annual wellness visit at no cost' },
      { name: 'RX Benefits ($0-$15)', category: 'financial', tooltip: 'Prescription medications at $0-$15' },
      { name: 'Minimum Essential Coverage', category: 'financial', tooltip: 'Satisfies ACA individual mandate requirements' },
      { name: 'High-Deductible Protection', category: 'sharing', tooltip: 'Medical cost sharing after high deductible' },
      { name: 'Preventive Care (ACA mandated)', category: 'sharing', tooltip: 'ACA-required preventive services at no cost' },
      { name: 'Medical Cost Sharing', category: 'sharing', tooltip: 'Share eligible medical expenses after Initial Unshareable Amount' },
      { name: 'Virtual Urgent Care', category: 'virtual-care', tooltip: 'Access to urgent care physicians' },
      { name: 'Virtual Primary Care', category: 'virtual-care', tooltip: 'Continuous care with dedicated primary care physicians' },
      { name: 'Virtual Behavioral Health', category: 'virtual-care', tooltip: 'Unlimited behavioral health support' },
      { name: 'MPB Concierge Assistance', category: 'support', tooltip: 'Personalized member advocacy and support' },
      { name: 'Pharmacy Discounts', category: 'financial', tooltip: 'Save up to 80% on prescriptions nationwide' },
      { name: 'Vitamin Discounts', category: 'financial', tooltip: 'Save 30% on high-quality vitamins and supplements' },
      { name: 'DNA Test Discounts', category: 'additional', tooltip: 'Discounted genetic testing services' },
      { name: 'Virtual Pet Care', category: 'additional', tooltip: 'Veterinary consultations for your pets' },
    ],
  },
];

const comparisonFeatures = [
  {
    category: 'Financial Benefits',
    features: [
      { name: 'Minimum Essential Coverage', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'HSA Compatible', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Tax Advantages', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Debt Dismissal Program', plans: { 'MEC+Essentials': true, 'Secure HSA': false } },
      { name: 'Pharmacy Discounts', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Vitamin Discounts', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
    ],
  },
  {
    category: 'Medical Sharing',
    features: [
      { name: 'Medical Cost Sharing', plans: { 'MEC+Essentials': false, 'Secure HSA': true } },
      { name: 'Preventive Care (ACA)', plans: { 'MEC+Essentials': false, 'Secure HSA': true } },
      { name: 'High-Deductible Protection', plans: { 'MEC+Essentials': false, 'Secure HSA': true } },
    ],
  },
  {
    category: 'Virtual Healthcare',
    features: [
      { name: 'Virtual Urgent Care', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Virtual Primary Care', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Virtual Behavioral Health', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
    ],
  },
  {
    category: 'Support & Additional Services',
    features: [
      { name: 'MPB Concierge Assistance', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'Virtual Pet Care', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
      { name: 'DNA Test Discounts', plans: { 'MEC+Essentials': true, 'Secure HSA': true } },
    ],
  },
];

export const EnhancedBusinessPricingSection: React.FC = () => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCompareToggle = (planName: string, selected: boolean) => {
    if (selected) {
      if (selectedPlans.length < 2) {
        setSelectedPlans([...selectedPlans, planName]);
      }
    } else {
      setSelectedPlans(selectedPlans.filter((p) => p !== planName));
    }
  };

  const handleRemovePlan = (planName: string) => {
    setSelectedPlans(selectedPlans.filter((p) => p !== planName));
  };

  const handleClearComparison = () => {
    setSelectedPlans([]);
    setShowComparison(false);
  };

  const planDetails = businessPlansData.reduce((acc, plan) => {
    acc[plan.name] = {
      price: plan.price,
      enrollUrl: plan.enrollUrl,
      tier: plan.tier,
    };
    return acc;
  }, {} as Record<string, { price: string; enrollUrl: string; tier: string }>);

  return (
    <section id="chooseplan" className="py-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            Choose Your Membership
          </h2>
          <p className="text-lg text-neutral-700 max-w-3xl mx-auto mb-6">
            Save on healthcare expenses and foster a supportive environment for your team. Join
            thousands of small business owners and 1099 professionals who trust community-driven
            medical cost sharing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-neutral-600">Top seller:</span>
            {businessPlansData
              .filter((p) => p.popular)
              .map((plan) => (
                <span
                  key={plan.name}
                  className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {plan.name}
                </span>
              ))}
          </div>
        </div>

        {!isMobile ? (
          <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-5xl mx-auto">
            {businessPlansData.map((plan) => (
              <EnhancedPricingCard
                key={plan.name}
                {...plan}
                onCompareToggle={handleCompareToggle}
                isSelected={selectedPlans.includes(plan.name)}
              />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <MobilePricingCarousel
              currentIndex={currentMobileIndex}
              onIndexChange={setCurrentMobileIndex}
            >
              {businessPlansData.map((plan) => (
                <EnhancedPricingCard
                  key={plan.name}
                  {...plan}
                  onCompareToggle={handleCompareToggle}
                  isSelected={selectedPlans.includes(plan.name)}
                />
              ))}
            </MobilePricingCarousel>
          </div>
        )}

        <StickyComparisonBar
          selectedPlans={selectedPlans}
          onCompare={() => setShowComparison(true)}
          onClear={handleClearComparison}
        />

        {showComparison && (
          <PlanComparison
            selectedPlans={selectedPlans}
            planDetails={planDetails}
            features={comparisonFeatures}
            onClose={() => setShowComparison(false)}
            onRemovePlan={handleRemovePlan}
          />
        )}

        <div className="mt-12 text-center">
          <div className="text-xs text-neutral-500 max-w-3xl mx-auto">
            <p>
              MPB Health provides membership services and access to qualified health share programs.
              MPB Health itself is not a Health Share Organization or Health Care Sharing Ministry.
              Memberships offer an alternative to traditional insurance and provide access to
              organizations that share eligible medical expenses.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-neutral-700 font-medium">
              Want to see exact costs for your business?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#business-calculator"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('business-calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Calculate Your Rate
              </a>
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary border-2 border-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
              >
                Call (855) 816-4650
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
