import React from 'react';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import { trackAndNavigateToQuote } from '../../lib/leadRoutingTracker';

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  variant?: 'default' | 'gradient' | 'minimal';
}

const CTASection = ({ 
  title = "Ready to Get Started?",
  description = "Join thousands of families who trust MPB Health for affordable, reliable healthcare coverage.",
  primaryCTA = "Get Your Quote Today",
  secondaryCTA = "Call (855) 670-9571",
  variant = 'default'
}: CTASectionProps) => {
  
  if (variant === 'gradient') {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary via-primary/95 to-accent">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-up">
            <h2 className="text-display-md font-bold text-white mb-6">
              {title}
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="group"
                onClick={() => trackAndNavigateToQuote({
                  ctaType: 'get_quote',
                  ctaText: primaryCTA,
                  ctaLocation: 'cta_section_gradient'
                })}
              >
                {primaryCTA}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="tel:8556709571"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Phone className="mr-2 h-4 w-4" />
                {secondaryCTA}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'minimal') {
    return (
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              {title}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {description}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => trackAndNavigateToQuote({
                ctaType: 'get_quote',
                ctaText: primaryCTA,
                ctaLocation: 'cta_section_minimal'
              })}
            >
              {primaryCTA}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden animate-fade-up">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="text-display-md font-bold text-slate-900 mb-6">
              {title}
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                className="group"
                onClick={() => trackAndNavigateToQuote({
                  ctaType: 'get_quote',
                  ctaText: primaryCTA,
                  ctaLocation: 'cta_section_default'
                })}
              >
                {primaryCTA}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="tel:8556709571"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Phone className="mr-2 h-4 w-4" />
                {secondaryCTA}
              </a>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-600">
              <div className="flex items-center justify-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Speak with an expert</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Get a custom quote</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <ArrowRight className="h-4 w-4" />
                <span>Join in minutes</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export { CTASection };