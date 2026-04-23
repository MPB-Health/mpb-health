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
  CalendarCheck,
  Eye,
  Phone,
  Heart,
  Users,
  Zap,
  DollarSign,
  FileText,
  Hourglass,
  ArrowRight,
  Video,
  ShieldCheck,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const faqsForSchema = [
  {
    question: 'Is MPB Health a type of insurance?',
    answer: 'No. MPB Health is a medical cost sharing community, not an insurance company. Members work together to share eligible medical expenses, rather than paying premiums to a corporate entity.',
  },
  {
    question: 'What is an Initial Unshareable Amount (IUA)?',
    answer: 'The IUA is the specific dollar amount you take personal responsibility for when an eligible medical need arises. Once you have met this amount, the rest of the eligible expenses for that specific need are shared by the community.',
  },
  {
    question: 'Do I need to belong to a specific religion or sign a statement of faith to join?',
    answer: 'No. Unlike many faith-based healthshares, MPB Health has no religious requirements. We are a community open to everyone, and we welcome individuals and families from all backgrounds and belief systems.',
  },
  {
    question: 'Can I really see any doctor I want?',
    answer: 'Yes. MPB Health does not have restrictive provider networks for Health Sharing. You have the freedom to choose any doctor, specialist, or facility that fits your needs.',
  },
  {
    question: 'What kinds of medical expenses are eligible for sharing?',
    answer: 'Eligible expenses generally include hospitalizations, surgeries, emergency room visits, maternity care, and many other medically necessary services. For more information, please view our Member Guidelines for a comprehensive list of what qualifies for sharing within the community.',
  },
  {
    question: 'Can prescription medications be shared?',
    answer: 'Eligible prescription expenses may be shared when they are part of a larger, eligible medical need. Additionally, certain memberships include access to RX Valet, which provides deeply discounted pricing on thousands of prescriptions.',
  },
  {
    question: 'Does care received outside the United States qualify for sharing?',
    answer: 'Yes. Emergency or urgent care expenses incurred outside the United States or Puerto Rico may be eligible for sharing, subject to the Member Guidelines. If a medical need arises while you are traveling, the community is designed to support you.',
  },
  {
    question: 'What if I have a pre-existing condition?',
    answer: 'MPB Health does not turn anyone away based on medical history. While brand-new medical needs qualify for sharing immediately, pre-existing conditions typically follow a 12-month phase-in window. However, certain managed conditions\u2014like diabetes or high blood pressure\u2014may be eligible for sharing from Day One, provided there has been no related hospitalization in the past year.',
  },
  {
    question: 'Can MPB Health be offered to employees?',
    answer: 'Yes! Employers can provide their team with access to a medical cost sharing community as a cost-effective alternative to traditional group insurance, allowing employees to enjoy freedom of provider choice and significant monthly savings.',
  },
  {
    question: 'Why should I join MPB Health?',
    answer: 'Joining MPB Health means choosing a community-driven approach to health that prioritizes your freedom and your budget. Members typically save 30\u201360% monthly compared to traditional premiums, enjoy total provider choice with no network restrictions, and have 24/7 access to $0 virtual care and behavioral health resources. Whether you are looking for an inclusive environment with no religious requirements or a simpler way to manage medical costs, MPB Health provides a transparent, supportive alternative designed to put the power of healthcare back in your hands.',
  },
];

const benefits = [
  {
    icon: TrendingDown,
    title: 'Significant Savings',
    description:
      'Members typically save 30\u201360% per month compared to traditional insurance premiums. Instead of corporate overhead, contributions go directly toward supporting eligible medical needs within the community.',
  },
  {
    icon: Stethoscope,
    title: 'No Network Restrictions',
    description:
      'There are no network restrictions with MPB Health. Members can visit the doctor, specialist, or hospital of their choice, giving you full control over your care.',
  },
  {
    icon: CalendarCheck,
    title: 'Enroll Anytime',
    description:
      'No open enrollment windows. You can apply any time during the year with membership often beginning as soon as the first of the following month.',
  },
  {
    icon: Eye,
    title: 'Clear & Straightforward',
    description:
      'MPB Health operates with transparency and simplicity. Members understand how contributions are used with no hidden fees, confusing billing structures, or surprise costs.',
  },
];

const whatToKnow = [
  {
    icon: FileText,
    title: 'Eligibility & Guidelines',
    description:
      'MPB Health is open to individuals and families who are committed to maintaining a healthy lifestyle. Member guidelines clearly outline which medical expenses are eligible for sharing, along with the expectations for participating in the community.',
  },
  {
    icon: DollarSign,
    title: 'Your IUA Explained',
    description:
      'The Initial Unshareable Amount (IUA) ($1,250, $2,500, or $5,000) is the amount you are responsible for paying before sharing begins. Unlike traditional insurance deductibles, the IUA applies per medical need.',
  },
  {
    icon: Hourglass,
    title: 'Phase-In Periods',
    description:
      'New eligible medical needs may be shared from day one. Pre-existing conditions are subject to a phase-in period. Managed conditions such as diabetes, high blood pressure, and high cholesterol may be eligible sooner if there has been no related hospitalization within the past year.',
  },
];

const comparisonRows = [
  { healthshare: 'Monthly Share Amount', insurance: 'Monthly Premium' },
  { healthshare: 'Initial Unshareable Amount (IUA)', insurance: 'Deductible' },
  { healthshare: 'Sharing Request', insurance: 'Claim' },
  { healthshare: 'Member Guidelines', insurance: 'Policy' },
  { healthshare: 'Community-funded', insurance: 'Corporation-funded' },
  { healthshare: 'Any provider, zero restrictions', insurance: 'In-network / Out-of-network tiers' },
  { healthshare: 'Enroll any day of the year', insurance: 'Annual open enrollment windows' },
  { healthshare: 'Nonprofit member community', insurance: 'For-profit insurer' },
  { healthshare: 'Voluntary cost sharing', insurance: 'Binding contract' },
];

const whyDifferent = [
  {
    icon: Users,
    title: 'Open to Everyone',
    description:
      'Unlike many healthshare organizations that require a faith statement, MPB Health has no religious prerequisites. Membership is built around shared values of mutual support and wellness.',
  },
  {
    icon: Stethoscope,
    title: 'Total Provider Freedom',
    description:
      'Visit any licensed doctor, hospital, or specialist without referrals, network limitations, or prior-authorization hurdles for everyday care.',
  },
  {
    icon: Heart,
    title: 'Built-In Wellness Resources',
    description:
      'Every membership includes telehealth access, virtual behavioral health, prescription savings, and one-on-one advisor guidance\u2014at no extra cost.',
  },
  {
    icon: Zap,
    title: 'Quick, Transparent Processing',
    description:
      'Eligible expenses are typically processed within 60 days, with some resolved in as little as two weeks. Each sharing summary clearly outlines what was shared and how the amount was determined.',
  },
  {
    icon: CalendarCheck,
    title: 'No Enrollment Windows',
    description:
      'Apply any time of year! There are no annual enrollment periods, and membership can begin as soon as the first of the following month.',
  },
  {
    icon: TrendingDown,
    title: 'Budget-Friendly Contributions',
    description:
      'Monthly share amounts are often 30%\u201360% lower than comparable insurance premiums. Multiple IUA options allow you to choose the balance that fits your budget and comfort level.',
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
                A closer look at the MPB Health community and the straightforward
                way members manage healthcare costs together.
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
                  A healthshare is a member-driven, nonprofit community where
                  participants pool resources to cover each other&rsquo;s medical
                  expenses. Instead of premiums and policies, the model runs on
                  shared responsibility&mdash;everyone contributes a monthly amount,
                  and those funds go toward eligible healthcare costs across the
                  membership.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                  Healthsharing is not insurance, but it offers a practical,
                  time-tested path to affordable care. Thousands of families
                  across the country rely on this approach every day, and MPB
                  Health is designed to make that experience as seamless as
                  possible.
                </p>
                <Link
                  to="/3d-flip-book/zion-guidelines"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Read our Member Guidelines <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Decorative illustration */}
              <div className="relative" aria-hidden="true">
                <div className="rounded-2xl bg-gradient-to-br from-blue-100 via-white to-teal-100 border border-blue-100 aspect-[4/3] flex items-center justify-center overflow-hidden shadow-sm">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200 via-transparent to-transparent" />
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <Shield className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <Heart className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <Users className="w-7 h-7 text-blue-500" />
                    </div>
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
              {/* Decorative illustration */}
              <div className="relative order-2 lg:order-1" aria-hidden="true">
                <div className="rounded-2xl bg-gradient-to-br from-teal-100 via-white to-blue-100 border border-teal-100 aspect-[4/3] flex items-center justify-center overflow-hidden shadow-sm">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent" />
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-200 via-transparent to-transparent" />
                  <div className="relative grid grid-cols-2 gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <Users className="w-12 h-12 text-teal-600" />
                    </div>
                    <div className="w-24 h-24 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <DollarSign className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="w-24 h-24 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <Heart className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="w-24 h-24 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg flex items-center justify-center">
                      <ShieldCheck className="w-12 h-12 text-teal-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
                  How Does MPB Health Work?
                </h2>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  Every member makes a fixed monthly contribution based on their
                  chosen membership tier. When a medical need arises, the member
                  submits a sharing request through our online portal along with
                  the relevant documentation.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  Before sharing kicks in, you cover your Initial Unshareable
                  Amount (IUA)&mdash;the personal portion of each eligible need.
                  After that threshold is met, the community pools together to
                  cover the remainder based on the member guidelines. Payments
                  can go directly to your provider or be reimbursed to you, and
                  every sharing summary spells out exactly how the funds were
                  applied.
                </p>
              </div>
            </div>

            {/* ── MEC Plan + Telehealth cards ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
              {/* $0 Preventive Care card */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      $0 Preventive Care
                    </h3>
                    <p className="text-sm text-blue-600 font-medium">Included with MEC &bull; HSA-Eligible</p>
                  </div>
                </div>
                <p className="text-neutral-700 leading-relaxed mb-3">
                  Select MPB Health memberships include access to preventive care
                  through Minimum Essential Coverage (MEC). This includes services
                  like annual wellness visits, routine screenings, and recommended
                  vaccinations.
                </p>
                <p className="text-neutral-700 leading-relaxed">
                  When included, these services are available at no additional
                  cost when received from an in-network provider, in accordance
                  with plan guidelines.
                </p>
              </div>

              {/* Unlimited Telehealth card */}
              <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      Unlimited Telehealth Included
                    </h3>
                    <p className="text-sm text-teal-600 font-medium">$0 per visit &bull; Available 24/7</p>
                  </div>
                </div>
                <p className="text-neutral-700 leading-relaxed mb-3">
                  Every MPB Health member gets unlimited virtual doctor visits at
                  no additional cost. Whether it&rsquo;s a cold, a rash, a
                  prescription refill, or a quick medical question, you can
                  connect with a licensed provider from anywhere.
                </p>
                <p className="text-neutral-700 leading-relaxed">
                  Telehealth is available around the clock, seven days a week.
                  Skip the waiting room, avoid unnecessary urgent-care bills, and
                  get the care you need on your schedule.
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
                Why Families Choose Healthsharing
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                A growing number of households are moving away from traditional
                insurance. Here is what draws them to the healthshare model.
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
                Before You Join
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                We believe in full transparency. Here are the key details every
                prospective member should review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                Different language, different structure. Here is how the two
                models line up term for term.
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
              Healthsharing is not insurance, but it is a well-established,
              community-driven way to handle medical costs. MPB Health members
              have been sharing expenses together since 2011 with consistent
              service and complete financial transparency.
            </p>
          </div>
        </div>

        {/* ── 7. What Makes MPB Health Different ──────────────────── */}
        <div id="why-different" className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20 scroll-mt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                What Sets MPB Health Apart
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Not every healthshare is the same. Here is why families across
                the country trust MPB Health with their care.
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
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-neutral-600">
                Answers to the most common questions about the MPB Health sharing process.
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
                Still have questions?{' '}
                <Link
                  to="/faq"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Browse the full FAQ
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
              See what thousands of families already know&mdash;there is a better
              way to handle healthcare costs. Get a personalized quote in minutes
              or speak directly with an advisor.
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
              Zero obligation, zero pressure&mdash;just straightforward answers.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export { HowItWorksPage };
export default HowItWorksPage;
