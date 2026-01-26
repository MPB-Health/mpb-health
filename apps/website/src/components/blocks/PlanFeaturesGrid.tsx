import React from 'react';
import {
  Heart,
  Video,
  Stethoscope,
  Brain,
  PawPrint,
  Baby,
  Pill,
  Sparkles,
  Gift
} from 'lucide-react';
import { typography } from '../../lib/typography';

const PlanFeaturesGrid: React.FC = () => {
  const features = [
    { icon: Heart, label: 'Health Sharing', gradient: 'from-red-500 to-pink-500' },
    { icon: Video, label: 'Virtual Urgent Care', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Stethoscope, label: 'Virtual Primary Care', gradient: 'from-teal-500 to-green-500' },
    { icon: Brain, label: 'Virtual Behavioral Health', gradient: 'from-purple-500 to-pink-500' },
    { icon: PawPrint, label: 'Pet Telehealth', gradient: 'from-amber-500 to-orange-500' },
    { icon: Baby, label: 'Maternity', gradient: 'from-rose-500 to-pink-500' },
    { icon: Pill, label: 'Prescription', gradient: 'from-indigo-500 to-blue-500' },
    { icon: Sparkles, label: 'Concierge', gradient: 'from-yellow-500 to-amber-500' },
    { icon: Gift, label: 'Discounts & More', gradient: 'from-green-500 to-teal-500' },
  ];

  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className={`${typography.headings.h2.section} text-gray-900 mb-3`}>
            Features of the Plan
          </h2>
          <p className={`${typography.body.default} text-gray-600 max-w-2xl mx-auto`}>
            Comprehensive healthcare benefits designed to support your complete wellness
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {features.slice(0, 5).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {feature.label}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.slice(5).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index + 5}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {feature.label}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { PlanFeaturesGrid };
