import React from 'react';
import { ArrowRight, Shield, Heart, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { trackAndNavigateToQuote } from '../../lib/leadRoutingTracker';

interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  ctaSecondaryText?: string;
  showStats?: boolean;
}

const Hero = ({ 
  title, 
  subtitle, 
  description, 
  ctaText = "Get Started Today", 
  ctaSecondaryText = "Learn More",
  showStats = true 
}: HeroProps) => {
  const stats = [
    { icon: Users, value: '50,000+', label: 'Members' },
    { icon: Shield, value: 'A+', label: 'BBB Rating' },
    { icon: Heart, value: '$2.1B+', label: 'Shared' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="animate-fade-up">
              <Badge variant="accent" className="mb-4">
                {subtitle}
              </Badge>
              <h1 className="text-display-lg sm:text-display-xl font-bold text-slate-900 mb-6 leading-tight">
                {title}
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="group"
                  onClick={() => trackAndNavigateToQuote({
                    ctaType: 'enroll_now',
                    ctaText,
                    ctaLocation: 'hero_primary'
                  })}
                >
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="lg">
                  {ctaSecondaryText}
                </Button>
              </div>
            </div>

            {showStats && (
              <div className="mt-12 grid grid-cols-3 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center animate-fade-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex justify-center mb-2">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-600 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 lg:mt-0 lg:col-span-6">
            <div className="relative animate-fade-up" style={{animationDelay: '0.2s'}}>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-8 flex items-center justify-center">
                <img 
                  src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                  alt="Diverse families in our health sharing community"
                  className="w-full h-full object-cover rounded-xl shadow-elevation"
                />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-success rounded-2xl flex items-center justify-center shadow-elevation">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-elevation">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero };