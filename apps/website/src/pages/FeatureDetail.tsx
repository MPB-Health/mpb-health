import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import { healthcareFeatures } from '../data/healthcareFeaturesData';
import { FlowShell } from '../components/onboarding/FlowShell';
import {
  AuroraBand,
  FaqSection,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const NOT_INSURANCE =
  'MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines.';

/** Short audience tag for the hero kicker, mirroring the /features filter groups. */
const CATEGORY_BY_FEATURE: Record<string, string> = {
  'health-sharing': 'Medical care',
  'primary-care': 'Medical care',
  'urgent-care': 'Medical care',
  'maternity-care': 'Medical care',
  'preventive-care': 'Wellness',
  'mental-health': 'Wellness',
  'medical-weight-loss-support': 'Wellness',
  'membership-concierge': 'Support',
  'pet-telehealth': 'Support',
  'rx-benefits': 'Savings',
  'hsa-compatibility': 'Savings',
};

const WEIGHT_LOSS_PATHWAYS = {
  all: {
    title: 'MPB Health virtual care access',
    note: 'Available to all memberships. Virtual care provides access to a prescription. It does not include Rx Valet discounted pricing.',
    steps: [
      'Schedule a Virtual Primary Care appointment in the MPB Health app',
      'Meet with a licensed provider for evaluation, and if appropriate receive a prescription',
      'Fill your prescription at the pharmacy of your choice',
      'Manage follow-ups directly with your provider',
    ],
  },
  hsa: {
    title: 'Rx Valet program',
    note: 'Exclusive to Secure HSA members. Rx Valet provides member pricing and mail-order fulfillment.',
    steps: [
      'Select Rx Valet inside the MPB Health app',
      'Choose Mail Order, then Order Here',
      'Click Weight Loss Program at the top of the screen',
      'Select either "I have a prescription" or "I need a prescription"',
      'If needed, complete the qualifying questionnaire',
      'If approved, your prescription for compounded Semaglutide or compounded Tirzepatide is sent to the Rx Valet mail-order pharmacy',
      'Your medication is cold shipped via 2-day delivery',
    ],
  },
} as const;

const WEIGHT_LOSS_INCLUDED = {
  all: [
    'Virtual provider evaluation',
    'Prescription eligibility determination',
    'Ongoing medication management',
    'Follow-up consultations',
    'App-based scheduling and access',
  ],
  hsa: ['Access to Rx Valet', 'Mail-order pharmacy fulfillment', 'Monthly dosage verification', 'Member pricing'],
} as const;

const RX_PROGRAMS = [
  {
    title: 'Rx program: up to 80% off retail',
    text: 'Immediate savings at the pharmacy counter, with no paperwork or claims to file.',
    points: [
      'Save up to 80% on prescription medications at over 65,000 pharmacies nationwide',
      'No prior authorizations or formulary restrictions',
      'Generic and brand-name medications included',
      'Works at CVS, Walgreens, Walmart, Kroger, Costco, and most local pharmacies',
    ],
  },
  {
    title: 'Discounted supplements: 30% off all orders',
    text: 'Easy online ordering with home delivery for your wellness needs.',
    points: [
      'Save 30% on high-quality vitamins and supplements',
      'Premium brands and trusted formulations',
      'Fast, reliable shipping direct to your door',
      'Free shipping on orders over $50',
    ],
  },
] as const;

export const FeatureDetail: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const feature = healthcareFeatures.find((f) => f.id === featureId);
  const [activePathway, setActivePathway] = React.useState<'all' | 'hsa'>('all');

  if (!feature) {
    return (
      <>
        <Helmet>
          <title>Feature not found | MPB Health</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LandingPage className="fdt">
          <PageHero
            ariaLabel="Feature not found"
            align="center"
            title="We couldn't find that feature."
            lede="The link may be out of date. Every feature your membership can include is listed on one page."
            actions={
              <Link className="lr-btn lr-btn--white" to="/features">
                See all features
              </Link>
            }
          />
        </LandingPage>
      </>
    );
  }

  const isWeightLoss = feature.id === 'medical-weight-loss-support';
  const showsIuaNote = feature.id !== 'urgent-care' && feature.id !== 'mental-health';
  const stepCols = feature.howItWorks.length <= 4 ? feature.howItWorks.length : 3;
  const pathway = WEIGHT_LOSS_PATHWAYS[activePathway];
  const kicker = CATEGORY_BY_FEATURE[feature.id];

  return (
    <>
      <Helmet>
        <title>{feature.name} - Healthcare Features | MPB Health</title>
        <meta name="description" content={feature.shortDescription} />
        {feature.id === 'medical-weight-loss-support' && (
          <>
            <meta name="keywords" content="medical weight loss, GLP-1 medications, semaglutide, tirzepatide, virtual care, weight loss prescriptions, MPB Health, Rx Valet, telehealth weight loss" />
            <meta property="og:title" content="Medical Weight Loss Support | MPB Health" />
            <meta property="og:description" content={feature.shortDescription} />
            <meta property="og:image" content="/assets/BLOG IMAGES (29).png" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Medical Weight Loss Support | MPB Health" />
            <meta name="twitter:description" content={feature.shortDescription} />
            <meta name="twitter:image" content="/assets/BLOG IMAGES (29).png" />
          </>
        )}
      </Helmet>

      <LandingPage className="fdt">
        <PageHero
          ariaLabel={feature.name}
          kicker={kicker}
          title={feature.name}
          lede={feature.tagline}
          media={{ type: 'image', src: feature.heroImage, alt: feature.name }}
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                Get your quote
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/features">
                See all features
              </Link>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="About this feature">
            <div className="lr-inner">
              <Reveal>
                <h2 className="lr-h2">What this feature gives you.</h2>
                <div className="lr-prose">
                  <p>{feature.detailedDescription}</p>
                </div>
              </Reveal>
              <ul className="lr-ledger" style={{ marginTop: '2.5rem' }}>
                {feature.keyPoints.map((point) => (
                  <li key={point.title}>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {isWeightLoss ? (
            <>
              <section className="lr-sec lr-sec--soft" aria-label="How it works">
                <div className="lr-inner">
                  <SectionHead
                    title="How it works."
                    lede="Choose your pathway"
                    ledeMuted="based on your membership type."
                  />
                  <div className="lr-chips" role="group" aria-label="Choose a pathway">
                    <button
                      type="button"
                      className={`lr-chip${activePathway === 'all' ? ' is-active' : ''}`}
                      aria-pressed={activePathway === 'all'}
                      onClick={() => setActivePathway('all')}
                    >
                      All memberships
                    </button>
                    <button
                      type="button"
                      className={`lr-chip${activePathway === 'hsa' ? ' is-active' : ''}`}
                      aria-pressed={activePathway === 'hsa'}
                      onClick={() => setActivePathway('hsa')}
                    >
                      Secure HSA members
                    </button>
                  </div>
                  <div style={{ maxWidth: '52rem', margin: '2.5rem auto 0' }}>
                    <h3 className="lr-h3">{pathway.title}</h3>
                    <ol className="lr-steps" style={{ marginTop: '1rem' }}>
                      {pathway.steps.map((step, i) => (
                        <li key={step}>
                          <span className="lr-steps__num">{i + 1}</span>
                          <p>{step}</p>
                        </li>
                      ))}
                    </ol>
                    <p className="lr-note">{pathway.note}</p>
                  </div>
                </div>
              </section>

              <section className="lr-sec" aria-label="What is included">
                <div className="lr-inner">
                  <SectionHead
                    title="What's included."
                    lede="See what's available with your membership,"
                    ledeMuted="and what Secure HSA members get in addition."
                    align="left"
                  />
                  <div className="lr-split">
                    <Reveal>
                      <h3 className="lr-h3">For all memberships</h3>
                      <ul className="lr-checks" style={{ marginTop: '1rem' }}>
                        {WEIGHT_LOSS_INCLUDED.all.map((item) => (
                          <li key={item}>
                            <Check strokeWidth={3} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                    <Reveal>
                      <h3 className="lr-h3">Additional benefits for Secure HSA members</h3>
                      <ul className="lr-checks" style={{ marginTop: '1rem' }}>
                        {WEIGHT_LOSS_INCLUDED.hsa.map((item) => (
                          <li key={item}>
                            <Check strokeWidth={3} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="lr-sec lr-sec--soft" aria-label="How it works">
                <div className="lr-inner">
                  <SectionHead title="How it works." align="left" />
                  <ol className="lr-steps lr-steps--cols" style={{ '--cols': stepCols } as React.CSSProperties}>
                    {feature.howItWorks.map((step, i) => (
                      <li key={step}>
                        <span className="lr-steps__num">{i + 1}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="lr-sec" aria-label="What is included">
                <div className="lr-inner">
                  <SectionHead
                    title="What's included."
                    lede={showsIuaNote ? 'Eligible for sharing' : undefined}
                    ledeMuted={showsIuaNote ? 'after your Initial Unshareable Amount (IUA) is met.' : undefined}
                    align="left"
                  />
                  <ul className="lr-ledger lr-ledger--tight">
                    {feature.membership.map((item) => (
                      <li key={item}>
                        <p>{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          )}

          <section className="lr-sec lr-sec--soft" aria-label="Memberships that include this feature">
            <div className="lr-inner">
              <SectionHead
                title="Memberships that include this feature."
                lede="Available on the following memberships."
                ledeMuted="Find the one that fits your needs."
                align="left"
              />
              <ul className="lr-ledger lr-ledger--3 lr-ledger--tight">
                {feature.eligiblePlans.map((plan) => (
                  <li key={plan}>
                    <h3>
                      <Link to="/plans">{plan}</Link>
                    </h3>
                  </li>
                ))}
              </ul>
              <p style={{ margin: '2rem 0 0' }}>
                <Link className="lr-btn lr-btn--ghost lr-btn--sm" to="/plans">
                  Compare all memberships
                </Link>
              </p>
            </div>
          </section>

          {feature.id === 'rx-benefits' && (
            <section className="lr-sec" aria-label="Prescription savings programs">
              <div className="lr-inner">
                <SectionHead
                  title="Two ways to save on medications."
                  lede="A discount card that works at the counter,"
                  ledeMuted="and a supplement program that ships to your door."
                  align="left"
                />
                <ul className="lr-ledger">
                  {RX_PROGRAMS.map((program) => (
                    <li key={program.title}>
                      <h3>{program.title}</h3>
                      <p>{program.text}</p>
                      <ul className="lr-checks" style={{ marginTop: '1.2rem' }}>
                        {program.points.map((point) => (
                          <li key={point}>
                            <Check strokeWidth={3} />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <p className="lr-body" style={{ marginTop: '2rem', maxWidth: '44rem' }}>
                  Members using both programs save an average of <strong>$1,200+ a year</strong> on
                  prescriptions and supplements. The discount card works instantly at checkout, and the
                  supplement program ships directly to your home.
                </p>
              </div>
            </section>
          )}

          {(feature.examples.length > 0 || feature.disclaimer) && (
            <section className="lr-sec lr-sec--hair" aria-label="Real-world examples">
              <div className="lr-inner">
                {feature.examples.length > 0 && (
                  <>
                    <SectionHead title="Real-world examples." align="left" />
                    <ul className="lr-ledger lr-ledger--1">
                      {feature.examples.map((example) => (
                        <li key={example}>
                          <p>{example}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {feature.disclaimer && <p className="lr-note">{feature.disclaimer}</p>}
              </div>
            </section>
          )}

          {feature.faqs.length > 0 && (
            <FaqSection items={feature.faqs} intro={`Answers to the questions members ask most about ${feature.name.toLowerCase()}.`} />
          )}

          <section className="lr-sec lr-sec--soft" aria-label="Find your membership" id="get-started-flow">
            <div className="lr-inner">
              <SectionHead
                title="Find the membership that fits."
                lede="Answer a few quick questions"
                ledeMuted={`and we'll point you to the membership that includes ${feature.name.toLowerCase()} and the other features you need.`}
              />
              <div className="lr-panel lr-formwrap lr-flow">
                <FlowShell />
              </div>
              <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                Takes less than two minutes. No personal information required.
              </p>
            </div>
          </section>

          <AuroraBand
            title={
              isWeightLoss
                ? 'Ready to take control of your weight loss journey?'
                : 'Questions? Talk to a specialist.'
            }
            lede={
              isWeightLoss
                ? 'Schedule a virtual visit with a licensed provider today, right from the MPB Health app.'
                : 'Our healthcare specialists can help you understand your options and find the right membership for your needs.'
            }
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to={isWeightLoss ? '/plans' : '/contact'}>
                  {isWeightLoss ? 'See memberships' : 'Schedule a consultation'}
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note={NOT_INSURANCE}
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default FeatureDetail;
