import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SEOHead } from '../components/SEOHead';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import {
  ArrowRight,
  Brain,
  ClipboardList,
  FileCheck,
  FileText,
  Headset,
  Heart,
  History,
  Hourglass,
  Pill,
  PiggyBank,
  Scale,
  ShieldCheck,
  Smile,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';

const GUIDELINES_PATH = '/3d-flip-book/zion-guidelines';

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const JOURNEY = [
  {
    title: 'Choose Your Membership',
    text: 'Explore MPB Health membership options and choose the membership that fits your healthcare needs and priorities.',
  },
  {
    title: 'Contribute Monthly',
    text: "Make your monthly membership contribution based on the membership you've selected.",
  },
  {
    title: 'Get Care When You Need It',
    text: 'Visit the healthcare providers you choose and use the healthcare resources available through your membership.',
  },
  {
    title: 'Meet Your IUA/MRA',
    text: 'This is the amount you are responsible for paying before eligible expenses can be shared.',
  },
  {
    title: 'Submit Your Medical Expense',
    text: 'When you have a medical expense that may be eligible for sharing, submit the required information for review according to your membership guidelines.',
  },
  {
    title: 'The Community Shares',
    text: 'Eligible medical expenses are shared according to the rules and requirements of your membership.',
  },
];

const CARE_STEPS = [
  {
    title: 'Receive Care',
    text: 'Visit a provider as a cash pay patient and receive the care you need.',
  },
  {
    title: 'Submit Your Medical Expenses in the MPB Health App',
    text: 'Provide the necessary documentation through the applicable MPB process.',
  },
  {
    title: 'Your Expense Is Reviewed',
    text: 'The medical expense is reviewed according to the guidelines for your membership.',
  },
  {
    title: 'Your Member Responsibility Is Applied',
    text: 'Depending on your membership, you may have a member responsibility amount that applies before the community shares eligible expenses.',
  },
  {
    title: 'Eligible Expenses Are Shared',
    text: 'Once the applicable requirements are met, eligible expenses are shared according to your membership guidelines.',
  },
];

const ELIGIBILITY_FACTORS = [
  { label: 'The type of medical service', Icon: Stethoscope },
  { label: 'The reason for the service', Icon: ClipboardList },
  { label: 'Membership requirements', Icon: FileText },
  { label: 'Pre-membership conditions', Icon: History },
  { label: 'Waiting or phase-in provisions', Icon: Hourglass },
  { label: 'Applicable sharing maximums and exclusions', Icon: Scale },
  { label: 'Documentation and submission requirements', Icon: FileCheck },
];

const EVERYDAY_RESOURCES = [
  {
    title: 'Preventive Care',
    text: 'Eligible preventive services and screenings.',
    Icon: Heart,
    tint: 'green' as const,
  },
  {
    title: 'HSA Compatibility',
    text: 'Certain memberships are designed to be HSA-compatible.',
    Icon: PiggyBank,
    tint: 'blue' as const,
  },
  {
    title: 'Dental Discounts',
    text: 'Discounted pricing on dental care.',
    Icon: Smile,
    tint: 'blue' as const,
  },
  {
    title: 'Virtual Care',
    text: 'Convenient access to virtual healthcare.',
    Icon: Video,
    tint: 'green' as const,
  },
  {
    title: 'Behavioral Health',
    text: 'Virtual behavioral health resources.',
    Icon: Brain,
    tint: 'blue' as const,
  },
  {
    title: 'Prescription Resources',
    text: 'Access to available prescription programs and resources.',
    Icon: Pill,
    tint: 'blue' as const,
  },
  {
    title: 'Member Support',
    text: 'Personalized guidance when navigating healthcare.',
    Icon: Headset,
    tint: 'green' as const,
  },
];

const COMPARISON_ROWS = [
  { mpb: 'Monthly contribution', ins: 'Monthly premium' },
  { mpb: 'Community shares eligible expenses', ins: 'Insurer pays covered claims' },
  { mpb: 'IUA or Member Responsibility Amount', ins: 'Deductible' },
  { mpb: 'Sharing request', ins: 'Insurance claim' },
  { mpb: 'Member Guidelines', ins: 'Insurance policy' },
  { mpb: 'Voluntary participation', ins: 'Contractual coverage' },
  { mpb: 'Broad provider choice, varies by membership', ins: 'Network requirements and tiers' },
];

const WHY_CHOOSE = [
  {
    title: 'Community-driven',
    text: 'Members participate in a community built around sharing eligible medical expenses.',
    Icon: Users,
    tint: 'green' as const,
  },
  {
    title: 'Provider Choice',
    text: 'Eligible members can seek care from licensed healthcare providers without traditional insurance network restrictions, subject to applicable membership requirements.',
    Icon: Stethoscope,
    tint: 'blue' as const,
  },
  {
    title: 'Convenient Virtual Care',
    text: 'Access virtual healthcare resources available through your membership.',
    Icon: Video,
    tint: 'blue' as const,
  },
  {
    title: 'Preventive Care',
    text: 'Eligible memberships include access to preventive care resources.',
    Icon: Heart,
    tint: 'green' as const,
  },
  {
    title: 'Member Support',
    text: 'Get personalized support navigating your healthcare membership.',
    Icon: Headset,
    tint: 'blue' as const,
  },
  {
    title: 'Transparent Guidelines',
    text: 'Understand how eligible medical expenses are handled through clearly defined membership guidelines.',
    Icon: ShieldCheck,
    tint: 'green' as const,
  },
];

const FAQS = [
  {
    question: 'What is health sharing?',
    answer:
      'Health sharing is a membership-based approach to managing eligible medical expenses in which members contribute monthly and participate in a community that shares eligible expenses according to membership guidelines.',
  },
  {
    question: 'How does health sharing work?',
    answer:
      'Members make monthly contributions, receive healthcare, and submit eligible medical expenses for review. Expenses that meet the applicable membership guidelines may be shared by the member community.',
  },
  {
    question: 'Is health sharing the same as health insurance?',
    answer:
      'No. Health sharing is not health insurance. MPB Health uses a voluntary medical cost sharing model governed by membership guidelines rather than an insurance policy.',
  },
  {
    question: 'Does MPB Health pay for medical expenses?',
    answer:
      'MPB Health is not insurance and does not guarantee payment of medical expenses. Eligible medical expenses may be shared among members according to the guidelines of the selected membership.',
  },
  {
    question: 'Do I have to use a specific doctor or hospital?',
    answer:
      'Provider requirements vary by membership and service. MPB Health memberships can provide broad provider choice, while certain services, such as applicable preventive care, may have network requirements.',
  },
  {
    question: 'What is an IUA or MRA?',
    answer:
      'An IUA (Initial Unshareable Amount) or MRA (Member Responsibility Amount) is the amount the member must pay before eligible medical expenses are shared, depending on the membership. The specific amount and rules vary by membership.',
  },
  {
    question: 'Does MPB Health include preventive care?',
    answer:
      'Some MPB Health memberships include preventive care resources. Available services and requirements vary by membership.',
  },
  {
    question: 'Can I use an HSA with an MPB Health membership?',
    answer:
      'Certain MPB Health memberships are designed to be HSA-compatible. HSA eligibility and tax treatment depend on applicable requirements, so members should consult a qualified tax professional regarding their individual circumstances.',
  },
  {
    question: 'Where can I find the full rules for my membership?',
    answer:
      'The applicable Member Guidelines provide the detailed rules, requirements, eligible expenses, limitations, and member responsibilities for each membership.',
  },
];

/* ------------------------------------------------------------------ */
/*  Journey (signature visual)                                         */
/* ------------------------------------------------------------------ */

function JourneyFlow() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hiw-journey__flow">
      <motion.div
        className="hiw-journey__rail"
        aria-hidden="true"
        initial={reduceMotion ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {JOURNEY.map((step, index) => (
          <motion.li
            key={step.title}
            className={`hiw-journey__step${index % 2 === 1 ? ' hiw-journey__step--right' : ''}`}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hiw-journey__node" aria-hidden="true">
              {index + 1}
            </span>
            <div className="hiw-journey__content">
              <h3 className="hiw-journey__step-title">{step.title}</h3>
              <p className="hiw-journey__step-text">{step.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const HowItWorksPage: React.FC = () => {
  return (
    <>
      <SEOHead
        pathname="/how-it-works"
        structuredDataType="faq"
        structuredDataContent={{ questions: FAQS }}
      />

      <div className="lr hiw">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="How health sharing works">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <h1 className="hiw-hero__title">How Health Sharing Works</h1>
              <p className="hiw-hero__sub">
                A simple, transparent approach to managing eligible healthcare expenses together.
              </p>
              <p className="hiw-hero__lede">
                MPB Health uses a member-driven health sharing model where members contribute
                monthly and the community shares eligible medical expenses according to membership
                guidelines.
              </p>
              <p className="hiw-hero__note">
                Health sharing is not health insurance. Memberships are subject to eligibility
                requirements and member guidelines.
              </p>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/howitworks.png"
              alt="Three members relaxing and talking together in a sunlit living room"
              width={1600}
              height={1066}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── 1. What is health sharing? ───────────────────────────── */}
        <section className="hiw-section" aria-label="What is health sharing">
          <div className="hiw-inner">
            <div className="hiw-what__grid">
              <div>
                <h2 className="hiw-title">What Is Health Sharing?</h2>
                <p className="hiw-kicker">Healthcare built around community.</p>
                <p className="hiw-body">
                  Health sharing, also called medical cost sharing, is a membership-based approach
                  to managing eligible medical expenses. Instead of paying an insurance company a
                  premium, members make a monthly contribution and participate in a community where
                  eligible medical expenses are shared according to the applicable membership
                  guidelines.
                </p>
                <p className="hiw-body">
                  When a member has an eligible medical need, the expense is submitted for review.
                  If it meets the requirements of the member's selected membership, the community
                  contributes toward the eligible expense according to those guidelines.
                </p>
              </div>
              <img
                className="hiw-what__img"
                src="/assets/how-it-works-community.png"
                alt="A group of people placing their hands together, symbolizing the MPB Health sharing community"
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="hiw-simple">
              <p className="hiw-simple__label">In simple terms</p>
              <p className="hiw-simple__text">
                Members contribute. Members receive care. Eligible expenses are shared by the
                community.
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. How does MPB Health sharing work? (signature) ─────── */}
        <section className="hiw-section" aria-label="How does MPB Health sharing work">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">How Does MPB Health Sharing Work?</h2>
              <p className="hiw-kicker">Six steps from joining to sharing.</p>
            </div>
            <JourneyFlow />
          </div>
        </section>

        {/* ── 3. What happens when you need care? ──────────────────── */}
        <section className="hiw-section hiw-care" aria-label="What happens when you need care">
          <div className="hiw-inner">
            <div className="hiw-care__grid">
              <div className="hiw-care__media">
                <img
                  className="hiw-care__img"
                  src="/assets/how-it-works-app.png"
                  alt="A member at home reviewing a medical expense on her phone with the paper bill in hand"
                  width={1400}
                  height={933}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <h2 className="hiw-title">What Happens When You Need Care?</h2>
                <ol className="hiw-care__steps">
                  {CARE_STEPS.map((step, index) => (
                    <li key={step.title} className="hiw-care__step">
                      <span className="hiw-care__num" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="hiw-care__step-title">{step.title}</h3>
                        <p className="hiw-care__step-text">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link to={GUIDELINES_PATH} className="hiw-arrow-link">
                  Membership guidelines <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Member responsibility amount ──────────────────────── */}
        <section className="hiw-section" aria-label="Understanding your member responsibility amount">
          <div className="hiw-inner">
            <div className="hiw-mra__card">
              <h2 className="hiw-title">Understanding Your Member Responsibility Amount</h2>
              <p className="hiw-mra__sub">Also called an Initial Unshareable Amount (IUA)</p>
              <p className="hiw-mra__body">
                Your membership may include a personal responsibility amount. Depending on the
                membership you choose, you may be responsible for a specified amount of an eligible
                medical need before the community begins sharing. The name and structure of this
                responsibility can vary by membership.
              </p>
              <div className="hiw-mra__important">
                <p className="hiw-mra__important-label">Important</p>
                <p className="hiw-mra__important-text">
                  There is no one-size-fits-all member responsibility across MPB memberships.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. What medical expenses can be shared? ──────────────── */}
        <section className="hiw-section" aria-label="What medical expenses can be shared">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">What Medical Expenses Can Be Shared?</h2>
              <p className="hiw-kicker">Not every healthcare expense automatically qualifies for sharing.</p>
              <p className="hiw-body">
                Eligible medical expenses are determined by the Member Guidelines for the specific
                membership. Eligibility can depend on factors such as:
              </p>
            </div>

            <ul className="hiw-eligible__factors">
              {ELIGIBILITY_FACTORS.map(({ label, Icon }) => (
                <li key={label} className="hiw-eligible__factor">
                  <Icon strokeWidth={1.8} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="hiw-eligible__why">
              <h3 className="hiw-eligible__why-title">Why this matters</h3>
              <p className="hiw-eligible__why-text">
                Before joining, it's important to understand what your selected membership does and
                does not provide for.
              </p>
              <Link to={GUIDELINES_PATH} className="hiw-arrow-link">
                Read the Member Guidelines <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. Preventive care & everyday healthcare ─────────────── */}
        <section className="hiw-section" aria-label="Preventive care and everyday healthcare">
          <div className="hiw-inner">
            <div className="hiw-everyday__card">
              <img
                className="hiw-everyday__img"
                src="/assets/how-it-works-everyday.png"
                alt="A family preparing a healthy breakfast together in a bright kitchen"
                width={1400}
                height={933}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h2 className="hiw-title">Preventive Care &amp; Everyday Healthcare</h2>
                <p className="hiw-everyday__intro">
                  Healthcare isn't only about unexpected medical needs. Some MPB memberships
                  include access to preventive care and other healthcare resources designed to help
                  members take a proactive approach to their health. Depending on the membership,
                  resources may include:
                </p>
                <div className="hiw-everyday__grid">
                  {EVERYDAY_RESOURCES.map(({ title, text, Icon, tint }) => (
                    <div key={title} className="hiw-everyday__item">
                      <span className={`hiw-everyday__icon hiw-everyday__icon--${tint}`}>
                        <Icon strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="hiw-everyday__item-title">{title}</h3>
                        <p className="hiw-everyday__item-text">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Health sharing vs. traditional insurance ──────────── */}
        <section className="hiw-section" aria-label="Health sharing versus traditional health insurance">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Health Sharing vs. Traditional Health Insurance</h2>
            </div>

            <div className="hiw-compare__table">
              <div className="hiw-compare__accent" aria-hidden="true" />
              <div className="hiw-compare__row hiw-compare__row--head">
                <div className="hiw-compare__head-cell hiw-compare__head-cell--mpb">
                  MPB Health Sharing
                </div>
                <div className="hiw-compare__head-cell hiw-compare__head-cell--ins">
                  Traditional Health Insurance
                </div>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.mpb} className="hiw-compare__row">
                  <div className="hiw-compare__cell hiw-compare__cell--mpb">{row.mpb}</div>
                  <div className="hiw-compare__cell hiw-compare__cell--ins">{row.ins}</div>
                </div>
              ))}
            </div>

            <p className="hiw-compare__note">
              * MPB Health memberships are not health insurance. MPB Health uses a voluntary
              medical cost sharing model. Members participate in a community that shares eligible
              medical expenses according to the applicable membership guidelines.
            </p>
          </div>
        </section>

        {/* ── 8. Why people choose MPB Health ──────────────────────── */}
        <section className="hiw-section" aria-label="Why people choose MPB Health">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Why People Choose MPB Health</h2>
              <p className="hiw-kicker">A modern approach to healthcare.</p>
            </div>

            <div className="hiw-choose__grid">
              {WHY_CHOOSE.map(({ title, text, Icon, tint }) => (
                <div key={title} className="hiw-choose__item">
                  <span className={`hiw-choose__icon hiw-choose__icon--${tint}`}>
                    <Icon strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <h3 className="hiw-choose__item-title">{title}</h3>
                  <p className="hiw-choose__item-text">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. FAQ ───────────────────────────────────────────────── */}
        <section className="hiw-section hiw-faq" aria-label="Frequently asked questions about health sharing">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Frequently Asked Questions About Health Sharing</h2>
            </div>

            <div className="hiw-faq__panel">
              <Accordion type="single">
                {FAQS.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`}>
                    <AccordionTrigger>
                      <span className="text-left font-semibold text-base sm:text-lg" style={{ color: '#183392' }}>
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p style={{ color: '#52606d', lineHeight: 1.65 }}>{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── 10. Final banner ─────────────────────────────────────── */}
        <section className="hiw-final" aria-label="Understand your options">
          <div className="hiw-final__content">
            <h2 className="hiw-final__title">Understand your options. Choose what fits your life.</h2>
            <p className="hiw-final__sub">
              Explore MPB Health memberships and find the healthcare approach that fits your needs.
            </p>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { HowItWorksPage };
export default HowItWorksPage;
