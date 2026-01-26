import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, Phone } from 'lucide-react';
import { voluntaryBenefits } from '../data/voluntaryBenefitsData';
import { BenefitInterestCTA } from '../components/blocks/BenefitInterestCTA';
import { Button } from '../components/ui/Button';

export const BenefitDetail: React.FC = () => {
  const { benefitId } = useParams<{ benefitId: string }>();
  const benefit = voluntaryBenefits.find((b) => b.id === benefitId);

  if (!benefit) {
    return <Navigate to="/benefits" replace />;
  }

  const Icon = benefit.icon;

  return (
    <>
      <Helmet>
        <title>{benefit.name} Insurance - MPB Health</title>
        <meta name="description" content={benefit.description} />
      </Helmet>

      <div className="min-h-screen bg-white">
        <section className={`relative py-16 md:py-24 bg-gradient-to-br ${benefit.gradientFrom} ${benefit.gradientTo} text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link
                to="/benefits"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Benefits
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center">
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                    {benefit.name} Insurance
                  </h1>
                  <p className="text-xl sm:text-2xl text-white/90 mb-6">
                    {benefit.tagline}
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed">
                    {benefit.detailedDescription}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg"
                    onClick={() => {
                      const element = document.getElementById('interest-form');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Get More Information
                  </Button>
                  <Button
                    size="lg"
                    className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg"
                    asChild
                  >
                    <a href="tel:8558164650" className="inline-flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      (855) 816-4650
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-white rounded-3xl blur-2xl opacity-20" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={benefit.heroImage}
                    alt={benefit.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefit.keyFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex w-12 h-12 rounded-xl ${benefit.bgColor} items-center justify-center mb-4`}>
                    <CheckCircle2 className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                  What's Covered
                </h2>
                <ul className="space-y-3">
                  {benefit.coverage.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-6 h-6 ${benefit.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                  Eligibility Requirements
                </h2>
                <ul className="space-y-3">
                  {benefit.eligibility.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full ${benefit.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className={`text-xs font-bold ${benefit.color}`}>
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {benefit.pricingTiers && benefit.pricingTiers.length > 0 && (
          <section className="py-16 bg-neutral-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Pricing Options
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefit.pricingTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-sm border-2 border-neutral-200 hover:border-neutral-300 transition-all"
                  >
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      {tier.name}
                    </h3>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-neutral-900">
                        {tier.priceRange}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                          <CheckCircle2 className={`w-5 h-5 ${benefit.color} flex-shrink-0 mt-0.5`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-neutral-500 mt-8">
                Actual pricing depends on age, coverage amount, and other factors. Contact us for a personalized quote.
              </p>
            </div>
          </section>
        )}

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {benefit.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-neutral-50 rounded-xl p-6 border border-neutral-200"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div id="interest-form">
          <BenefitInterestCTA
            benefitType={benefit.id}
            benefitName={benefit.name}
            gradientFrom={benefit.gradientFrom}
            gradientTo={benefit.gradientTo}
          />
        </div>
      </div>
    </>
  );
};

export default BenefitDetail;
