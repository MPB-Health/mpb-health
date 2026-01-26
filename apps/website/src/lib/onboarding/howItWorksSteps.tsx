import React from 'react';
import { UserPlus, DollarSign, CreditCard, Stethoscope, FileText, Upload, Users, HeartHandshake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GlossaryTooltip } from '../../components/blocks/GlossaryTooltip';

export interface HowItWorksStep {
  id: number;
  title: string;
  shortTitle: string;
  body: React.ReactNode;
  icon: LucideIcon;
  details?: string[];
  meta?: {
    timeEstimate?: string;
    docsNeeded?: string;
    faqLink?: string;
  };
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 1,
    title: "Join MPB Health",
    shortTitle: "Join",
    icon: UserPlus,
    body: (
      <>
        <p className="mb-3">
          Become a member of a community that shares eligible medical costs. Your
          advisor helps you pick the right membership for your needs.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Personalized plan matching based on your family size and budget</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Dedicated advisor support throughout enrollment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Quick application process with transparent guidelines</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      timeEstimate: "10 minutes",
      docsNeeded: "Basic health information",
    },
  },
  {
    id: 2,
    title: "Choose your IUA",
    shortTitle: "Set IUA",
    icon: DollarSign,
    body: (
      <>
        <p className="mb-3">
          Select your{" "}
          <GlossaryTooltip term="IUA" definition="Initial Unshareable Amount — your portion of an eligible medical need before community sharing begins." />{" "}
          level to match your budget and risk tolerance.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>IUA ($1,250, $2,500 or $5,000)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Choose the IUA that fits your budget</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Flexibility to adjust annually based on needs</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      timeEstimate: "5 minutes",
      faqLink: "/faq#iua-selection",
    },
  },
  {
    id: 3,
    title: "Make your Monthly Share",
    shortTitle: "Pay Share",
    icon: CreditCard,
    body: (
      <>
        <p className="mb-3">
          Contribute a fixed monthly share to the community pool to remain in good standing.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Automatic monthly payments for convenience</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Transparent pricing with no hidden fees</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Easy online portal for payment management</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 4,
    title: "Get Care When You Need It",
    shortTitle: "Get Care",
    icon: Stethoscope,
    body: (
      <>
        <p className="mb-3">
          Start with $0 virtual care for everyday needs. For in-person visits, choose
          any doctor or hospital with no network restrictions.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>24/7 Virtual Care access at no additional cost</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Advisor support for care navigation</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      faqLink: "/faq#getting-care",
    },
  },
  {
    id: 5,
    title: "An Expense Happens",
    shortTitle: "Track Bills",
    icon: FileText,
    body: (
      <>
        <p className="mb-3">
          For a new medical need, keep itemized bills, notes, and provider details
          so everything's ready for submission.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Request itemized bills from your providers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Keep records of dates, diagnoses, and treatments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Note your provider and date of service</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      docsNeeded: "Itemized bills, provider info",
    },
  },
  {
    id: 6,
    title: "Submit Your Bills",
    shortTitle: "Submit",
    icon: Upload,
    body: (
      <>
        <p className="mb-3">
          Upload bills through the member portal. Our team reviews against
          guidelines, including{" "}
          <GlossaryTooltip term="Pre-membership conditions" definition="Conditions present before joining; waiting periods or limits may apply per guidelines." />
          .
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Secure online portal for document uploads</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Expert review team evaluates eligibility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Clear communication throughout the review process</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      timeEstimate: "10-15 minutes",
      docsNeeded: "Bills, medical records",
    },
  },
  {
    id: 7,
    title: "Community Shares the Cost",
    shortTitle: "Sharing",
    icon: Users,
    body: (
      <>
        <p className="mb-3">
          After your IUA, the community pool helps pay eligible expenses per the
          sharing guidelines. You receive clear explanations of what's shared.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Payments sent directly to providers when possible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Detailed sharing summaries for your records</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Transparent breakdown of shared and unshared amounts</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 8,
    title: "Ongoing Support",
    shortTitle: "Support",
    icon: HeartHandshake,
    body: (
      <>
        <p className="mb-3">
          Advisors, virtual behavioral health resources, and more keep you
          confident across future health events. Consider{" "}
          <GlossaryTooltip term="HSA-compatible" definition="Designed to meet Health Savings Account rules; consult your tax advisor." />{" "}
          options if tax-advantaged saving matters to you.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>24/7 member support and advisor access</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>Virtual behavioral health and wellness resources included</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">•</span>
            <span>HSA-compatible plans for tax-advantaged savings</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      faqLink: "/faq#ongoing-support",
    },
  },
];
