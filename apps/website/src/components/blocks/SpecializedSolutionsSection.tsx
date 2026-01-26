import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, HeartPulse, BarChart3, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';

interface SpecializedSolution {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const solutions: SpecializedSolution[] = [
  {
    id: 'education-enrollment',
    icon: GraduationCap,
    title: 'Education & Enrollment',
    description: 'Guided enrollment modules and self-service tools to get started fast.',
    link: '/education-enrollment',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700'
  },
  {
    id: 'care-support-hub',
    icon: HeartPulse,
    title: 'Care & Support Hub',
    description: '24/7 telehealth, nurse hotline, care navigation, and wellness resources.',
    link: '/care-support-hub',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700'
  },
  {
    id: 'insights-analytics',
    icon: BarChart3,
    title: 'Insights & Analytics',
    description: 'Real-time reporting and dashboards for employers and group administrators.',
    link: '/insights-analytics',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700'
  }
];

const SpecializedSolutionsSection: React.FC = () => {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
            Enhanced Member Services & Support
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto">
            Additional tools and services to enhance your health sharing experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution) => {
            const Icon = solution.icon;

            return (
              <Card
                key={solution.id}
                className="group relative p-8 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-transparent"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative">
                  <div className={`w-16 h-16 ${solution.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${solution.iconColor}`} />
                  </div>

                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {solution.title}
                  </h3>

                  <p className="text-base text-neutral-600 mb-6 leading-relaxed">
                    {solution.description}
                  </p>

                  <Link
                    to={solution.link}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${solution.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                  >
                    Learn More
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${solution.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { SpecializedSolutionsSection };
