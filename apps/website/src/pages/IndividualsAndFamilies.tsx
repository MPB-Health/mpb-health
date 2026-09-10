import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { AffiliateProvider } from '../components/AffiliateProvider';
import { QuickRateEstimateForm } from '../components/landing-redesign/QuickRateEstimateForm';
import {
  AuroraBand,
  FaqSection,
  LandingPage,
  PageHero,
  PlanGrid,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';
import { INDIVIDUAL_PLANS } from '../components/landing-redesign/plansData';
import {
  generateHealthSharePlanSchema,
  generateOrganizationSchema,
  generateFAQSchema,
  individualsAndFamiliesFaqQuestions,
} from '../lib/schemaMarkup';

const WHY = [
  {
    title: 'Save 30 to 60%',
    text: 'Typical families contribute far less each month than they would pay in traditional premiums.',
  },
  {
    title: 'See any provider',
    text: 'No narrow networks. Keep your pediatrician, your specialist and the hospital you trust.',
  },
  {
    title: 'A real community',
    text: 'Eligible medical expenses are shared by a nationwide community of members, not an insurer.',
  },
  {
    title: 'Transparent pricing',
    text: 'Clear monthly contributions and a single member responsibility amount. No surprise bills.',
  },
  {
    title: 'Sharing that travels',
    text: 'Support that goes with you across the country and around the world.',
  },
  {
    title: 'Maternity sharing',
    text: 'Prenatal, delivery, postnatal and newborn care are eligible for sharing on qualifying memberships.',
  },
] as const;

const EVERYDAY = [
  {
    title: '$0 virtual care, day one',
    body: 'Unlimited 24/7 urgent care, continuous primary care and behavioral health visits at no cost.',
  },
  {
    title: 'A personal concierge',
    body: 'A real person schedules visits, walks you through sharing requests and answers questions fast.',
  },
  {
    title: 'Pharmacy savings',
    body: 'Over 1,000 medications at $0 or under $14.95, plus 30% off vitamins and supplements.',
  },
] as const;

const JOURNEY = [
  {
    title: 'Get a quick estimate',
    text: 'Tell us who needs care and see every membership priced for your household in about 30 seconds.',
  },
  {
    title: 'Talk to an advisor',
    text: 'Compare options with someone who understands your healthcare goals. No pressure, no scripts.',
  },
  {
    title: 'Enroll online',
    text: 'Join any month of the year. There is no open enrollment window to wait for.',
  },
  {
    title: 'Start using care',
    text: 'Virtual care and concierge support begin as soon as your membership is active.',
  },
] as const;

const IndividualsAndFamilies = () => {
  const carePlusSchema = generateHealthSharePlanSchema(
    'Care Plus',
    'Comprehensive health sharing for individuals and families with medical cost sharing, maternity, and prescription benefits.',
    166,
    947,
    ['Medical Cost Sharing', 'Maternity Sharing', 'Prescription Sharing', 'Virtual Behavioral Health', 'No Network Restrictions']
  );
  const directSchema = generateHealthSharePlanSchema(
    'Direct',
    'Enhanced health sharing membership with direct provider payment and comprehensive family membership options.',
    201,
    1006,
    ['Direct Provider Payment', 'Lower IUA Options', 'Family Memberships', 'Specialist Access', 'Comprehensive Benefits']
  );
  const secureHSASchema = generateHealthSharePlanSchema(
    'Secure HSA',
    'HSA-compatible health sharing membership for tax-advantaged healthcare savings combined with medical cost sharing.',
    239,
    1070,
    ['HSA Compatible', 'Tax Advantages', 'Medical Cost Sharing', 'Family Memberships', 'Flexible IUA Options']
  );
  const orgSchema = generateOrganizationSchema();
  const familiesFaqSchema = generateFAQSchema(individualsAndFamiliesFaqQuestions);

  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(carePlusSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(directSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(secureHSASchema)}</script>
        <script type="application/ld+json">{JSON.stringify(familiesFaqSchema)}</script>
      </MarketingHydrationSeo>

      <LandingPage>
        <PageHero
          ariaLabel="Individuals and families"
          kicker="For individuals and families"
          title={
            <>
              Healthcare built
              <br />
              around your family.
            </>
          }
          lede={
            <>
              Flexible memberships that adapt as life changes. <strong>Real people, real savings, real care</strong>,
              with no networks telling you where to go.
            </>
          }
          actions={
            <Link className="lr-btn lr-btn--glass" to="/compare-plans">
              Compare memberships
            </Link>
          }
          panel={
            <AffiliateProvider>
              <QuickRateEstimateForm />
            </AffiliateProvider>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Why families choose MPB Health">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/how-it-works-family.png"
                      alt=""
                      width={1448}
                      height={1086}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">
                    Why families
                    <br />
                    choose MPB Health.
                  </h2>
                  <p className="lr-twotone">
                    Everything traditional insurance made complicated,{' '}
                    <span>simplified into one membership you can actually understand.</span>
                  </p>
                  <ul className="lr-ledger lr-ledger--1" style={{ marginTop: '1.8rem' }}>
                    {WHY.map(({ title, text }) => (
                      <li key={title}>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Memberships" id="memberships">
            <div className="lr-inner">
              <SectionHead
                title="Choose the membership that fits."
                lede="Three ways to join, one community."
                ledeMuted="Every membership includes $0 virtual care and concierge support."
              />
              <PlanGrid plans={INDIVIDUAL_PLANS} />
              <Reveal>
                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  Monthly amounts shown are starting contributions for an individual and vary by age, household
                  and member responsibility amount. MPB Health memberships are not insurance.
                </p>
                <p style={{ textAlign: 'center', marginTop: '1.4rem' }}>
                  <Link to="/compare-plans" className="lr-more">
                    See every membership side by side
                  </Link>
                </p>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--hair" aria-label="Everyday care">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media lr-split__media--quote">
                    <img
                      src="/assets/pillar-mental.jpg"
                      alt=""
                      width={1800}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="lr-split__quote">
                      <p>
                        &ldquo;By far the easiest, most transparent and affordable coverage I&rsquo;ve
                        experienced. MPB beats anything the marketplace ever offered.&rdquo;
                      </p>
                      <footer>
                        <strong>Charlotte C.</strong>, Portland, OR
                      </footer>
                    </div>
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">
                    Built for the
                    <br />
                    days in between.
                  </h2>
                  <p className="lr-twotone">
                    Sharing protects you from the unexpected.{' '}
                    <span>These are the things your family uses every week.</span>
                  </p>
                  <ul className="lr-ledger lr-ledger--1" style={{ marginTop: '1.8rem' }}>
                    {EVERYDAY.map(({ title, body }) => (
                      <li key={title}>
                        <h3>{title}</h3>
                        <p>{body}</p>
                      </li>
                    ))}
                  </ul>
                  <ul className="lr-checks" style={{ marginTop: '1.4rem' }}>
                    <li>
                      <Check strokeWidth={3} />
                      <span>No annual or lifetime sharing maximums on eligible expenses</span>
                    </li>
                    <li>
                      <Check strokeWidth={3} />
                      <span>Join any month. No open enrollment window.</span>
                    </li>
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="How joining works">
            <div className="lr-inner">
              <SectionHead title="From quote to care in four steps." align="left" />
              <ol className="lr-steps lr-steps--cols" style={{ '--cols': 4 } as React.CSSProperties}>
                {JOURNEY.map((step, i) => (
                  <Reveal as="li" key={step.title}>
                    <span className="lr-steps__num">{i + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </section>

          <FaqSection
            items={individualsAndFamiliesFaqQuestions}
            intro={
              <>
                Still deciding? Our advisors answer the hard questions too.{' '}
                <Link to="/faq" className="lr-more">
                  Browse all FAQs
                </Link>
              </>
            }
          />

          <AuroraBand
            title="Ready to see what your family would contribute?"
            lede="Compare every membership priced for your household in about 30 seconds."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="#estimate">
                  Get your quote
                </a>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { IndividualsAndFamilies };
export default IndividualsAndFamilies;
