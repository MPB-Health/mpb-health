import React from 'react';
import { UserPlus, BookOpen, CreditCard, HeartHandshake, Sparkles } from 'lucide-react';
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
          Choose the MPB Health membership that fits your family's needs and budget.
          Our advisors guide you through the simple enrollment process.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Personalized plan matching based on family size and budget</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Dedicated advisor support throughout enrollment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Quick 10-minute application with transparent guidelines</span>
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
    title: "Learn the Guidelines",
    shortTitle: "Learn",
    icon: BookOpen,
    body: (
      <>
        <p className="mb-3">
          Understand our member guidelines and know which medical expenses are
          eligible for sharing. Our team is always available to answer questions.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Review sharing eligibility and member expectations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              Understand your{" "}
              <GlossaryTooltip term="IUA" definition="Initial Unshareable Amount -- your portion of an eligible medical need before community sharing begins." />{" "}
              options ($1,250, $2,500, or $5,000)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Learn about waiting periods and pre-membership conditions</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      faqLink: "/faq#iua-selection",
    },
  },
  {
    id: 3,
    title: "Contribute Monthly",
    shortTitle: "Contribute",
    icon: CreditCard,
    body: (
      <>
        <p className="mb-3">
          Make your monthly share contribution to the community. Select your IUA
          level to balance monthly costs with out-of-pocket responsibility.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Automatic monthly payments for convenience</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Transparent pricing with no hidden fees</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Higher IUA means lower monthly share amounts</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 4,
    title: "Share Medical Costs",
    shortTitle: "Share",
    icon: HeartHandshake,
    body: (
      <>
        <p className="mb-3">
          When you have an eligible medical need, submit your sharing request
          through our secure member portal. The community shares the cost.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>See any doctor or hospital with no network restrictions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Upload bills through our secure member portal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Payments sent directly to providers when possible</span>
          </li>
        </ul>
      </>
    ),
    meta: {
      timeEstimate: "~60 days processing",
      docsNeeded: "Itemized bills, provider info",
    },
  },
  {
    id: 5,
    title: "Thrive With Support",
    shortTitle: "Thrive",
    icon: Sparkles,
    body: (
      <>
        <p className="mb-3">
          Live confidently with ongoing advisor support, virtual care access,
          wellness resources, and a community that has your back.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>24/7 virtual care and behavioral health resources</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Dedicated advisor access throughout membership</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <GlossaryTooltip term="HSA-compatible" definition="Designed to meet Health Savings Account rules; consult your tax advisor." />{" "}
              plans for tax-advantaged savings
            </span>
          </li>
        </ul>
      </>
    ),
    meta: {
      faqLink: "/faq#ongoing-support",
    },
  },
];
