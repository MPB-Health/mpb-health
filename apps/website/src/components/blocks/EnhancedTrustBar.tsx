import React from 'react';
import { Star, Award, Shield, Users, TrendingUp, CheckCircle, Phone } from 'lucide-react';

const EnhancedTrustBar: React.FC = () => {

  const trustIndicators = [
    {
      icon: Star,
      value: "4.9/5",
      label: "Member Rating",
      subtext: "Google Reviews",
      color: "text-yellow-500"
    },
    {
      icon: Award,
      value: "A+",
      label: "BBB Rating",
      subtext: "Accredited",
      color: "text-blue-600"
    },
    {
      icon: Shield,
      value: "14+",
      label: "Years Operating",
      subtext: "Since 2011",
      color: "text-primary"
    },
    {
      icon: Users,
      value: "50K+",
      label: "Active Members",
      subtext: "Growing daily",
      color: "text-teal-600"
    },
    {
      icon: TrendingUp,
      value: "$75M+",
      label: "Bills Shared",
      subtext: "In the last year",
      color: "text-success"
    },
    {
      icon: CheckCircle,
      value: "A+",
      label: "Member Support",
      subtext: "Dedicated advisors",
      color: "text-green-600"
    }
  ];

  return (
    <section className="relative py-16 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border-y border-neutral-200 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(0 0 0 / 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Trusted Nationwide
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            America's Most Trusted Health Sharing Community
          </h2>
        </div>

        {/* Trust Indicators Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in border border-neutral-100"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <indicator.icon className={`h-6 w-6 ${indicator.color}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${indicator.color} mb-1 tabular-nums`}>
                  {indicator.value}
                </div>
                <div className="text-sm font-semibold text-neutral-900 mb-1">
                  {indicator.label}
                </div>
                <div className="text-xs text-neutral-600">
                  {indicator.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex justify-center">
          <a
            href="tel:8556709571"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Call Us: (855) 670-9571
          </a>
        </div>

        {/* Certifications & Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <div className="w-px h-6 bg-neutral-300" />
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium">BBB Accredited</span>
          </div>
          <div className="w-px h-6 bg-neutral-300" />
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Top Rated Service</span>
          </div>
          <div className="w-px h-6 bg-neutral-300" />
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="w-5 h-5 text-teal-600" />
            <span className="font-medium">50,000+ Families Trust Us</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export { EnhancedTrustBar };
