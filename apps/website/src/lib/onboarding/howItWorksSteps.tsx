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
          Pick the membership tier that matches your household size and budget.
          One of our advisors walks you through the entire enrollment process so
          there are no surprises.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Advisor-guided plan matching tailored to your family</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>One-on-one support from application through activation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Straightforward 10-minute application with clear guidelines</span>
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
          Get familiar with the member guidelines so you know exactly which
          expenses qualify for sharing. Our support team is available whenever
          you have questions.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Review what qualifies for sharing and what the community expects</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              Choose your{" "}
              <GlossaryTooltip term="IUA" definition="Initial Unshareable Amount -- the portion you cover per eligible need before community sharing begins." />{" "}
              tier ($1,250, $2,500, or $5,000)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Understand phase-in periods for pre-existing conditions</span>
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
          Set up your monthly share contribution to the community fund. Your IUA
          selection determines the balance between monthly cost and out-of-pocket
          responsibility.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Auto-pay keeps your membership current effortlessly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Predictable pricing with zero hidden fees</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Selecting a higher IUA lowers your monthly amount</span>
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
          When an eligible medical need comes up, file a sharing request through
          our secure portal. The community steps in to cover costs beyond your
          IUA.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Visit any doctor or hospital without network limits</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Upload documentation directly in the member portal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Direct provider payment available when possible</span>
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
          Your membership goes well beyond bill sharing. Enjoy unlimited
          telehealth, behavioral health resources, and ongoing advisor access
          that keep you covered for whatever comes next.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>$0 unlimited virtual care around the clock</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Personal advisor available throughout your membership</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <GlossaryTooltip term="HSA-compatible" definition="Qualifies for Health Savings Account contributions; consult your tax advisor for details." />{" "}
              memberships paired with a MEC plan
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
