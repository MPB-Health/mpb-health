import React from 'react';
import { ArrowRight, Compass, Users, Target, CheckCircle2, Clock, Shield, Heart, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const TailoredJourney: React.FC = () => {
  const benefits = [
    {
      icon: Target,
      title: 'Personalized Recommendations',
      description: 'Get matched with plans that fit your unique needs and budget',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Connect with advisors who understand your healthcare goals',
      color: 'from-teal-500 to-green-500',
    },
    {
      icon: Sparkles,
      title: 'Compare Your Options',
      description: 'See side-by-side comparisons of plans tailored to you',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Heart,
      title: 'Quick Enrollment',
      description: 'Start coverage in as little as 24 hours after approval',
      color: 'from-rose-500 to-orange-500',
    },
  ];


  return (
    <section className="relative py-28 overflow-hidden bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-200/30 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg border border-blue-100">
            <Compass className="h-5 w-5 text-blue-600" />
            <span className="text-blue-600 font-semibold tracking-wide">YOUR PERSONALIZED JOURNEY</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Find Your Perfect Plan in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Skip the confusion of comparing dozens of plans. Answer a few quick questions and we'll recommend the perfect health sharing solution for your family.
            <span className="block mt-3 text-lg font-medium text-blue-600">Personalized. Simple. Fast.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">No Personal Info Required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Takes 2 Minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-teal-600" />
              <span className="font-medium">100% Free & Secure</span>
            </div>
          </div>

          <Button
            size="lg"
            className="h-16 px-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            asChild
          >
            <a href="/get-started" className="inline-flex items-center">
              <Compass className="mr-3 h-6 w-6" />
              Start Your Tailored Journey
              <ArrowRight className="ml-3 h-6 w-6" />
            </a>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group">
            <img
              src="https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Happy family with husband, wife, and children enjoying quality time together"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-3xl font-bold mb-2">Healthcare That Adapts to You</h3>
              <p className="text-lg opacity-90">Join thousands of families who've found their perfect match</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className={`w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Card className="inline-block bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg p-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <Sparkles className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-bold text-gray-900 mb-1">Why Start Your Journey?</h4>
                <p className="text-sm text-gray-700">
                  Our interactive journey asks targeted questions about your health needs, lifestyle, and budget to match you with the ideal plan. No more guessing or comparing endless options—we do the work for you.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { TailoredJourney };
