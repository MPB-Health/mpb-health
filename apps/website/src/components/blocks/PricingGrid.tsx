import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';

const PricingGrid: React.FC = () => {
  const plans = [
    {
      name: 'Essentials',
      startingAt: '$50',
      description: '',
      features: [
        '24/7/365 Urgent care',
        'Virtual Urgent Care',
        'Virtual Primary Care',
        'Virtual Behavioral Health',
        'MPB Concierge Assistance',
        'Pharmacy Discounts',
        'Vitamin Discounts',
        'Virtual Pet Care',
        'Debt Dismissal*',
      ],
      popular: false,
      color: 'border-neutral-200',
      ctaHref: 'https://essentials.enrollmpb.com/',
      hasFootnote: true,
    },
    {
      name: 'Care+',
      startingAt: '$166',
      description: '',
      features: [
        'Medical Cost Sharing',
        'Virtual Urgent Care',
        'Virtual Primary Care',
        'Virtual Behavioral Health',
        'MPB Concierge Assistance',
        'Pharmacy Discounts',
        'Vitamin Discounts',
        'DNA Test Discounts',
        'Virtual Pet Care',
      ],
      popular: false,
      color: 'border-neutral-200',
      ctaHref: 'https://careplus.enrollmpb.com/',
      hasFootnote: false,
    },
    {
      name: 'Direct',
      startingAt: '$201',
      description: '',
      features: [
        'Preventive Sharing',
        '6-month waiting period: screening mammography & colonoscopy',
        'Medical Cost Sharing',
        'Virtual Urgent Care',
        'Virtual Primary Care',
        'Virtual Behavioral Health',
        'MPB Concierge Assistance',
        'Pharmacy Discounts',
        'Vitamin Discounts',
        'DNA Test Discounts',
        'Virtual Pet Care',
      ],
      popular: true,
      color: 'border-primary ring-2 ring-primary/20',
      ctaHref: 'https://direct.enrollmpb.com/',
      hasFootnote: false,
    },
  ];

  return (
    <section id="chooseplan" className="py-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            Choose Your Membership
          </h1>
          <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
            Explore affordable alternatives to traditional healthcare plans{' '}
            <strong>for individuals and families.</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className="p-6 flex flex-col">
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h4>
                <h5 className="text-sm text-neutral-600 mb-2">Starting at</h5>
                <h4 className="text-3xl font-bold text-primary mb-4">
                  {plan.startingAt} <span className="text-lg font-normal text-neutral-600">/ month</span>
                </h4>
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Enroll Today
                </a>
              </div>

              <div className="border-t border-neutral-200 pt-6 flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-sm text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.hasFootnote && (
                  <p className="text-xs text-neutral-600 mt-4">
                    {(plan as any).footnoteText || '*Eligibility requirements apply; speak to a healthcare advisor for details.'}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="text-xs text-neutral-500 max-w-3xl mx-auto">
            <p>MPB Health provides membership services and access to qualified health share programs. MPB Health itself is not a Health Share Organization or Health Care Sharing Ministry. Memberships offer an alternative to traditional insurance and provide access to organizations that share eligible medical expenses.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PricingGrid };