import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { HowItWorks as HowItWorksAnimation } from '../components/blocks/HowItWorks';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Button } from '../components/ui/button';
import {
  Shield,
  TrendingDown,
  Stethoscope,
  Clock,
  CalendarCheck,
  Eye,
  Phone,
  Heart,
  Users,
  Zap,
  DollarSign,
  FileText,
  AlertCircle,
  Hourglass,
  ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const faqsForSchema = [
  {
    question: 'How long does the entire process take from enrollment to first sharing?',
    answer: 'Enrollment takes 10-15 minutes and your membership becomes effective on the first day of the following month if enrolled by the 20th of the prior month. Eligible needs may be submitted immediately. Typical processing is ~60 days, sometimes as little as 2 weeks.',
  },
  {
    question: 'What happens if I need medical care during a waiting period?',
    answer: "We don't decline membership based on medical history. New medical needs are shareable right away, while pre-existing conditions may have a phase-in period. Certain managed conditions\u2014like diabetes, high blood pressure, and high cholesterol\u2014can be eligible from Day One if there's been no hospitalization in the past year. Pre-membership conditions have a 12-month waiting period before they become eligible for sharing. Accidents are eligible immediately.",
  },
  {
    question: 'How do I know if a medical expense will be shared?',
    answer: 'Your membership guidelines outline what types of medical expenses are eligible for sharing. Our member support team can answer questions about specific situations and help you understand your sharing eligibility.',
  },
  {
    question: 'Can I switch my IUA level after enrollment?',
    answer: 'Yes. You may change your IUA once per year.',
  },
  {
    question: 'What if I disagree with a sharing decision?',
    answer: 'If you believe a submission was incorrectly denied or partially shared, you can request a formal review. Our appeals process includes a thorough re-evaluation by senior reviewers. Contact member support to initiate an appeal.',
  },
  {
    question: 'What happens if I miss a monthly share payment?',
    answer: "Monthly share amounts are automatically billed on the 20th of the month for the following month's payment. If the share amount is not paid by the last business day of the month, the membership will be cancelled effective on the last business day of the month.",
  },
  {
    question: 'Can I submit bills for care received before joining MPB Health?',
    answer: "No, only medical expenses incurred after your effective membership date are eligible for sharing consideration. Medical care received before joining, even if you haven't been billed yet, is not eligible.",
  },
];

const benefits = [
  {
    icon: TrendingDown,
    title: 'Cost Efficiency',
    description:
      'MPB Health memberships typically cost 30\u201360% less than traditional insurance premiums. Your monthly share is transparent, predictable, and goes directly toward supporting fellow members.',
  },
  {
    icon: Stethoscope,
    title: 'Freedom of Choice',
    description:
      'Choose any doctor, specialist, or hospital nationwide. MPB Health has zero network restrictions\u2014your healthcare decisions are yours to make.',
  },
  {
    icon: CalendarCheck,
    title: 'Year-Round Enrollment',
    description:
      'Join MPB Health any time\u2014no waiting for open enrollment periods. Apply today and your membership can be effective as soon as the first of next month.',
  },
  {
    icon: Eye,
    title: 'Transparent & Simple',
    description:
      'As a nonprofit community, MPB Health openly shares how contributions are used. No hidden fees, no complicated billing, no surprises.',
  },
];

const whatToKnow = [
  {
    icon: FileText,
    title: 'Eligibility & Member Guidelines',
    description:
      'MPB Health welcomes individuals and families committed to a healthy lifestyle. Review our member guidelines to understand sharing eligibility and community expectations.',
  },
  {
    icon: AlertCircle,
    title: 'Medical Expense Sharing',
    description:
      'Not all medical expenses are eligible for sharing. Pre-membership conditions, elective procedures, and certain non-emergency treatments may have limitations. Our team helps you understand what\u2019s eligible.',
  },
  {
    icon: DollarSign,
    title: 'Initial Unshareable Amount (IUA)',
    description:
      'Your IUA ($1,250, $2,500, or $5,000) is the amount you\u2019re responsible for before community sharing begins. Unlike insurance deductibles that reset annually, the IUA applies per medical need.',
  },
  {
    icon: Hourglass,
    title: 'Waiting Periods',
    description:
      'New medical needs are shareable right away. Pre-existing conditions may have a 12-month phase-in period. Managed conditions like diabetes, high blood pressure, and high cholesterol can be eligible from Day One if there\u2019s been no hospitalization in the past year.',
  },
];

const comparisonRows = [
  { healthshare: 'Monthly Share Amount', insurance: 'Monthly Premium' },
  { healthshare: 'Initial Unshareable Amount (IUA)', insurance: 'Deductible' },
  { healthshare: 'Sharing Request', insurance: 'Claim' },
  { healthshare: 'Member Guidelines', insurance: 'Policy' },
  { healthshare: 'Community-shared', insurance: 'Company-paid' },
  { healthshare: 'Any provider, no networks', insurance: 'In-network / Out-of-network' },
  { healthshare: 'Year-round enrollment', insurance: 'Open enrollment periods' },
  { healthshare: 'Nonprofit community', insurance: 'For-profit corporation' },
  { healthshare: 'Voluntary sharing', insurance: 'Contractual obligation' },
];

const whyDifferent = [
  {
    icon: Users,
    title: 'No Religious Requirements',
    description:
      'Many healthshare communities require a statement of faith. MPB Health is open to everyone\u2014we\u2019re built on shared values of community support and healthy living, not religious affiliation.',
  },
  {
    icon: Stethoscope,
    title: 'Freedom to Choose Providers',
    description:
      'See any doctor, hospital, or specialist. No referrals needed, no network restrictions, no prior authorization for routine care.',
  },
  {
    icon: Heart,
    title: 'Comprehensive Support Services',
    description:
      'Beyond medical cost sharing\u2014access telemedicine, virtual behavioral health, prescription discounts, and dedicated advisor support.',
  },
  {
    icon: Zap,
    title: 'Fast & Transparent Sharing',
    description:
      'Our streamlined process means eligible expenses are typically processed in about 60 days, sometimes as quickly as 2 weeks. Clear explanations every step of the way.',
  },
  {
    icon: CalendarCheck,
    title: 'Year-Round Enrollment',
    description:
      'Apply any day of the year. No open enrollment windows, no waiting for a special period. Your membership can start as soon as the first of next month.',
  },
  {
    icon: TrendingDown,
    title: 'Affordable Monthly Contributions',
    description:
      'MPB Health memberships are often 30\u201360% less than traditional insurance premiums, with multiple IUA options to fit your budget.',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HowItWorksPage: React.FC = () => {
  return (
    <>
      <SEOHead
        pathname="/how-it-works"
        structuredDataType="faq"
        structuredDataContent={{ questions: faqsForSchema }}
      />

      <div className="min-h-screen bg-white">
        {/* ── 1. Hero ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-8">
              <Link to="/" className="text-sm text-neutral-600 hover:text-blue-600 transition-colors">
                &larr; Back to Home
              </Link>
            </nav>

            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
                How Medical Cost Sharing Works
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                All about the MPB Health medical cost sharing community
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. What Is a Healthshare? ───────────────────────────── */}
        <div className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
                  What Is a Healthshare?
                </h2>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  A healthshare is a nonprofit, membership-based community where members share the
                  cost of medical care instead of relying on traditional health insurance. Rather than
                  functioning through policies and premiums, MPB Health is built on the concept of
                  shared responsibility.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                  Members contribute monthly and those contributions help cover eligible medical
                  expenses for the community. While healthsharing is not insurance, it provides a
                  proven, community-based approach to managing healthcare costs that thousands of
                  families trust every day.
                </p>
                <Link
                  to="/member-guidelines"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Read our Member Guidelines <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Image placeholder */}
              <div className="relative">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 border border-neutral-200 aspect-[4/3] flex items-center justify-center">
                  <div className="text-center p-8">
                    <Shield className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <p className="text-neutral-400 text-sm">Community healthcare photo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. How Does MPB Health Work? (Narrative) ─────────────── */}
        <div className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Image placeholder */}
              <div className="relative order-2 lg:order-1">
                <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 border border-neutral-200 aspect-[4/3] flex items-center justify-center">
                  <div className="text-center p-8">
                    <Users className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                    <p className="text-neutral-400 text-sm">Family &amp; community photo</p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
                  How Does MPB Health Work?
                </h2>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  Each month, members contribute a share amount based on their membership type. When
                  a member has an eligible medical need, they submit a sharing request through our
                  member portal.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  Members are responsible for their Initial Unshareable Amount (IUA)&mdash;the
                  portion they pay before community sharing begins. Once the IUA is met, eligible
                  medical expenses are shared by the community according to our member guidelines.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  The community can facilitate direct provider payment or reimburse the member if
                  they&rsquo;ve already paid. You&rsquo;ll receive detailed sharing summaries
                  explaining exactly what was shared and why.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Benefits of a Healthshare ────────────────────────── */}
        <div className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                Benefits of a Healthshare
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Why thousands of families choose community-based healthcare over traditional insurance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{benefit.title}</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 5. What to Know Before Joining ──────────────────────── */}
        <div className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                What to Know Before Joining
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Transparency is a core value. Here&rsquo;s what every prospective member should understand.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {whatToKnow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                        <p className="text-neutral-700 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 6. Healthshare vs Traditional Insurance ─────────────── */}
        <div className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                Healthshare vs. Traditional Insurance
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Understand how the terms and structure compare side by side.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-2">
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    MPB Health (Healthshare)
                  </h3>
                </div>
                <div className="bg-neutral-800 px-6 py-4">
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    Traditional Insurance
                  </h3>
                </div>
              </div>

              {/* Table rows */}
              {comparisonRows.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-2 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}
                >
                  <div className="px-6 py-4 border-r border-neutral-200">
                    <span className="text-sm sm:text-base text-blue-700 font-medium">
                      {row.healthshare}
                    </span>
                  </div>
                  <div className="px-6 py-4">
                    <span className="text-sm sm:text-base text-neutral-600">{row.insurance}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-neutral-500 max-w-2xl mx-auto">
              While healthsharing is not insurance, it provides a proven, community-based approach
              to managing healthcare costs. MPB Health members have been sharing medical expenses
              together since 2011, with transparent operations and dedicated member support.
            </p>
          </div>
        </div>

        {/* ── 7. What Makes MPB Health Different ──────────────────── */}
        <div id="why-different" className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20 scroll-mt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                What Makes MPB Health Different
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                We&rsquo;re not just another health sharing organization. Here&rsquo;s what sets us apart
                and makes us the trusted choice for thousands of families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyDifferent.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-6 border border-neutral-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                    <p className="text-neutral-700 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 8. Interactive 5-Step Process ────────────────────────── */}
        <div className="bg-gradient-to-b from-white via-[#F8FBFF] to-neutral-50 py-12 sm:py-16">
          <HowItWorksAnimation />
        </div>

        {/* ── 9. FAQ ──────────────────────────────────────────────── */}
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
                {faqsForSchema.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>
                      <span className="text-left font-semibold text-neutral-900 text-base sm:text-lg">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-neutral-700 leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="mt-8 text-center">
              <p className="text-neutral-600 mb-4">
                Have more questions?{' '}
                <Link
                  to="/faq"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Visit our full FAQ page
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── 10. CTA ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
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
