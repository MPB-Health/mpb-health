import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  HeartPulse, Clock, Stethoscope, Brain, Phone, Video, MessageCircle,
  Heart, Users, Pill, Activity, BookOpen, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Card } from '../components/ui/Card';

const CareSupportHub: React.FC = () => {
  const coreServices = [
    {
      icon: Clock,
      title: '24/7 Virtual Urgent Care',
      description: 'Connect with board-certified physicians anytime, anywhere for urgent medical needs.',
      features: ['Available 365 days a year', 'No appointment needed', 'Average wait time under 10 minutes', 'Prescriptions sent directly to your pharmacy']
    },
    {
      icon: Stethoscope,
      title: 'Virtual Primary Care',
      description: 'Build ongoing relationships with dedicated healthcare providers for continuous, personalized care.',
      features: ['Same-day appointments available', 'Preventive care consultations', 'Chronic condition management', 'Follow-up care coordination']
    },
    {
      icon: Brain,
      title: 'Virtual Behavioral Health Support',
      description: 'Access licensed therapists and counselors for confidential virtual behavioral health support.',
      features: ['Licensed behavioral health professionals', 'Individual therapy sessions', 'Stress and anxiety management', 'Family counseling options']
    },
    {
      icon: Phone,
      title: 'Nurse Hotline',
      description: 'Speak with experienced registered nurses 24/7 for health questions and guidance.',
      features: ['Symptom assessment', 'Medication information', 'Care recommendations', 'Emergency guidance']
    }
  ];

  const additionalServices = [
    {
      icon: Users,
      title: 'Care Navigation',
      description: 'Personal advocates help you navigate the healthcare system, find providers, and coordinate care.'
    },
    {
      icon: Heart,
      title: 'Wellness Coaching',
      description: 'Work with certified wellness coaches on nutrition, fitness, and lifestyle improvements.'
    },
    {
      icon: Pill,
      title: 'Prescription Savings',
      description: 'Access discounts on medications at over 65,000 pharmacies nationwide.'
    },
    {
      icon: Activity,
      title: 'Health Monitoring',
      description: 'Tools and resources to track your health metrics and stay on top of your wellness goals.'
    },
    {
      icon: BookOpen,
      title: 'Health Library',
      description: 'Comprehensive database of articles, videos, and resources on health topics and conditions.'
    },
    {
      icon: MessageCircle,
      title: 'Secure Messaging',
      description: 'Communicate with your care team through our secure, HIPAA-compliant messaging platform.'
    }
  ];

  const accessMethods = [
    {
      icon: Video,
      title: 'Video Consultations',
      description: 'Face-to-face virtual visits from your smartphone, tablet, or computer'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with healthcare professionals by calling our toll-free number'
    },
    {
      icon: MessageCircle,
      title: 'Secure Chat',
      description: 'Send messages and receive guidance through our encrypted messaging system'
    }
  ];

  const membershipTiers = [
    {
      name: 'Essentials',
      includes: ['24/7 Virtual Urgent Care', 'Nurse Hotline', 'Prescription Discounts', 'Health Library'],
      highlight: false
    },
    {
      name: 'Care+ & Direct',
      includes: ['All Essentials features', 'Virtual Primary Care', 'Virtual Behavioral Health Support', 'Care Navigation', 'Wellness Coaching'],
      highlight: true
    },
    {
      name: 'Secure HSA',
      includes: ['All Care+ features', 'Priority support', 'Advanced health monitoring', 'Preventive care coordination'],
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: 'David Martinez',
      role: 'Member since 2023',
      content: 'When my daughter had a fever at 2 AM, being able to video chat with a doctor immediately gave us peace of mind. The care was excellent and we avoided an expensive ER visit.'
    },
    {
      name: 'Jennifer Lee',
      role: 'Care+ Member',
      content: 'The virtual behavioral health support has been life-changing. Having access to a therapist without long waits or high costs has made a huge difference in my wellness journey.'
    },
    {
      name: 'Robert Johnson',
      role: 'Secure HSA Member',
      content: 'The care navigation team helped me find the right specialist and coordinated all my appointments. They truly act as my healthcare advocate.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Care & Support Hub - MPB Health</title>
        <meta
          name="description"
          content="Access 24/7 telehealth, nurse hotline, care navigation, and wellness resources. Comprehensive healthcare support whenever you need it with MPB Health."
        />
      </Helmet>

      <section
        className="relative pt-20 pb-16 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/healthcare-images-for-healthcare-blog-website1-1080x675.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-teal-600/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="inline-flex w-20 h-20 rounded-2xl bg-teal-600/10 items-center justify-center mb-6 backdrop-blur-sm">
              <HeartPulse className="h-10 w-10 text-teal-600" />
            </div>
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-teal-600 to-neutral-800 bg-clip-text text-transparent">
                Your Healthcare
              </span>{" "}
              <span className="bg-gradient-to-r from-teal-600 via-green-600 to-cyan-600 bg-clip-text text-transparent">
                Support Team
              </span>
            </h1>
            <p className="text-xl text-neutral-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Access comprehensive care and support services whenever you need them. From virtual urgent care to personalized wellness guidance, we are here for you every step of the way.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Schedule Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors shadow-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                (855) 816-4650
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Core Care Services
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Essential healthcare services available to all members, designed to provide comprehensive support when you need it most
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {coreServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="inline-flex w-14 h-14 rounded-xl bg-teal-600/10 items-center justify-center flex-shrink-0">
                      <Icon className="h-7 w-7 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 mt-4">
                    {service.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Additional Support Services
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Extended care options and resources to support your complete health and wellness journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-14 h-14 rounded-xl bg-teal-600/10 items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {service.description}
                  </p>
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
              How to Access Care
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Multiple convenient ways to connect with healthcare professionals and support staff
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {accessMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-green-600 items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {method.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Care by Membership Level
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              All members have access to essential care services, with enhanced support available in higher tiers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipTiers.map((tier, index) => (
              <Card
                key={index}
                className={`p-6 ${tier.highlight ? 'ring-2 ring-teal-600 shadow-xl' : ''} hover:shadow-lg transition-shadow`}
              >
                {tier.highlight && (
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-semibold rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  {tier.name}
                </h3>
                <ul className="space-y-3">
                  {tier.includes.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-neutral-700">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/plans"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Compare All Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Member Experiences
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Real stories from members who have used our care and support services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-600/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">{testimonial.name}</h4>
                    <p className="text-sm text-neutral-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-neutral-600 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-teal-600 to-green-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Experience Comprehensive Care Support
          </h2>
          <p className="text-xl text-teal-50 mb-8">
            Join thousands of members who have access to 24/7 healthcare support and personalized care services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/get-started"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="tel:8558164650"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Us Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export { CareSupportHub };
export default CareSupportHub;
