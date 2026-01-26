import React, { useState, useEffect, useRef } from 'react';
import { Shield, Stethoscope, Heart, DollarSign, Users, Pill, Dna, PawPrint } from 'lucide-react';

const MembershipBenefits: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-benefit-card]').forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-in');
              }, index * 80);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      icon: Shield,
      title: 'Protection From Large Medical Expenses',
      badge: 'Core Protection',
    },
    {
      icon: Stethoscope,
      title: '$0 Unlimited 24/7/365 Virtual Urgent Care',
    },
    {
      icon: Heart,
      title: '$0 Continuous & Personalized Virtual Primary Care',
    },
    {
      icon: Heart,
      title: '$0 Virtual Behavioral Health',
    },
    {
      icon: DollarSign,
      title: 'Reduce or Eliminate Large Hospital Bills',
      note: 'Applicable with eligibility requirements',
    },
    {
      icon: PawPrint,
      title: '$0 Unlimited Virtual Pet Care',
    },
    {
      icon: Users,
      title: 'Personalized Advocacy and Expert Member Support',
    },
    {
      icon: Pill,
      title: 'Save 30% on High-quality Vitamins & Supplements',
    },
    {
      icon: Pill,
      title: 'Save on Prescriptions at Nationwide Pharmacies',
    },
    {
      icon: Dna,
      title: 'Genetic Testing Discounts',
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-5 py-2 bg-emerald-50 rounded-full border border-emerald-200">
            <span className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">Complete Wellness</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Mental. Physical. Balance.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our memberships bring every aspect of your well-being under one roof.
          </p>
          <p className="text-base text-gray-500 mt-2">
            Explore our services—features vary by membership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={index}
                data-benefit-card
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`
                  group relative bg-white
                  border-2 border-gray-200
                  rounded-2xl p-8
                  transition-all duration-300 ease-out
                  opacity-0
                  ${hoveredIndex === index ? 'shadow-xl -translate-y-1 border-emerald-300 bg-emerald-50/30' : 'shadow-md hover:shadow-lg'}
                `}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div
                      className={`
                        inline-flex items-center justify-center
                        w-14 h-14
                        rounded-xl
                        bg-gradient-to-br from-emerald-500 to-teal-500
                        transition-all duration-300
                        ${hoveredIndex === index ? 'scale-110 rotate-6 shadow-lg' : 'group-hover:scale-105'}
                      `}
                    >
                      <Icon
                        className="w-7 h-7 text-white"
                        strokeWidth={2}
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {benefit.title}
                  </h3>

                  {benefit.badge && (
                    <div className="mt-auto pt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wide">{benefit.badge}</span>
                      </div>
                    </div>
                  )}

                  {benefit.note && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      {benefit.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 bg-gray-50 rounded-full border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-gray-600 font-medium">All features subject to plan eligibility</span>
          </div>
        </div>
      </div>

      <style>{`
        [data-benefit-card] {
          animation: fade-up 0.6s ease-out forwards;
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        [data-benefit-card].animate-in {
          animation: fade-up 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export { MembershipBenefits };
