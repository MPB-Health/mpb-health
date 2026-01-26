import React from 'react';
import { Users, FileText, Heart, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../ui/Card';

const Timeline = () => {
  const steps = [
    {
      icon: Users,
      title: 'Join Our Community',
      description: 'Become a member and join thousands of families who share healthcare costs together.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: FileText,
      title: 'Submit Your Need',
      description: 'When medical expenses arise, simply submit them through our easy online portal or mobile app.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Heart,
      title: 'Community Reviews',
      description: 'Our caring community and medical team review submissions to ensure they meet sharing guidelines.',
      color: 'text-warm',
      bgColor: 'bg-warm/10',
    },
    {
      icon: CheckCircle,
      title: 'Expenses Shared',
      description: 'Eligible medical expenses are shared among our community, helping reduce your healthcare burden.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 to-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-display-md font-bold text-slate-900 mb-6">
            How Health Sharing Works
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Our simple, transparent process puts community support at the heart of healthcare. 
            Here's how we help members share the cost of medical expenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-8 h-0.5 bg-gradient-to-r from-slate-200 to-slate-300 z-0" />
              )}
              
              <Card hover className="relative z-10 text-center animate-fade-up" style={{animationDelay: `${index * 0.15}s`}}>
                <div className="p-6">
                  <div className={`inline-flex w-16 h-16 rounded-2xl ${step.bgColor} items-center justify-center mx-auto mb-6`}>
                    <step.icon className={`h-8 w-8 ${step.color}`} />
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 bg-white rounded-2xl px-6 py-4 shadow-subtle">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-slate-700">
              Average processing time: <span className="text-primary font-semibold">about 60 days</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Timeline };