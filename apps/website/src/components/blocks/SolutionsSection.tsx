import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { typography } from '../../lib/typography';

interface Solution {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const solutions: Solution[] = [
  {
    id: 'members-families',
    icon: Users,
    title: 'Members & Families',
    description: 'Affordable healthcare sharing memberships with no network restrictions, telehealth, and dedicated advisor support.',
    link: '/individuals-and-families',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700'
  },
  {
    id: 'self-employed-1099',
    icon: Building2,
    title: 'Self Employed and 1099 Individuals',
    description: 'Preventive Care as mandated by the ACA and option to open an HSA to pay for medical expenses.',
    link: '/businesses-and-organizations',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700'
  },
  {
    id: 'advisors-agents',
    icon: TrendingUp,
    title: 'Advisors & Agents',
    description: 'Partner with MPB Health to offer innovative health sharing solutions. Access marketing support and competitive commissions.',
    link: '/advisors-and-brokers',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700'
  }
];

const SolutionsSection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`${typography.headings.h2.section} text-neutral-900 mb-4`}>
            HealthShare Memberships Built for You
          </h2>
          <p className={`${typography.body.large} text-neutral-600 max-w-3xl mx-auto`}>
            Choose your path to affordable, transparent healthcare sharing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution) => {
            const Icon = solution.icon;

            return (
              <Card
                key={solution.id}
                className="group relative p-8 h-full hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-transparent"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative flex flex-col h-full">
                  <div className="flex-grow">
                    <div className={`w-16 h-16 ${solution.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-8 w-8 ${solution.iconColor}`} />
                    </div>

                    <h3 className={`${typography.headings.h3.card} text-neutral-900 mb-3`}>
                      {solution.title}
                    </h3>

                    <p className="text-base text-neutral-600 mb-6 leading-relaxed">
                      {solution.description}
                    </p>
                  </div>

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

export { SolutionsSection };
