import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
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
import { generateFAQSchema, comparePlansFaqQuestions } from '../lib/schemaMarkup';

type Audience = 'individual' | 'business';

const TABS: ReadonlyArray<{ id: Audience; label: string }> = [
  { id: 'individual', label: 'Individuals & families' },
  { id: 'business', label: 'Self-employed & business' },
];

export default function PlanComparison() {
  const compareFaqSchema = generateFAQSchema(comparePlansFaqQuestions);
  const [audience, setAudience] = useState<Audience>('individual');
  const isBusiness = audience === 'business';
  const compare = isBusiness ? BUSINESS_COMPARE : INDIVIDUAL_COMPARE;

  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">{JSON.stringify(compareFaqSchema)}</script>
      </MarketingHydrationSeo>

      <LandingPage>
        <PageHero
          ariaLabel="Compare memberships"
          align="center"
          kicker="Compare memberships"
          title={
            <>
              Every membership,
              <br />
              side by side.
            </>
          }
          lede="Virtual care and concierge come with all five. Here is exactly what changes as you move up."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                Get your quote
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/individuals-and-families">
                Individuals &amp; families
              </Link>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Compare memberships" id="compare">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Side by side"
                title="Pick who you're comparing for."
                lede="Price and enroll first, then every feature line by line."
                ledeMuted="Switch between household and business memberships below."
              >
                <div className="lr-chips" role="tablist" aria-label="Membership group" style={{ marginTop: '1.6rem' }}>
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-selected={audience === tab.id}
                      aria-controls={`panel-${tab.id}`}
                      className={`lr-chip${audience === tab.id ? ' is-active' : ''}`}
                      onClick={() => setAudience(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </SectionHead>

              <div role="tabpanel" id={`panel-${audience}`} aria-labelledby={`tab-${audience}`}>
                {isBusiness ? (
                  <div key="business" style={{ maxWidth: '56rem', marginInline: 'auto' }}>
                    <PlanGrid plans={BUSINESS_PLANS} cols={2} />
                  </div>
                ) : (
                  <div key="individual">
                    <PlanGrid plans={INDIVIDUAL_PLANS} />
                  </div>
                )}

                <Reveal key={`table-${audience}`} delay={0.1}>
                  <div className="lr-sec__head lr-sec__head--left" style={{ margin: '3.5rem 0 1.4rem' }}>
                    <p className="lr-eyebrow">Feature by feature</p>
                    <h3 className="lr-h3">
                      {isBusiness ? 'HSA Essentials and Secure HSA' : 'Essentials, Care+ and Direct'}
                    </h3>
                  </div>
                  <CompareTable columns={compare.columns} groups={compare.groups} />
                </Reveal>
              </div>

              <Reveal delay={0.1}>
                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  Monthly amounts shown are starting contributions for one member and vary by age, household and
                  member responsibility amount. MPB Health memberships are not insurance.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--hair" aria-label="Printable comparison guide">
            <div className="lr-inner">
              <Reveal>
                <div
                  className="lr-panel lr-panel--soft"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem 2rem',
                  }}
                >
                  <div>
                    <h2 className="lr-panel__title" style={{ marginBottom: '0.3rem' }}>
                      Prefer a printable guide?
                    </h2>
                    <p className="lr-body">
                      Every membership and feature on one page, ready to print or share.
                    </p>
                  </div>
                  <a
                    className="lr-btn lr-btn--ghost lr-btn--sm"
                    href="/docs/plan-comparison-guide.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText strokeWidth={1.8} />
                    Open the guide
                  </a>
                </div>
              </Reveal>
            </div>
          </section>

          <FaqSection
            items={comparePlansFaqQuestions}
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
            title="Seen enough? Get a number for your household."
            lede="Every membership priced for you in about 30 seconds, or talk it through with an advisor."
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
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
}
