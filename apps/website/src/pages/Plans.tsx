import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import {
  AuroraBand,
  CompareTable,
  FaqSection,
  LandingPage,
  PageHero,
  PlanGrid,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';
import {
  BUSINESS_COMPARE,
  BUSINESS_PLANS,
  INDIVIDUAL_COMPARE,
  INDIVIDUAL_PLANS,
} from '../components/landing-redesign/plansData';
import { getSEOForPage } from '../lib/seoService';
import { generateAllPlansSchema, generateOrganizationSchema, generateFAQSchema, plansFaqQuestions } from '../lib/schemaMarkup';

const Plans: React.FC = () => {
  const seo = getSEOForPage('/plans');

  // Generate structured data for all health share plans
  const plansSchema = generateAllPlansSchema();
  const orgSchema = generateOrganizationSchema();
  const plansFaqSchema = generateFAQSchema(plansFaqQuestions);

  return (
    <>
      <MarketingHydrationSeo robots={seo.robots}>
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
        {plansSchema.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
        <script type="application/ld+json">
          {JSON.stringify(plansFaqSchema)}
        </script>
      </MarketingHydrationSeo>

      <LandingPage>
        <PageHero
          ariaLabel="Memberships"
          align="center"
          kicker="Memberships"
          title={
            <>
              Five memberships.
              <br />
              One community.
            </>
          }
          lede="Every membership includes $0 virtual care, concierge support and pharmacy savings. Pick the level of sharing that fits."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                Get your quote
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/how-it-works">
                How sharing works
              </Link>
            </>
          }
          rail={[
            { value: '$0', label: 'Virtual care, included' },
            { value: '30–60%', label: 'Typical monthly savings' },
            { value: '4.9/5', label: 'Google rating' },
          ]}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Memberships for individuals and families" id="individuals">
            <div className="lr-inner">
              <SectionHead
                eyebrow="For individuals & families"
                title="Three ways to join."
                lede="Start with everyday care, or add medical cost sharing"
                ledeMuted="for the bills you can't plan for."
              />
              <PlanGrid plans={INDIVIDUAL_PLANS} />
              <Reveal delay={0.1}>
                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  Monthly amounts shown are starting contributions for an individual and vary by age, household
                  and member responsibility amount. MPB Health memberships are not insurance.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Memberships for self-employed and businesses" id="business">
            <div className="lr-inner">
              <SectionHead
                eyebrow="For self-employed & businesses"
                title="Built for 1099s and teams of 2 to 50."
                lede="HSA compatibility, ACA compliance and sharing"
                ledeMuted="without the group-plan price tag."
              />
              <div style={{ maxWidth: '56rem', marginInline: 'auto' }}>
                <PlanGrid plans={BUSINESS_PLANS} cols={2} />
                <Reveal delay={0.1}>
                  <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                    Starting contributions for one member. A 1099 or business ID is required for HSA Essentials and
                    Secure HSA. MPB Health memberships are not insurance.
                  </p>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--hair" aria-label="Compare at a glance">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Compare at a glance"
                title="Same everyday care. Different sharing."
                lede="Virtual care and concierge are in every membership."
                ledeMuted="The differences are in what the community shares."
              />

              <Reveal>
                <div className="lr-sec__head lr-sec__head--left" style={{ marginBottom: '1.4rem' }}>
                  <p className="lr-eyebrow">Individuals & families</p>
                  <h3 className="lr-h3">Essentials, Care+ and Direct</h3>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <CompareTable columns={INDIVIDUAL_COMPARE.columns} groups={INDIVIDUAL_COMPARE.groups} />
              </Reveal>

              <Reveal>
                <div className="lr-sec__head lr-sec__head--left" style={{ margin: '3.5rem 0 1.4rem' }}>
                  <p className="lr-eyebrow">Self-employed & business</p>
                  <h3 className="lr-h3">HSA Essentials and Secure HSA</h3>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <CompareTable columns={BUSINESS_COMPARE.columns} groups={BUSINESS_COMPARE.groups} />
              </Reveal>

              <Reveal delay={0.1}>
                <p style={{ textAlign: 'center', marginTop: '2.4rem' }}>
                  <Link to="/compare-plans" className="lr-more">
                    Open the full comparison <ArrowRight />
                  </Link>
                </p>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="How the IUA works">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media lr-split__media--wide">
                    <img
                      src="/assets/hsa.png"
                      srcSet="/assets/hsa-640w.webp 640w, /assets/hsa-1024w.webp 1024w, /assets/hsa-1536w.webp 1536w"
                      sizes="(min-width: 1000px) 50vw, 100vw"
                      alt=""
                      width={5000}
                      height={3333}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">How the IUA works</p>
                  <h2 className="lr-h2">
                    One amount you&rsquo;re responsible for. Then the community shares.
                  </h2>
                  <p className="lr-body">
                    Every sharing membership has an Initial Unshareable Amount, also called your Member
                    Responsibility Amount. It is the portion of an eligible medical need you cover yourself before
                    the community steps in. You choose it when you enroll, and a higher amount means a lower monthly
                    contribution.
                  </p>
                  <p className="lr-body">
                    Once you have met it, eligible expenses for that need are shared by fellow members according to
                    the membership guidelines. MPB Health memberships are not insurance, so there is no premium, no
                    claims adjuster and no network telling you where to go.
                  </p>
                  <ul className="lr-checks">
                    <li>
                      <Check strokeWidth={3} />
                      <span>No networks. See any provider, anywhere.</span>
                    </li>
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

          <FaqSection
            items={plansFaqQuestions}
            intro={
              <>
                Still deciding? Our advisors answer the hard questions too.{' '}
                <Link to="/faq" className="lr-more">
                  Browse all FAQs <ArrowRight />
                </Link>
              </>
            }
          />

          <AuroraBand
            title="Not sure which one? Let an advisor walk you through it."
            lede="A five-minute call is usually all it takes to find the right fit for your household."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get your quote
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note="MPB Health provides membership services and access to qualified health share programs. MPB Health itself is not a Health Share Organization or Health Care Sharing Ministry. Memberships are not insurance and do not guarantee payment of medical expenses."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { Plans };
export default Plans;
