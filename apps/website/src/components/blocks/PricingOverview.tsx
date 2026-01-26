import React from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';

const PricingOverview = () => {
  const plans = [
    {
      name: 'Direct',
      monthlyShare: 199,
      annualIncident: 2500,
      maxSharing: 1000000,
      features: [
        'Telehealth services included',
        'Member support',
        'Preventive care sharing',
        'Prescription discounts',
        'Online member portal',
        'Mobile app access',
      ],
      color: 'border-slate-200',
      popular: false,
    },
    {
      name: 'Care+',
      monthlyShare: 299,
      annualIncident: 1500,
      maxSharing: 2000000,
      features: [
        'Everything in Direct',
        'Maternity sharing included',
        'Virtual behavioral health',
        'Full prescription sharing',
        'Priority member support',
        'Wellness program access',
        'Specialist care sharing',
      ],
      color: 'border-primary ring-2 ring-primary ring-opacity-20',
      popular: true,
    },
    {
      name: 'Secure HSA',
      monthlyShare: 349,
      annualIncident: 1000,
      maxSharing: 3000000,
      features: [
        'Everything in Care+',
        'HSA compatible',
        'MEC insurance component',
        'ACA compliant',
        'Dedicated account manager',
        'Priority care navigation',
        'Full sharing benefits',
      ],
      color: 'border-accent',
      popular: false,
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">
            Choose Your Membership Plan
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Every family is unique. Select the health sharing plan that provides the right balance of membership, community support, and affordability for your specific needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative animate-fade-up ${plan.color}`}
              style={{animationDelay: `${index * 0.1}s`}}
              hover
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  Monthly Sharing Amount
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900 tabular-nums">
                    {formatCurrency(plan.monthlyShare)}
                  </span>
                  <span className="text-base text-slate-600">/month</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Annual Incident: {formatCurrency(plan.annualIncident)}
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-900 mb-2">
                    Maximum Annual Sharing
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(plan.maxSharing)}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                
                <div className="text-center mt-4">
                  <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Learn more about {plan.name}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-slate-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              All Plans Include
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>No network restrictions</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>30-day satisfaction guarantee</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>Community support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PricingOverview };