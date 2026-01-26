import { Star, Users, Shield, Award } from 'lucide-react';
import { Card } from '../ui/Card';

export function EnrollmentTrust() {
  const stats = [
    {
      icon: Users,
      value: '10,000+',
      label: 'Active Members',
      description: 'Families trusting MPB Health',
    },
    {
      icon: Shield,
      value: '20+ Years',
      label: 'Industry Experience',
      description: 'Proven cost sharing model',
    },
    {
      icon: Star,
      value: '4.8/5',
      label: 'Member Rating',
      description: 'Based on verified reviews',
    },
    {
      icon: Award,
      value: 'A+ Rated',
      label: 'Better Business Bureau',
      description: 'Accredited business',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of Families
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join a community that values transparency, affordability, and quality healthcare
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6 text-center">
                <div className="inline-flex w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.description}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <blockquote className="max-w-3xl mx-auto">
            <p className="text-lg italic text-gray-700 mb-4">
              "Switching to MPB Health was the best decision for our family. We save over $500 per month compared to traditional insurance, and the direct primary care has been incredible."
            </p>
            <footer className="text-sm font-semibold text-gray-900">
              — Sarah M., Care+ Member since 2022
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
