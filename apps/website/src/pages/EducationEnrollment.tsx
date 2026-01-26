import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap, BookOpen, FileText, Users,
  Clock, Shield, ArrowRight, Phone
} from 'lucide-react';
import { Card } from '../components/ui/Card';

const EducationEnrollment: React.FC = () => {
  const enrollmentSteps = [
    {
      step: 1,
      title: 'Learn About Health Sharing',
      description: 'Explore our interactive guides and videos to understand how medical cost sharing works and which plan fits your needs.',
      icon: BookOpen,
      duration: '10-15 minutes'
    },
    {
      step: 2,
      title: 'Get Your Personalized Quote',
      description: 'Use our intelligent calculator to receive pricing based on your household size, age, and location.',
      icon: FileText,
      duration: '5 minutes'
    },
    {
      step: 3,
      title: 'Choose Your Membership',
      description: 'Compare plan features side-by-side with clear explanations of coverage, IUA levels, and monthly contributions.',
      icon: Shield,
      duration: '10 minutes'
    },
    {
      step: 4,
      title: 'Complete Your Enrollment',
      description: 'Fill out a simple online application with step-by-step guidance. No medical exams or complex paperwork required.',
      icon: Users,
      duration: '15-20 minutes'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'New Member',
      content: 'The enrollment process was so simple! I had all my questions answered through the video guides, and the online form took less than 20 minutes to complete.',
      avatar: '/assets/portrait-selfie-senior-friends-with-peace-sign-house-having-fun-bonding-together-v-emoji-retirement-happy-elderly-group-men-laughing-taking-pictures-photo-social-media-980x612.jpg'
    },
    {
      name: 'Michael Chen',
      role: 'Small Business Owner',
      content: 'Enrolling my team was straightforward. The guided process walked us through every step, and the support team was incredibly helpful when we had specific questions.',
      avatar: '/assets/businessTeamWorking.jpg'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Family Plan Member',
      content: 'I appreciated being able to compare plans side-by-side and see exactly what each option covered. The transparency made choosing the right plan easy.',
      avatar: '/assets/womenHealth.jpg'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Education & Enrollment - MPB Health</title>
        <meta
          name="description"
          content="Get started fast with guided enrollment modules and self-service tools. Learn about health sharing and enroll in minutes with MPB Health."
        />
      </Helmet>

      <section
        className="relative pt-20 pb-16 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/businessTeamWorking.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-blue-600/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="inline-flex w-20 h-20 rounded-2xl bg-blue-600/10 items-center justify-center mb-6 backdrop-blur-sm">
              <GraduationCap className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-blue-600 to-neutral-800 bg-clip-text text-transparent">
                Seamless Enrollment
              </span>{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                Experience
              </span>
            </h1>
            <p className="text-xl text-neutral-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of members who have discovered how simple it is to get started with MPB Health.
              Our guided enrollment process takes the complexity out of healthcare decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/get-started"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Your Enrollment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors"
              >
                <Phone className="w-5 h-5" />
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
              Your Enrollment Journey
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              We have designed a simple, step-by-step process that guides you from learning about health sharing to becoming an active member.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {enrollmentSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.step} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-neutral-900">{step.title}</h3>
                        <Icon className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-neutral-600 mb-3 leading-relaxed">{step.description}</p>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Clock className="h-4 w-4" />
                        <span>{step.duration}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-neutral-600 mb-6">
              <strong>Total Time to Complete:</strong> Most members finish enrollment in 40-50 minutes or less
            </p>
            <Link
              to="/get-started"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              What Our Members Say
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Real experiences from members who have completed our enrollment process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
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

      <section className="py-16 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Begin your enrollment journey today and join a community of members who have taken control of their healthcare costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/get-started"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Your Enrollment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export { EducationEnrollment };
export default EducationEnrollment;
