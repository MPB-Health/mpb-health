import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const BENEFITS = [
  {
    title: 'Competitive commissions',
    text: 'Earn industry-leading commission rates with recurring revenue on every member you enroll, and build a sustainable income stream.',
  },
  {
    title: 'Recurring revenue',
    text: 'Generate ongoing income from your member base. As your members renew, your commissions continue month after month.',
  },
  {
    title: 'High conversion rates',
    text: 'Transparent pricing and a compelling value proposition make it easy to close. Members love the savings and flexibility.',
  },
  {
    title: 'Dedicated partner support',
    text: 'Work with a dedicated account manager who understands your business and helps you succeed at every step.',
  },
] as const;

const SUPPORT = [
  {
    title: 'Comprehensive training',
    text: 'In-depth product training, sales techniques, and certification programs to become an MPB Health expert.',
  },
  {
    title: 'Marketing materials',
    text: 'Co-branded brochures, digital assets, presentations, and sales collateral customized with your branding.',
  },
  {
    title: 'Lead generation tools',
    text: 'Proven lead generation strategies, landing pages, and campaigns to grow your pipeline.',
  },
  {
    title: 'CRM and reporting dashboard',
    text: 'Track your enrollments, commissions, and member activity in real time through the partner portal.',
  },
  {
    title: 'Enrollment support',
    text: 'Our team assists with complex cases, answers technical questions, and ensures smooth onboarding for your clients.',
  },
  {
    title: 'Incentive programs',
    text: 'Earn bonuses, attend exclusive events, and get recognized for top performance with our rewards program.',
  },
] as const;

const STEPS = [
  {
    title: 'Submit your application',
    text: 'Complete the partner application and tell us about your business and experience.',
  },
  {
    title: 'Get approved and onboarded',
    text: 'Our team reviews your application and schedules an onboarding session to set up your account.',
  },
  {
    title: 'Complete training',
    text: 'Work through the training portal and certification courses to master MPB Health products and sales strategies.',
  },
  {
    title: 'Start enrolling members',
    text: 'Offer MPB Health memberships to your clients and start earning commissions right away.',
  },
] as const;

const COMMISSION_HIGHLIGHTS = [
  'First-year commissions on all new enrollments',
  'Ongoing renewal commissions for member retention',
  'Performance bonuses for high-volume producers',
  'Accelerated payment processing',
  'No enrollment caps or territory restrictions',
  'Commission tracking dashboard with real-time updates',
] as const;

const AdvisorsAndBrokers = () => {
  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage>
        <PageHero
          ariaLabel="Advisors and brokers"
          kicker="For advisors and brokers"
          title="Partner with MPB Health and grow your business."
          lede="Join our network of advisors and brokers offering health sharing memberships. Competitive commissions, marketing support, and dedicated resources to grow your client base."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/contact">
                Apply to partner
              </Link>
              <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                Talk to our team
              </a>
            </>
          }
          rail={[
            { value: '500+', label: 'Active advisor partners' },
            { value: '$5K+', label: 'Average monthly commissions' },
            { value: '92%', label: 'Partner satisfaction' },
          ]}
          media={{
            type: 'image',
            src: '/assets/delegates-networking.jpg',
            alt: 'Advisors networking at a conference reception',
            width: 1920,
            height: 1280,
          }}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Why partner with MPB Health">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/businessTeamWorking.png"
                      alt="Advisors working together in an office"
                      width={800}
                      height={618}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">Why partner with MPB Health.</h2>
                  <p className="lr-body">
                    Build a profitable business while making a meaningful difference in your
                    clients' lives.
                  </p>
                  <ul className="lr-ledger lr-ledger--1" style={{ marginTop: '1.5rem' }}>
                    {BENEFITS.map(({ title, text }) => (
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

          <section className="lr-sec lr-sec--soft" aria-label="Commission structure">
            <div className="lr-inner">
              <SectionHead
                title="What you'll earn."
                lede="Competitive commissions"
                ledeMuted="with transparent, straightforward compensation."
                align="left"
              />
              <div className="lr-split">
                <Reveal>
                  <ul className="lr-checks" style={{ marginTop: 0 }}>
                    {COMMISSION_HIGHLIGHTS.map((item) => (
                      <li key={item}>
                        <Check strokeWidth={3} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal>
                  <div className="lr-panel">
                    <h3 className="lr-panel__title">Average partner earnings</h3>
                    <p className="lr-h2" style={{ margin: '0 0 0.6rem' }}>
                      $5,000+ a month
                    </p>
                    <p className="lr-body">Based on active partner performance data.</p>
                    <p style={{ margin: '1.4rem 0 0' }}>
                      <Link className="lr-btn lr-btn--navy lr-btn--sm" to="/contact">
                        Apply to partner
                      </Link>
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec" aria-label="Marketing and sales support">
            <div className="lr-inner">
              <SectionHead
                title="Marketing and sales support."
                lede="The tools and resources you need"
                ledeMuted="to succeed from your first enrollment."
              />
              <ul className="lr-ledger lr-ledger--3">
                {SUPPORT.map(({ title, text }) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lr-sec lr-sec--hair" aria-label="How to get started">
            <div className="lr-inner">
              <SectionHead
                title="How to get started."
                lede="Join the partner network"
                ledeMuted="in four steps."
              />
              <ol className="lr-steps lr-steps--cols" style={{ '--cols': 4 } as React.CSSProperties}>
                {STEPS.map((step, i) => (
                  <li key={step.title}>
                    <span className="lr-steps__num">{i + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <p style={{ margin: '2.5rem 0 0', textAlign: 'center' }}>
                <Link className="lr-btn lr-btn--navy" to="/contact">
                  Apply to become a partner
                </Link>
              </p>
            </div>
          </section>

          <AuroraBand
            title="Ready to grow your business with MPB Health?"
            lede="Join hundreds of advisors and brokers building thriving businesses with MPB Health. Contact us to learn more about partnership opportunities."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/contact">
                  Apply to partner
                </Link>
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

export { AdvisorsAndBrokers };
export default AdvisorsAndBrokers;
