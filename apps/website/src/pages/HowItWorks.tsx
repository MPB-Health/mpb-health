import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { HowItWorks as HowItWorksAnimation } from '../components/blocks/HowItWorks';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Button } from '../components/ui/button';
import {
  UserPlus,
  DollarSign,
  CreditCard,
  Stethoscope,
  FileText,
  Upload,
  Users,
  HeartHandshake,
  Shield,
  Clock,
  TrendingDown,
  Phone
} from 'lucide-react';

const HowItWorksPage: React.FC = () => {
  // FAQ data for structured data schema
  const faqsForSchema = [
    {
      question: 'How long does the entire process take from enrollment to first sharing?',
      answer: 'Enrollment takes 10–15 minutes and your membership becomes effective on the first day of the following month if enrolled by the 20th of the prior month. Eligible needs may be submitted immediately. Typical processing is ~60 days, sometimes as little as 2 weeks.'
    },
    {
      question: 'What happens if I need medical care during a waiting period?',
      answer: 'We don\'t decline membership based on medical history. New medical needs are shareable right away, while pre-existing conditions may have a phase-in period. Certain managed conditions—like diabetes, high blood pressure, and high cholesterol—can be eligible from Day One if there\'s been no hospitalization in the past year. Pre-membership conditions have a 12-month waiting period before they become eligible for sharing. Accidents are eligible immediately.'
    },
    {
      question: 'How do I know if a medical expense will be shared?',
      answer: 'Your membership guidelines outline what types of medical expenses are eligible for sharing. Our member support team can answer questions about specific situations and help you understand your sharing eligibility.'
    },
    {
      question: 'Can I switch my IUA level after enrollment?',
      answer: 'Yes. You may change your IUA once per year.'
    },
    {
      question: 'What if I disagree with a sharing decision?',
      answer: 'If you believe a submission was incorrectly denied or partially shared, you can request a formal review. Our appeals process includes a thorough re-evaluation by senior reviewers. Contact member support to initiate an appeal.'
    },
    {
      question: 'What happens if I miss a monthly share payment?',
      answer: 'Monthly share amounts are automatically billed on the 20th of the month for the following month\'s payment. If the share amount is not paid by the last business day of the month, the membership will be cancelled effective on the last business day of the month.'
    },
    {
      question: 'Can I submit bills for care received before joining MPB Health?',
      answer: 'No, only medical expenses incurred after your effective membership date are eligible for sharing consideration. Medical care received before joining, even if you haven\'t been billed yet, is not eligible.'
    }
  ];
  const benefits = [
    {
      icon: Shield,
      title: 'Community-Powered Protection',
      description: 'Join thousands of members sharing healthcare costs together, creating a safety net built on mutual support.'
    },
    {
      icon: TrendingDown,
      title: 'Lower Monthly Costs',
      description: 'Save up to 60% compared to traditional insurance with transparent, predictable monthly sharing amounts.'
    },
    {
      icon: Stethoscope,
      title: 'No Network Restrictions',
      description: 'Visit any doctor, specialist, or hospital nationwide. Complete freedom to choose your healthcare providers.'
    },
    {
      icon: Clock,
      title: 'Simple, Fast Process',
      description: 'From enrollment to claims, our streamlined process makes healthcare sharing straightforward and efficient.'
    }
  ];

  const _processDetails = [
    {
      step: 1,
      icon: UserPlus,
      title: 'Join MPB Health',
      content: 'Becoming a member is quick and straightforward. Enroll in as little as 10 minutes with a simple 1-page online application. Our advisors guide you through selecting the right membership level based on your family size, health needs, and budget.',
      keyPoints: [
        'Complete health questionnaire with guidance from your advisor',
        'Choose your membership level with advisor guidance',
        'Review and sign membership agreement',
        'Receive welcome materials and member ID'
      ],
      timeline: '10 minutes',
      requirements: 'Basic health information, contact details'
    },
    {
      step: 2,
      icon: DollarSign,
      title: 'Choose Your IUA',
      content: 'Your Initial Unshareable Amount (IUA) is similar to a deductible in traditional insurance. It\'s the amount you pay before the community begins sharing eligible medical expenses. Selecting the right IUA balances your monthly share cost with your out-of-pocket risk tolerance.',
      keyPoints: [
        'IUA ($1,250, $2,500 or $5,000)',
        'Higher IUA means lower monthly sharing amounts',
        'Lower IUA means higher monthly costs but less out-of-pocket',
        'Can adjust annually during renewal period'
      ],
      timeline: '5 minutes',
      requirements: 'Budget assessment, risk tolerance consideration'
    },
    {
      step: 3,
      icon: CreditCard,
      title: 'Make Your Monthly Share Amount',
      content: 'Your monthly share contribution keeps you in good standing and eligible for sharing. Payments are consistent, predictable, and significantly lower than traditional insurance premiums. Set up automatic payments for convenience and never worry about missing a deadline.',
      keyPoints: [
        'Fixed monthly amounts based on your membership selection',
        'Automatic payment is required',
        'Easy payment management through member portal',
        'Clear billing statements with no surprise fees'
      ],
      timeline: 'Ongoing monthly',
      requirements: 'Payment method (bank account or credit card)'
    },
    {
      step: 4,
      icon: Stethoscope,
      title: 'Get Care When You Need It',
      content: 'Access healthcare whenever you need it with complete provider freedom. Start with virtual care at no additional cost for minor issues. See any doctor or visit any hospital with no network restrictions.',
      keyPoints: [
        'Free virtual care for routine concerns',
        'No provider networks - choose any doctor or hospital',
        'Advisor support for care navigation'
      ],
      timeline: 'As needed',
      requirements: 'None - see any provider you choose'
    },
    {
      step: 5,
      icon: FileText,
      title: 'Track Your Medical Expenses',
      content: 'When you receive medical care, keep organized records of all bills, receipts, and documentation. Request itemized bills from your providers showing detailed charges. Proper documentation ensures smooth processing when you submit for sharing.',
      keyPoints: [
        'Always request itemized bills from providers',
        'Keep copies of all medical records and test results',
        'Document pre-authorization approvals',
        'Note dates of service and provider information'
      ],
      timeline: 'After each medical visit',
      requirements: 'Itemized bills, medical records, provider details'
    },
    {
      step: 6,
      icon: Upload,
      title: 'Submit Your Bills',
      content: 'Upload your medical bills through our secure member portal or mobile app. Our review team evaluates submissions against sharing guidelines, ensuring fair and consistent processing. Most submissions are reviewed within 2-3 business days.',
      keyPoints: [
        'Secure online portal with document upload',
        'Mobile app submission available',
        'Real-time status tracking of your submission',
        'Clear communication throughout review process'
      ],
      timeline: '10-15 minutes per submission',
      requirements: 'Medical bills, supporting documentation'
    },
    {
      step: 7,
      icon: Users,
      title: 'Community Shares the Cost',
      content: 'After your IUA is met, eligible medical expenses are shared by the community according to established guidelines. Payments are typically sent directly to providers when possible, or reimbursed to you if you\'ve already paid. You\'ll receive detailed sharing summaries explaining what was shared and why.',
      keyPoints: [
        'Sharing occurs after IUA is satisfied',
        'Direct provider payment when possible',
        'Detailed sharing summaries provided',
        'Clear explanation of shared and unshared amounts'
      ],
      timeline: 'About 60 days (as little as 2 weeks)',
      requirements: 'Approved eligible expenses'
    },
    {
      step: 8,
      icon: HeartHandshake,
      title: 'Ongoing Support',
      content: 'Your membership includes continuous support beyond just sharing medical costs. Access wellness resources, virtual behavioral health services, and dedicated advisor support. We\'re here to help you navigate the healthcare system and make informed decisions.',
      keyPoints: [
        'Personal advisor access',
        'Virtual behavioral health and wellness resources',
        'HSA-compatible options available'
      ],
      timeline: 'Throughout membership',
      requirements: 'Active membership in good standing'
    }
  ];

  const faqs = [
    {
      question: 'How long does the entire process take from enrollment to first sharing?',
      answer: 'Enrollment takes 10–15 minutes and your membership becomes effective on the first day of the following month if enrolled by the 20th of the prior month. Eligible needs may be submitted immediately. Typical processing is ~60 days, sometimes as little as 2 weeks.'
    },
    {
      question: 'What happens if I need medical care during a waiting period?',
      answer: 'We don\'t decline membership based on medical history. New medical needs are shareable right away, while pre-existing conditions may have a phase-in period. Certain managed conditions—like diabetes, high blood pressure, and high cholesterol—can be eligible from Day One if there\'s been no hospitalization in the past year. Pre-membership conditions have a 12-month waiting period before they become eligible for sharing. Accidents are eligible immediately.'
    },
    {
      question: 'How do I know if a medical expense will be shared?',
      answer: 'Your membership guidelines outline what types of medical expenses are eligible for sharing. Our member support team can answer questions about specific situations and help you understand your sharing eligibility.'
    },
    {
      question: 'Can I switch my IUA level after enrollment?',
      answer: 'Yes. You may change your IUA once per year.'
    },
    {
      question: 'What if I disagree with a sharing decision?',
      answer: 'If you believe a submission was incorrectly denied or partially shared, you can request a formal review. Our appeals process includes a thorough re-evaluation by senior reviewers. Contact member support to initiate an appeal.'
    },
    {
      question: 'What happens if I miss a monthly share payment?',
      answer: 'Monthly share amounts are automatically billed on the 20th of the month for the following month\'s payment. If the share amount is not paid by the last business day of the month, the membership will be cancelled effective on the last business day of the month.'
    },
    {
      question: 'Can I submit bills for care received before joining MPB Health?',
      answer: 'No, only medical expenses incurred after your effective membership date are eligible for sharing consideration. Medical care received before joining, even if you haven\'t been billed yet, is not eligible.'
    }
  ];

  const whyDifferent = [
    {
      title: 'True Community Model',
      description: 'Unlike insurance companies focused on profits, our community model prioritizes member wellbeing. Every decision is made with member interests first.'
    },
    {
      title: 'Transparent Operations',
      description: 'We openly share how contributions are used. No hidden fees, complicated billing, or surprise charges. What you see is what you get.'
    },
    {
      title: 'Personal Advisor Support',
      description: 'Every member has access to dedicated advisors who provide personalized guidance throughout your healthcare journey.'
    },
    {
      title: 'Comprehensive Wellness',
      description: 'Beyond medical cost sharing, we provide wellness resources, preventive care guidance, and virtual behavioral health support.'
    },
    {
      title: 'Technology-Enabled',
      description: 'Modern member portal and mobile app make managing your membership, submitting bills, and tracking sharing simple and efficient.'
    },
    {
      title: 'Proven Track Record',
      description: 'Since 2011, we\'ve helped thousands of members successfully share over millions in medical expenses with consistent, reliable service.'
    }
  ];

  return (
    <>
      <SEOHead
        pathname="/how-it-works"
        structuredDataType="faq"
        structuredDataContent={{ questions: faqsForSchema }}
      />

      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-8">
              <Link to="/" className="text-sm text-neutral-600 hover:text-blue-600 transition-colors">
                ← Back to Home
              </Link>
            </nav>

            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
                How Medical Cost Sharing Works
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Discover how thousands of members work together to share healthcare costs through our community-based approach.
                Simple, transparent, and designed with you in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-white via-[#F8FBFF] to-neutral-50 py-12 sm:py-16">
          <HowItWorksAnimation />
        </div>

        <div id="why-different" className="bg-gradient-to-b from-white to-neutral-50 py-16 sm:py-20 scroll-mt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                What Makes MPB Health Different
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                We're not just another health sharing organization. Here's what sets us apart
                and makes us the trusted choice for thousands of families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyDifferent.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-6 border border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                Common Questions About the Process
              </h2>
              <p className="text-lg text-neutral-600">
                Get answers to frequently asked questions about how health sharing works at MPB Health.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8">
              <Accordion type="single">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>
                      <span className="text-left font-semibold text-neutral-900 text-base sm:text-lg">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-neutral-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="mt-8 text-center">
              <p className="text-neutral-600 mb-4">
                Have more questions?{' '}
                <Link to="/faq" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                  Visit our full FAQ page
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-teal-600 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
              Join thousands of families who have discovered a better way to manage healthcare costs.
              Get a personalized quote in minutes or speak with an advisor.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/get-started">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold px-8"
                >
                  Get Free Quote
                </Button>
              </Link>

              <a href="tel:8558164650">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold px-8"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  (855) 816-4650
                </Button>
              </a>
            </div>

            <p className="text-blue-100 text-sm mt-6">
              No obligation. No pressure. Just honest answers to your questions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export { HowItWorksPage };
export default HowItWorksPage;
