import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, CheckCircle2, TrendingUp, DollarSign, Users, Target, BookOpen, Headphones, Award, ShieldCheck, BarChart3, FileText, Lightbulb, UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SocialProof } from '../components/blocks/SocialProof';

const AdvisorsAndBrokers = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Commissions',
      description: 'Earn industry-leading commission rates with recurring revenue on every member you enroll. Build a sustainable income stream.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: TrendingUp,
      title: 'Recurring Revenue Model',
      description: 'Generate ongoing passive income from your member base. As your members renew, your commissions continue month after month.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Target,
      title: 'High Conversion Rates',
      description: 'Our transparent pricing and compelling value proposition make it easy to close sales. Members love the savings and flexibility.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Users,
      title: 'Dedicated Partner Support',
      description: 'Work with a dedicated account manager who understands your business and helps you succeed at every step.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const support = [
    {
      icon: BookOpen,
      title: 'Comprehensive Training',
      description: 'Access in-depth product training, sales techniques, and certification programs to become an MPB Health expert.',
    },
    {
      icon: FileText,
      title: 'Marketing Materials',
      description: 'Get co-branded brochures, digital assets, presentations, and sales collateral customized with your branding.',
    },
    {
      icon: Lightbulb,
      title: 'Lead Generation Tools',
      description: 'Leverage our proven lead generation strategies, landing pages, and campaigns to grow your pipeline.',
    },
    {
      icon: BarChart3,
      title: 'CRM & Reporting Dashboard',
      description: 'Track your enrollments, commissions, and member activity in real-time through our partner portal.',
    },
    {
      icon: Headphones,
      title: 'Enrollment Support',
      description: 'Our team assists with complex cases, answers technical questions, and ensures smooth onboarding for your clients.',
    },
    {
      icon: Award,
      title: 'Incentive Programs',
      description: 'Earn bonuses, attend exclusive events, and get recognized for top performance with our rewards program.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Submit Application',
      description: 'Complete our simple partner application form and tell us about your business and experience.',
    },
    {
      number: '02',
      title: 'Get Approved & Onboarded',
      description: 'Our team reviews your application and schedules an onboarding session to set up your account.',
    },
    {
      number: '03',
      title: 'Complete Training',
      description: 'Access our training portal and certification courses to master MPB Health products and sales strategies.',
    },
    {
      number: '04',
      title: 'Start Enrolling Members',
      description: 'Begin offering MPB Health solutions to your clients and start earning commissions immediately.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Advisor Partners' },
    { value: '$5K+', label: 'Average Monthly Commissions' },
    { value: '92%', label: 'Partner Satisfaction Rate' },
    { value: '24/7', label: 'Support Availability' },
  ];

  const commissionHighlights = [
    'First-year commissions on all new enrollments',
    'Ongoing renewal commissions for member retention',
    'Performance bonuses for high-volume producers',
    'Accelerated payment processing',
    'No enrollment caps or territory restrictions',
    'Commission tracking dashboard with real-time updates',
  ];

  return (
    <>
      <Helmet>
        <title>Health Sharing for Advisors & Brokers | Partner with MPB Health</title>
        <meta
          name="description"
          content="Grow your practice with MPB Health. Offer clients affordable health sharing plans. Competitive commissions, training, and dedicated support for advisors and brokers."
        />
        <link rel="canonical" href="https://mpb.health/advisors-and-brokers" />
        <meta property="og:title" content="Advisor & Broker Program | MPB Health" />
        <meta property="og:description" content="Partner with MPB Health. Competitive commissions, dedicated support." />
        <meta property="og:url" content="https://mpb.health/advisors-and-brokers" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/assets/delegates-networking.jpg" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-primary/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-display-lg sm:text-display-xl font-bold mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
                Partner with MPB Health
              </span>{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
                and Grow Your Business
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our network of successful advisors and brokers offering innovative health sharing
              solutions. Access competitive commissions, marketing support, and dedicated resources
              to grow your client base.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5" />
                (855) 816-4650
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </Card>
            ))}
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Why Partner with MPB Health?
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Build a profitable business while making a meaningful impact on your clients' lives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center justify-center w-14 h-14 ${benefit.bgColor} rounded-xl`}>
                        <Icon className={`w-7 h-7 ${benefit.color}`} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-neutral-900 mb-2">{benefit.title}</h4>
                      <p className="text-neutral-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Commission Structure
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Earn competitive commissions with transparent, straightforward compensation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
              <img
                src="/assets/businessTeamWorking.jpg"
                alt="Advisors working together"
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                loading="lazy"
              />
            </div>

            <div>
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  What You'll Earn
                </h3>
                <ul className="space-y-4">
                  {commissionHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
                  <p className="text-sm text-neutral-600 mb-2">Average Partner Earnings</p>
                  <p className="text-3xl font-bold text-primary mb-1">$5,000+ / month</p>
                  <p className="text-sm text-neutral-600">Based on active partner performance data</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Marketing & Sales Support
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Access the tools and resources you need to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {support.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-14 h-14 rounded-xl bg-primary/10 items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h4>
                  <p className="text-neutral-600 leading-relaxed">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              How to Get Started
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Join our partner network in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-2xl font-bold rounded-2xl mb-6 shadow-lg">
                    {step.number}
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h4>
                  <p className="text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Apply to Become a Partner
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/10 via-white to-accent/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-neutral-700 mb-8">
            Join hundreds of successful advisors and brokers who are building thriving businesses
            with MPB Health. Contact us today to learn more about partnership opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8558164650"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call Us Now
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      <SocialProof />
    </>
  );
};

export { AdvisorsAndBrokers };
export default AdvisorsAndBrokers;
