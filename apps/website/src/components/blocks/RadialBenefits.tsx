import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, TrendingDown, Shield, Users, DollarSign, Globe } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

export const RadialBenefits: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const benefits = [
    {
      id: 'save-money',
      icon: TrendingDown,
      title: 'Save 30–60%',
      description: 'Typical families spend far less than traditional insurance.',
    },
    {
      id: 'community',
      icon: Users,
      title: 'Real Community Support',
      description: 'Your bills are shared by a nationwide member community.',
    },
    {
      id: 'provider',
      icon: Shield,
      title: 'Choose Any Provider',
      description: 'No networks. See any licensed doctor, anywhere.',
    },
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'Clear monthly amounts. No surprise bills.',
    },
    {
      id: 'worldwide',
      icon: Globe,
      title: 'Worldwide Sharing',
      description: 'Support that travels with you across the globe.',
    },
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const benefitId = entry.target.getAttribute('data-benefit-id');
            const position = entry.target.getAttribute('data-benefit-position');
            if (benefitId && position) {
              trackEvent('benefit_view', {
                benefit_id: benefitId,
                position: parseInt(position, 10),
              });
            }
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.15 }
    );

    const benefitNodes = containerRef.current?.querySelectorAll('[data-benefit-id]');
    benefitNodes?.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const handleCTAClick = () => {
    trackEvent('benefits_cta_click', {
      location: 'benefits_section',
      timestamp: new Date().toISOString(),
    });
    const calculatorSection = document.getElementById('calculator');
    const choosePlanSection = document.getElementById('chooseplan');
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: 'smooth' });
    } else if (choosePlanSection) {
      choosePlanSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to the page with the calculator
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  const handleBenefitClick = (benefitId: string, position: number) => {
    trackEvent('benefit_click', {
      benefit_id: benefitId,
      position,
    });
  };

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 bg-blue-600 text-white rounded-full">
            <span className="text-xs font-bold tracking-wider uppercase">Why Choose Health Sharing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">
            Families Choose Freedom
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Real savings. Real freedom. Real community support.
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <button
                key={benefit.id}
                data-benefit-id={benefit.id}
                data-benefit-position={index}
                onClick={() => handleBenefitClick(benefit.id, index)}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  group relative bg-white text-center
                  border border-gray-200
                  rounded-xl p-5
                  transition-all duration-300 ease-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  opacity-0
                  ${hoveredCard === index ? 'shadow-lg -translate-y-1 border-blue-400 bg-gradient-to-b from-blue-50/50 to-white' : 'shadow-sm hover:shadow-md'}
                `}
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <div className="flex flex-col items-center h-full">
                  <div className="mb-4">
                    <div
                      className={`
                        inline-flex items-center justify-center
                        w-12 h-12
                        rounded-lg
                        bg-gradient-to-br from-blue-500 to-cyan-500
                        transition-all duration-300
                        ${hoveredCard === index ? 'scale-110 shadow-lg' : 'group-hover:scale-105'}
                      `}
                    >
                      <Icon
                        className="w-6 h-6 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>

                  <p className="text-sm text-gray-600 leading-snug">
                    {benefit.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handleCTAClick}
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span>Get Your Free Quote</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <p className="mt-3 text-xs text-gray-500">
            No credit card required • Takes less than 2 minutes
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        [data-benefit-id] {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
};
