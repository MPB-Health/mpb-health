import React from 'react';
import { ArrowRight, Phone, MessageCircle, Shield } from 'lucide-react';
import { Button } from '../ui/button';

const FinalCTA: React.FC = () => {
  const benefits = [
    "30-day satisfaction guarantee",
    "No network restrictions",
    "Transparent pricing",
    "Community support"
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-primary via-primary to-primary/90 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-8">
            <Shield className="h-4 w-4 mr-2" />
            Trusted by 50,000+ families
          </div>

          {/* Main headline */}
          <h2 className="text-display-md font-bold mb-6 text-balance">
            Ready to Join America's Most Trusted Health Sharing Community?
          </h2>
          
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Take the first step toward affordable, transparent healthcare. Get your personalized quote in under 2 minutes and see how much you could save.
          </p>

          {/* Benefits list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="text-sm text-primary-foreground/80"
              >
                ✓ {benefit}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="xl" 
              variant="secondary"
              className="group bg-white text-primary hover:bg-white/95"
              trackingName="Get Quote Final CTA"
              trackingLocation="final-cta"
            >
              Get Your Free Quote Now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <a
              href="tel:8558164650"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call (855) 816-4650
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-primary-foreground/70">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Speak with a specialist in minutes
            </div>
            <div className="hidden sm:block">•</div>
            <div>No obligation or pressure</div>
            <div className="hidden sm:block">•</div>
            <div>Quick 2-minute application</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { FinalCTA };