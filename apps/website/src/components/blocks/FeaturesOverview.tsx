import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { healthcareFeatures } from '../../data/healthcareFeaturesData';
import { typography } from '../../lib/typography';

export const FeaturesOverview: React.FC = () => {
  const featuredFeatures = healthcareFeatures.slice(0, 8);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleCards((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll('[data-feature-card]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      {/* Refined Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/40 to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Refined Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h2 className={`${typography.headings.h2.section} text-gray-900 mb-3`}>
            Healthcare Features Designed for You
          </h2>

          <p className={`${typography.body.default} text-gray-600`}>
            Essential healthcare sharing options with flexibility and comprehensive support.
          </p>
        </div>

        {/* Enhanced Feature Grid - 8 Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {featuredFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const isVisible = visibleCards.includes(index);

            return (
              <Link
                key={feature.id}
                to={`/features/${feature.id}`}
                data-feature-card
                data-index={index}
                className={`group relative bg-white rounded-lg border border-gray-200 p-5 transition-all duration-300 will-change-transform hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <div className="relative min-h-[180px] flex flex-col">
                  {/* Icon Container */}
                  <div className="mb-3">
                    <div className={`inline-flex w-11 h-11 rounded-lg ${feature.bgColor} items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-base text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                    {feature.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed flex-grow">
                    {feature.shortDescription}
                  </p>

                  {/* Refined CTA */}
                  <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-1.5 transition-all duration-200">
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Refined CTA */}
        <div className="text-center">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-blue-600 font-semibold border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 group"
          >
            <span>View All Features</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </section>
  );
};
