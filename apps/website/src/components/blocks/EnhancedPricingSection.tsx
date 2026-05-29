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

const plansData: PlanData[] = [
  {
    name: 'Essentials',
    planId: 'essentials',
    price: '$50',
    description: 'Hospital debt relief + basic protection. No medical cost sharing.',
    whoIsThisFor: 'Best for: Young, healthy individuals',
    tier: 'basic',
    enrollUrl: 'https://essentials.enrollmpb.com/',
    enrolledThisMonth: 127,
    footnote: '*Eligibility requirements apply; speak to a healthcare advisor for details.',
    features: [
      { name: 'Virtual Urgent Care', category: 'virtual-care' },
      { name: 'Virtual Primary Care', category: 'virtual-care' },
      { name: 'Virtual Behavioral Health', category: 'virtual-care' },
      { name: 'MPB Concierge Assistance', category: 'support' },
      { name: 'Pharmacy Discounts', category: 'financial', tooltip: 'Save up to 80% on prescriptions at 65,000+ pharmacies nationwide' },
      { name: 'Vitamin Discounts', category: 'financial', tooltip: 'Save 30% on high-quality vitamins and supplements' },
      { name: 'Virtual Pet Care', category: 'additional' },
      { name: 'Debt Dismissal Program', category: 'financial', tooltip: 'Assistance with qualifying medical debt' },
    ],
  },
  {
    name: 'Care+',
    planId: 'care-plus',
    price: '$166',
    description: 'Medical cost sharing for unexpected expenses.',
    whoIsThisFor: 'Best for: Families seeking balanced coverage',
    tier: 'standard',
    popular: true,
    enrollUrl: 'https://careplus.enrollmpb.com/',
    enrolledThisMonth: 243,
    features: [
      { name: 'Medical Cost Sharing', category: 'sharing', tooltip: 'Share eligible medical expenses after Initial Unshareable Amount (IUA)' },
      { name: 'Virtual Urgent Care', category: 'virtual-care' },
      { name: 'Virtual Primary Care', category: 'virtual-care' },
      { name: 'Virtual Behavioral Health', category: 'virtual-care' },
      { name: 'MPB Concierge Assistance', category: 'support' },
      { name: 'Pharmacy Discounts', category: 'financial' },
      { name: 'Vitamin Discounts', category: 'financial' },
      { name: 'DNA Test Discounts', category: 'additional' },
      { name: 'Virtual Pet Care', category: 'additional' },
    ],
  },
  {
    name: 'Direct',
    planId: 'direct',
    price: '$201',
    description: 'Our most popular membership with preventive sharing and comprehensive medical cost protection.',
    whoIsThisFor: 'Best for: Families who value preventive care',
    tier: 'premium',
    popular: false,
    enrollUrl: 'https://direct.enrollmpb.com/',
    enrolledThisMonth: 389,
    features: [
      { name: 'Preventive Sharing', category: 'sharing', tooltip: 'Annual wellness visits and preventive screenings shared' },
      {
        name: '6-month wait: mammography & colonoscopy',
        category: 'sharing',
        tooltip: 'Screening mammography and colonoscopy have a 6-month waiting period on Direct',
      },
      { name: 'Medical Cost Sharing', category: 'sharing' },
      { name: 'Virtual Urgent Care', category: 'virtual-care' },
      { name: 'Virtual Primary Care', category: 'virtual-care' },
      { name: 'Virtual Behavioral Health', category: 'virtual-care' },
      { name: 'MPB Concierge Assistance', category: 'support' },
      { name: 'Pharmacy Discounts', category: 'financial' },
      { name: 'Vitamin Discounts', category: 'financial' },
      { name: 'DNA Test Discounts', category: 'additional' },
      { name: 'Virtual Pet Care', category: 'additional' },
    ],
  },
];

const comparisonFeatures = [
  {
    category: 'Virtual Healthcare',
    features: [
      { name: '24/7 Virtual Urgent Care', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'Virtual Primary Care', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'Virtual Behavioral Health', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
    ],
  },
  {
    category: 'Medical Sharing',
    features: [
      { name: 'Medical Cost Sharing', plans: { 'Essentials': false, 'Care+': true, 'Direct': true } },
      { name: 'Preventive Sharing', plans: { 'Essentials': false, 'Care+': false, 'Direct': true } },
      {
        name: '6-mo wait: screening mammography & colonoscopy',
        plans: { 'Essentials': false, 'Care+': false, 'Direct': true },
      },
    ],
  },
  {
    category: 'Financial Benefits',
    features: [
      { name: 'Pharmacy Discounts', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'Vitamin Discounts', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'Debt Dismissal', plans: { 'Essentials': true, 'Care+': false, 'Direct': false } },
    ],
  },
  {
    category: 'Support & Additional Services',
    features: [
      { name: 'MPB Concierge Assistance', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'Virtual Pet Care', plans: { 'Essentials': true, 'Care+': true, 'Direct': true } },
      { name: 'DNA Test Discounts', plans: { 'Essentials': false, 'Care+': true, 'Direct': true } },
    ],
  },
];

export const EnhancedPricingSection: React.FC = () => {
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
      if (selectedPlans.length < 3) {
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

  const planDetails = plansData.reduce((acc, plan) => {
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
            Explore affordable alternatives to traditional healthcare{' '}
            <strong>for individuals and families.</strong>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-neutral-600">Popular choice:</span>
            {plansData.filter(p => p.popular).map(plan => (
              <span key={plan.name} className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {plan.name}
              </span>
            ))}
          </div>
        </div>

        {/* Desktop Grid View */}
        {!isMobile ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {plansData.map((plan) => (
              <EnhancedPricingCard
                key={plan.name}
                {...plan}
                onCompareToggle={handleCompareToggle}
                isSelected={selectedPlans.includes(plan.name)}
              />
            ))}
          </div>
        ) : (
          /* Mobile Carousel View */
          <div className="mb-8">
            <MobilePricingCarousel
              currentIndex={currentMobileIndex}
              onIndexChange={setCurrentMobileIndex}
            >
              {plansData.map((plan) => (
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

        {/* Sticky Comparison Bar */}
        <StickyComparisonBar
          selectedPlans={selectedPlans}
          onCompare={() => setShowComparison(true)}
          onClear={handleClearComparison}
        />

        {/* Plan Comparison Modal */}
        {showComparison && (
          <PlanComparison
            selectedPlans={selectedPlans}
            planDetails={planDetails}
            features={comparisonFeatures}
            onClose={() => setShowComparison(false)}
            onRemovePlan={handleRemovePlan}
          />
        )}

        {/* Disclaimer */}
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

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-neutral-700 font-medium">
              Not sure which membership is right for you?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Call (855) 816-4650
              </a>
              <a
                href="/get-started"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary border-2 border-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
              >
                Get Personalized Quote
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
