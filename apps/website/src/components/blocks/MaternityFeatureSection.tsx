import React from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { maternityDetails } from '../../data/benefitsData';
import { trackEvent } from '../../lib/analytics';

export const MaternityFeatureSection: React.FC = () => {
  const handleLearnMoreClick = () => {
    trackEvent('maternity_learn_more_click', {
      location: 'maternity_feature_section',
      timestamp: new Date().toISOString(),
    });
    const calculatorSection = document.getElementById('calculator');
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to the page with the calculator
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  const handlePlanClick = (planName: string) => {
    trackEvent('maternity_plan_click', {
      plan: planName,
      location: 'maternity_feature_section',
    });
  };

  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-white via-primary-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 mb-12">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mx-auto">
              <Check className="h-4 w-4 mr-2" />
              Available in Care+ and Premium Plans
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight w-full">
              {maternityDetails.headline}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="bg-accent-50 border-l-4 border-accent-500 rounded-r-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Important Information</h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    {maternityDetails.waitingPeriod}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-neutral-900">What's Included</h3>
              <div className="space-y-3">
                {maternityDetails.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-100 flex items-center justify-center mt-0.5">
                      <Check className="h-4 w-4 text-success-600" strokeWidth={3} />
                    </div>
                    <p className="text-neutral-700 text-sm leading-relaxed">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleLearnMoreClick}
                className="shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
              >
                Calculate My Rate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  trackEvent('maternity_speak_specialist_click', {
                    location: 'maternity_feature_section',
                  });
                  window.location.href = '/contact';
                }}
                className="shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
              >
                Speak with a Specialist
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <p className="text-sm text-neutral-600 w-full mb-2">Available in these plans:</p>
              {maternityDetails.eligiblePlans.map((plan) => (
                <button
                  key={plan}
                  onClick={() => handlePlanClick(plan)}
                  className="px-4 py-2 rounded-lg bg-white border-2 border-primary-200 text-primary-700 font-semibold text-sm hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 hover:scale-105"
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-400 to-accent-400 rounded-3xl blur-2xl opacity-20" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1556652/pexels-photo-1556652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Happy pregnant woman with family representing comprehensive maternity membership"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-12">
            Your Complete Maternity Journey
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {maternityDetails.membershipStages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <Card
                  key={stage.id}
                  hover
                  className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center">
                      <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-neutral-900 mb-2">
                        {stage.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mb-4">
                        {stage.description}
                      </p>
                    </div>

                    <ul className="space-y-2">
                      {stage.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="text-sm text-neutral-700 leading-tight">
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Family's Health Journey?
          </h3>
          <p className="text-xl mb-8 text-primary-50 max-w-2xl mx-auto">
            Join thousands of families who trust MPB Health for comprehensive maternity coverage with transparent sharing and nationwide provider access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleLearnMoreClick}
              className="bg-white text-primary-700 hover:bg-neutral-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
            >
              Calculate Your Share Amount
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-100">
            No credit card required • Get your personalized quote in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
};
