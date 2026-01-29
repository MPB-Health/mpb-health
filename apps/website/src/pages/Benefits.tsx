import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Phone } from 'lucide-react';
import { voluntaryBenefits, voluntaryBenefitsOverview } from '../data/voluntaryBenefitsData';
import { Button } from '../components/ui/button';

export const Benefits: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Voluntary Benefits - MPB Health</title>
        <meta
          name="description"
          content="Explore comprehensive voluntary benefits including disability, critical illness, vision, dental, life, and more. Protect your finances, family, and livelihood."
        />
      </Helmet>

      <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              {voluntaryBenefitsOverview.headline}
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
              {voluntaryBenefitsOverview.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg"
                asChild
              >
                <a href="#benefits-grid">
                  Explore Benefits
                </a>
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
        </div>
      </section>

      <section id="benefits-grid" className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {voluntaryBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Link
                  key={benefit.id}
                  to={`/benefits/${benefit.id}`}
                  className="group bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={benefit.heroImage}
                      alt={benefit.name}
                      width={400}
                      height={192}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${benefit.gradientFrom} ${benefit.gradientTo} opacity-60`} />
                    <div className="absolute top-4 left-4">
                      <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon className={`w-8 h-8 ${benefit.color}`} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {benefit.name}
                      </h3>
                      <p className="text-sm font-semibold text-neutral-600 mb-3">
                        {benefit.tagline}
                      </p>
                      <p className="text-neutral-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                      <span>Learn More</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
            Need Help Choosing?
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Our licensed benefit specialists are here to help you find the right coverage for your needs and budget. Get personalized guidance at no cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              asChild
            >
              <Link to="/contact">
                Schedule a Consultation
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
            >
              <a href="tel:8558164650" className="inline-flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call (855) 816-4650
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Benefits;
