import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Heart,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Globe,
  Zap
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

const coreValues = [
  {
    icon: Shield,
    title: 'Transparency',
    description: 'We communicate openly and honestly, ensuring our members have clear insights into their healthcare options and costs.',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-500',
    highlight: 'border-blue-200'
  },
  {
    icon: Heart,
    title: 'Compassion',
    description: "We listen with empathy and understanding, treating each member's circumstances with kindness and respect.",
    color: 'text-rose-600',
    bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconBg: 'bg-rose-500',
    highlight: 'border-rose-200'
  },
  {
    icon: Users,
    title: 'Care',
    description: 'We deliver personalized support and attention, going the extra mile to ensure every member receives the highest quality healthcare experience.',
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    iconBg: 'bg-green-500',
    highlight: 'border-green-200'
  }
];

const stats = [
  { icon: Users, value: '50K+', label: 'Members Served', color: 'text-blue-600' },
  { icon: TrendingUp, value: '30-60%', label: 'Average Savings', color: 'text-green-600' },
  { icon: Award, value: '98%', label: 'Satisfaction Rate', color: 'text-orange-600' },
  { icon: Globe, value: 'US-Wide', label: 'Membership', color: 'text-violet-600' }
];

const achievements = [
  { icon: CheckCircle2, text: 'Industry-leading medical cost sharing platform' },
  { icon: CheckCircle2, text: 'Dedicated support and personalized guidance' },
  { icon: CheckCircle2, text: 'Comprehensive membership options for all life stages' },
  { icon: CheckCircle2, text: 'Transparent pricing with no hidden fees' },
  { icon: CheckCircle2, text: 'Community-driven approach to healthcare' },
  { icon: CheckCircle2, text: 'Innovative technology for seamless experience' }
];

const faqs = [
  {
    question: 'What is MPB Health?',
    answer: 'MPB Health offers memberships that are alternatives to traditional health insurance. MPB Health is not insurance; rather, it is a community-focused organization dedicated to providing transparent, non-insurance alternatives for healthcare. We facilitate a medical cost-sharing model that empowers individuals, families, and businesses to break free from traditional network restrictions and high corporate overhead. By prioritizing people over profit, we provide innovative solutions that combine sharing, preventive care, and personalized support to help our members take back control of their healthcare journey.',
  },
  {
    question: 'Why do people choose MPB Health?',
    answer: 'Members choose MPB Health for the greater flexibility of seeing any doctor, significantly lower monthly costs compared to traditional insurance, and access to a community-based model. Our members value a system that prioritizes transparency and shared responsibility over corporate profit margins.',
  },
  {
    question: 'How much do members typically save by joining MPB Health?',
    answer: 'On average, our members see a 30–60% reduction in their monthly costs compared to traditional insurance premiums. Because we are a community-driven model without the high overhead of corporate insurance, those savings are passed directly back to our members.',
  },
  {
    question: 'How is MPB Health different from traditional insurance?',
    answer: 'Traditional insurance is built around premiums, restrictive networks, and corporate risk pools. MPB Health is a community-based alternative where members contribute monthly to share in eligible medical needs based on clear guidelines rather than insurance contracts. This model offers lower monthly costs and the freedom to choose any provider without network limitations.',
  },
  {
    question: 'What makes MPB Health different from other healthshares?',
    answer: "While many healthshares require a religious “statement of faith,” MPB Health is inclusive and open to everyone. We welcome members from all backgrounds, beliefs, and walks of life who share the common goal of taking personal responsibility for their health within a supportive community. Beyond our inclusivity, we differentiate ourselves by providing modern benefits such as $0 unlimited virtual care and behavioral health resources from day one, ensuring the community supports your daily wellness rather than just major medical events.",
  },
  {
    question: 'Is MPB Health a good fit for families?',
    answer: "Yes. Many families choose MPB Health because it offers total provider flexibility, allowing them to keep their trusted pediatricians and specialists. Families also benefit from significant monthly savings and immediate access to resources such as $0 unlimited virtual care and behavioral health, ensuring their everyday health needs are supported without the high costs of traditional insurance.",
  },
  {
    question: 'Who typically joins MPB Health?',
    answer: 'MPB Health is an ideal fit for individuals, families, small business owners, and self-employed professionals who prioritize freedom and flexibility in their healthcare. Our members are typically looking for a more affordable, community-driven alternative to traditional insurance that allows them to take full control of their healthcare choices without being restricted by corporate networks.',
  },
  {
    question: 'Is MPB Health available nationwide?',
    answer: 'Yes. MPB Health is available to members across most of the United States and Puerto Rico, providing individuals and families access to a nationwide, community-based healthcare model that travels with you. Note: Membership is currently unavailable to residents of Washington state.',
  },
  {
    question: 'Do I have to wait for an "Open Enrollment" period to join?',
    answer: 'No. One of the greatest advantages of MPB Health is that you can join any time of the year. There are no restrictive enrollment windows, meaning you can take control of your healthcare and start your membership as early as the first of the next month.',
  },
  {
    question: 'Is maternity care eligible for sharing?',
    answer: "Yes. MPB Health supports growing families by sharing in eligible expenses related to prenatal care, delivery, and postnatal care. To be eligible for sharing, the pregnancy conception date must occur after at least six months of continuous membership. Once the Initial Unshareable Amount (IUA) is met for the pregnancy, the community shares in the remaining eligible costs for both the mother and the newborn's initial care.",
  },
];

const AboutUs: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>About MPB Health - 14+ Years of Affordable Healthcare Solutions</title>
        <meta
          name="description"
          content="MPB Health has served 50,000+ families since 2011. Learn about our mission to provide affordable, community-based healthcare alternatives with transparency and care."
        />
        <link rel="canonical" href="https://mpb.health/about-us" />
        <meta property="og:title" content="About MPB Health - Our Story" />
        <meta property="og:description" content="14+ years serving families with affordable healthcare solutions." />
        <meta property="og:url" content="https://mpb.health/about-us" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50/50" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="/assets/team-photo.avif"
            alt="About MPB Health"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/80" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              About Us
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 text-balance">
              Community-Driven Healthcare Solutions
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Making quality healthcare accessible and affordable through innovative cost-sharing solutions.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              {stats.map((stat, index) => (
                <span key={index} className="flex items-center gap-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="font-semibold text-gray-900">{stat.value}</span> {stat.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                <Target className="w-3 h-3 mr-1" />
                Our Story
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Transforming Healthcare Together
              </h2>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                MPB Health is a leading provider of alternative healthcare solutions, empowering individuals and families to access affordable care through a supportive, member-driven community.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our innovative medical cost sharing model helps members save up to 50% on medical expenses versus traditional insurance plans. Based in the United States, we prioritize transparency, compassionate support, and comprehensive membership options—so you can make informed healthcare decisions and enjoy true peace of mind.
              </p>

              <div className="space-y-3 mb-8">
                {achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <achievement.icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{achievement.text}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group"
              >
                Schedule a Consultation
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl transform rotate-3" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/assets/team-photo.avif"
                  alt="MPB Health Team"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl transform -rotate-3" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/assets/mpbhealthteam.jpg"
                  alt="MPB Health Team"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent" />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-white/20 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Our Mission
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Together, We Share the Care That Empowers Healthier Lives
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Our mission is to empower individuals to live healthier, happier lives through innovative, comprehensive healthcare solutions—providing personalized support and guidance so our members can make informed decisions and access the best care possible.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {achievements.slice(3).map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3 text-white">
                    <achievement.icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{achievement.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-0">
              Our Values
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Drives Us Every Day
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our core values guide everything we do, from how we serve our members to how we build our community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <div
                key={index}
                className={`${value.bgColor} rounded-3xl p-8 border ${value.highlight} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className={`w-16 h-16 ${value.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-0">
              FAQ
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about our healthcare solutions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors group"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </h3>
                  {openFaqIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-8 pb-6 animate-fade-in">
                    {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Get Started
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-lg text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of members who are saving on healthcare while getting the coverage they need. Let's talk about your options.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group"
            >
              Schedule a Call
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/plans"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              View Plans
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export { AboutUs };
export default AboutUs;
