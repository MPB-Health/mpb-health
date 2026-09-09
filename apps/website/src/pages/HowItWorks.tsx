import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SEOHead } from '../components/SEOHead';
import {
  AuroraBand,
  FaqSection,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';
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
import './how-it-works.css';

const GUIDELINES_PATH = '/3d-flip-book/zion-guidelines';

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const JOURNEY = [
  {
    title: 'Choose your membership',
    text: 'Explore MPB Health membership options and choose the membership that fits your healthcare needs and priorities.',
  },
  {
    title: 'Contribute monthly',
    text: "Make your monthly membership contribution based on the membership you've selected.",
  },
  {
    title: 'Get care when you need it',
    text: 'Visit the healthcare providers you choose and use the healthcare resources available through your membership.',
  },
  {
    title: 'Meet your IUA/MRA',
    text: 'This is the amount you are responsible for paying before eligible expenses can be shared.',
  },
  {
    title: 'Submit your medical expense',
    text: 'When you have a medical expense that may be eligible for sharing, submit the required information for review according to your membership guidelines.',
  },
  {
    title: 'The community shares',
    text: 'Eligible medical expenses are shared according to the rules and requirements of your membership.',
  },
];

const CARE_STEPS = [
  {
    title: 'Receive care',
    text: 'Visit a provider as a cash pay patient and receive the care you need.',
  },
  {
    title: 'Submit your expenses in the MPB Health app',
    text: 'Provide the necessary documentation through the applicable MPB process.',
  },
  {
    title: 'Your expense is reviewed',
    text: 'The medical expense is reviewed according to the guidelines for your membership.',
  },
  {
    title: 'Your member responsibility is applied',
    text: 'Depending on your membership, you may have a member responsibility amount that applies before the community shares eligible expenses.',
  },
  {
    title: 'Eligible expenses are shared',
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
  { title: 'Preventive care', text: 'Eligible preventive services and screenings.', Icon: Heart },
  { title: 'HSA compatibility', text: 'Certain memberships are designed to be HSA-compatible.', Icon: PiggyBank },
  { title: 'Dental discounts', text: 'Discounted pricing on dental care.', Icon: Smile },
  { title: 'Virtual care', text: 'Convenient access to virtual healthcare.', Icon: Video },
  { title: 'Behavioral health', text: 'Virtual behavioral health resources.', Icon: Brain },
  { title: 'Prescription resources', text: 'Access to available prescription programs and resources.', Icon: Pill },
  { title: 'Member support', text: 'Personalized guidance when navigating healthcare.', Icon: Headset },
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
  },
  {
    title: 'Provider choice',
    text: 'Eligible members can seek care from licensed healthcare providers without traditional insurance network restrictions, subject to applicable membership requirements.',
    Icon: Stethoscope,
  },
  {
    title: 'Convenient virtual care',
    text: 'Access virtual healthcare resources available through your membership.',
    Icon: Video,
  },
  {
    title: 'Preventive care',
    text: 'Eligible memberships include access to preventive care resources.',
    Icon: Heart,
  },
  {
    title: 'Member support',
    text: 'Get personalized support navigating your healthcare membership.',
    Icon: Headset,
  },
  {
    title: 'Transparent guidelines',
    text: 'Understand how eligible medical expenses are handled through clearly defined membership guidelines.',
    Icon: ShieldCheck,
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
      <ol className="hiw-journey__list">
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

      <LandingPage className="hiw">
        <PageHero
          ariaLabel="How health sharing works"
          kicker="How it works"
          title="How health sharing works."
          lede={
            <>
              A simple, transparent approach to managing eligible healthcare expenses together.{' '}
              <strong>Members contribute monthly</strong> and the community shares eligible medical
              expenses according to membership guidelines.
            </>
          }
          micro="Health sharing is not health insurance. Memberships are subject to eligibility requirements and member guidelines."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                Get your quote
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/plans">
                See memberships
              </Link>
            </>
          }
          rail={[
            { value: '6', label: 'Steps from joining to sharing' },
            { value: '$0', label: 'Virtual care, included' },
            { value: '12,000+', label: 'Families served' },
          ]}
          media={{
            type: 'image',
            src: '/assets/howitworks.png',
            alt: 'Three members relaxing and talking together in a sunlit living room',
            width: 1600,
            height: 1066,
          }}
        />

        <Sheet>
          {/* ── 1. What is health sharing? ───────────────────────────── */}
          <section className="lr-sec lr-sec--top" aria-label="What is health sharing">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/how-it-works-community.png"
                      alt="A group of people placing their hands together, symbolizing the MPB Health sharing community"
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">What is health sharing</p>
                  <h2 className="lr-h2">
                    Healthcare built
                    <br />
                    around community.
                  </h2>
                  <p className="lr-twotone">
                    Instead of paying an insurer a premium,{' '}
                    <span>members contribute monthly and share eligible medical expenses.</span>
                  </p>
                  <p className="lr-body">
                    Health sharing, also called medical cost sharing, is a membership-based approach
                    to managing eligible medical expenses. Members make a monthly contribution and
                    participate in a community where eligible medical expenses are shared according
                    to the applicable membership guidelines.
                  </p>
                  <p className="lr-body">
                    When a member has an eligible medical need, the expense is submitted for review.
                    If it meets the requirements of the member&rsquo;s selected membership, the
                    community contributes toward the eligible expense according to those guidelines.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.1}>
                <div className="hiw-simple">
                  <p className="hiw-simple__label">In simple terms</p>
                  <p className="hiw-simple__text">
                    Members contribute. Members receive care. <span>Eligible expenses are shared by the community.</span>
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 2. How does MPB Health sharing work? (signature) ─────── */}
          <section className="lr-sec lr-sec--hair" aria-label="How does MPB Health sharing work">
            <div className="lr-inner">
              <SectionHead
                eyebrow="The process"
                title="Six steps from joining to sharing."
                lede="From choosing a membership to the community sharing an expense,"
                ledeMuted="here is how it works."
              />
              <JourneyFlow />
            </div>
          </section>

          {/* ── 3. What happens when you need care? ──────────────────── */}
          <section className="lr-sec lr-sec--soft" aria-label="What happens when you need care">
            <div className="lr-inner">
              <div className="lr-split lr-split--flip">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/how-it-works-app.png"
                      alt="A member at home reviewing a medical expense on her phone with the paper bill in hand"
                      width={1400}
                      height={933}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">When you need care</p>
                  <h2 className="lr-h2">
                    What happens when
                    <br />
                    you need care?
                  </h2>
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
                  <p style={{ marginTop: '1.8rem' }}>
                    <Link to={GUIDELINES_PATH} className="lr-more">
                      Membership guidelines <ArrowRight />
                    </Link>
                  </p>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── 4. Member responsibility amount ──────────────────────── */}
          <section className="lr-sec" aria-label="Understanding your member responsibility amount">
            <div className="lr-inner">
              <Reveal>
                <div className="hiw-mra">
                  <div>
                    <p className="lr-eyebrow">Member responsibility</p>
                    <h2 className="lr-h2">Understanding your member responsibility amount.</h2>
                    <p className="hiw-mra__sub">Also called an Initial Unshareable Amount (IUA)</p>
                  </div>
                  <div>
                    <p className="lr-body">
                      Your membership may include a personal responsibility amount. Depending on the
                      membership you choose, you may be responsible for a specified amount of an
                      eligible medical need before the community begins sharing. The name and
                      structure of this responsibility can vary by membership.
                    </p>
                    <div className="hiw-mra__important">
                      <p className="hiw-mra__important-label">Important</p>
                      <p className="hiw-mra__important-text">
                        There is no one-size-fits-all member responsibility across MPB memberships.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 5. What medical expenses can be shared? ──────────────── */}
          <section className="lr-sec lr-sec--hair" aria-label="What medical expenses can be shared">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Eligibility"
                title="What medical expenses can be shared?"
                lede="Not every healthcare expense automatically qualifies for sharing."
                ledeMuted="Eligibility is set by the Member Guidelines for your membership and can depend on:"
              />

              <Reveal>
                <ul className="hiw-eligible__factors">
                  {ELIGIBILITY_FACTORS.map(({ label, Icon }) => (
                    <li key={label} className="hiw-eligible__factor">
                      <Icon strokeWidth={1.8} aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="hiw-eligible__why">
                  <h3 className="lr-h3">Why this matters</h3>
                  <p className="lr-body">
                    Before joining, it&rsquo;s important to understand what your selected membership
                    does and does not provide for.
                  </p>
                  <p style={{ marginTop: '1rem' }}>
                    <Link to={GUIDELINES_PATH} className="lr-more">
                      Read the Member Guidelines <ArrowRight />
                    </Link>
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 6. Preventive care & everyday healthcare ─────────────── */}
          <section className="lr-sec lr-sec--soft" aria-label="Preventive care and everyday healthcare">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/how-it-works-everyday.png"
                      alt="A family preparing a healthy breakfast together in a bright kitchen"
                      width={1400}
                      height={933}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">Everyday healthcare</p>
                  <h2 className="lr-h2">
                    Preventive care and
                    <br />
                    everyday healthcare.
                  </h2>
                  <p className="lr-twotone">
                    Healthcare isn&rsquo;t only about unexpected medical needs.{' '}
                    <span>
                      Some MPB memberships include preventive care and other resources designed to
                      help members take a proactive approach to their health.
                    </span>
                  </p>
                  <div className="hiw-everyday__grid">
                    {EVERYDAY_RESOURCES.map(({ title, text, Icon }) => (
                      <div key={title} className="hiw-everyday__item">
                        <span className="lr-cell__tile">
                          <Icon strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="hiw-everyday__item-title">{title}</h3>
                          <p className="hiw-everyday__item-text">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── 7. Health sharing vs. traditional insurance ──────────── */}
          <section className="lr-sec" aria-label="Health sharing versus traditional health insurance">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Side by side"
                title="Health sharing vs. traditional insurance."
                lede="Familiar ideas, different words."
                ledeMuted="Here is how the two vocabularies line up."
              />

              <Reveal>
                <div className="hiw-compare">
                  <div className="hiw-compare__row hiw-compare__row--head">
                    <div className="hiw-compare__head-cell hiw-compare__head-cell--mpb">MPB Health sharing</div>
                    <div className="hiw-compare__head-cell">Traditional health insurance</div>
                  </div>
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.mpb} className="hiw-compare__row">
                      <div className="hiw-compare__cell hiw-compare__cell--mpb">{row.mpb}</div>
                      <div className="hiw-compare__cell hiw-compare__cell--ins">{row.ins}</div>
                    </div>
                  ))}
                </div>

                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  MPB Health memberships are not health insurance. MPB Health uses a voluntary medical
                  cost sharing model. Members participate in a community that shares eligible medical
                  expenses according to the applicable membership guidelines.
                </p>
              </Reveal>
            </div>
          </section>

          {/* ── 8. Why people choose MPB Health ──────────────────────── */}
          <section className="lr-sec lr-sec--soft" aria-label="Why people choose MPB Health">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Why people choose MPB Health"
                title="A modern approach to healthcare."
                lede="Community, choice and support,"
                ledeMuted="without the network telling you where to go."
              />
              <div className="lr-cells">
                {WHY_CHOOSE.map(({ title, text, Icon }, i) => (
                  <Reveal key={title} delay={i * 0.06}>
                    <div className="lr-cell">
                      <span className="lr-cell__tile">
                        <Icon strokeWidth={1.8} />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── 9. FAQ ───────────────────────────────────────────────── */}
          <div className="hiw-faq">
            <FaqSection
              title={
                <>
                  Questions about
                  <br />
                  health sharing
                </>
              }
              items={FAQS}
              intro={
                <>
                  The Member Guidelines have the full rules for every membership.{' '}
                  <Link to="/faq" className="lr-more">
                    Browse all FAQs <ArrowRight />
                  </Link>
                </>
              }
            />
          </div>

          {/* ── 10. Closing ──────────────────────────────────────────── */}
          <AuroraBand
            title="Understand your options. Choose what fits your life."
            lede="Explore MPB Health memberships and find the healthcare approach that fits your needs."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get your quote
                </Link>
                <Link className="lr-btn lr-btn--glass" to="/plans">
                  See memberships
                </Link>
              </>
            }
            note="Health sharing is not health insurance. MPB Health memberships do not guarantee payment of medical expenses and are subject to eligibility requirements and member guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { HowItWorksPage };
export default HowItWorksPage;
