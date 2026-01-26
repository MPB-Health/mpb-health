import React from 'react';
import { Star, Award, Shield, Users } from 'lucide-react';

const TrustBar: React.FC = () => {
  const trustIndicators = [
    {
      icon: Star,
      text: "4.9/5 Member Rating",
      subtext: "Based on 12,000+ reviews"
    },
    {
      icon: Award,
      text: "A+ BBB Rating",
      subtext: "Accredited business"
    },
    {
      icon: Shield,
      text: "14+ Years Operating",
      subtext: "Trusted since 2011"
    },
    {
      icon: Users,
      text: "50,000+ Members",
      subtext: "Growing community"
    }
  ];

  return (
    <section className="py-12 bg-neutral-50 border-y border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Trusted by Families Nationwide
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustIndicators.map((indicator, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <indicator.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="font-semibold text-neutral-900 text-sm">
                {indicator.text}
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                {indicator.subtext}
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export { TrustBar };