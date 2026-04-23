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
          Choose the membership tier that fits your household size and budget.
          One of our advisors will guide you through the enrollment process to
          ensure everything is clear and straightforward.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Guided Selection:</strong> One-on-one help to find the
              membership tier that fits your needs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Personalized Support:</strong> Expert assistance from your
              initial application through activation.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Quick Enrollment:</strong> A simple 10-minute application
              with transparent guidelines.
            </span>
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
          Review the member guidelines so you understand which expenses are
          eligible for sharing. Our support team is always available if you have
          questions along the way.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Review what qualifies for sharing and member expectations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              Choose your{" "}
              <GlossaryTooltip term="IUA" definition="Initial Unshareable Amount -- the portion you cover per eligible need before community sharing begins." />{" "}
              tier ($1,250, $2,500, or $5,000).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Understand phase-in periods for pre-existing conditions.</span>
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
          selection allows you to find the right balance between your monthly
          contribution and your personal responsibility when a medical need
          arises.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Set up auto-pay to keep your membership active.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              Enjoy the peace of mind that comes with a set monthly amount and
              zero hidden fees.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              Selecting a higher IUA lowers your monthly share amount, giving
              you the power to manage your household budget.
            </span>
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
          When an eligible medical need arises, simply file a sharing request
          through your Member Portal or MPB Health App.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Provider Freedom:</strong> Visit any doctor or hospital
              you prefer.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Simple Uploads:</strong> Submit your documentation
              directly through the member portal/App.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Direct Payment:</strong> We offer direct provider payment
              whenever possible to simplify the process.
            </span>
          </li>
        </ul>
      </>
    ),
    meta: {
      timeEstimate: "~60 days processing",
      docsNeeded: "Itemized bills and provider information",
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
          Your membership goes well beyond sharing medical costs. Enjoy
          unlimited telehealth, behavioral health resources, and ongoing advisor
          access.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>$0 Virtual Care:</strong> Access unlimited virtual care
              around the clock at no additional cost to you.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Personalized Guidance:</strong> Your personal advisor is
              available throughout your membership to help you navigate the
              community.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>
              <strong>Tax-Advantaged Options:</strong> Benefit from{" "}
              <GlossaryTooltip term="HSA-compatible" definition="Qualifies for Health Savings Account contributions; consult your tax advisor for details." />{" "}
              memberships when paired with Minimum Essential Coverage.
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
