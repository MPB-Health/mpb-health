import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import { voluntaryBenefits } from '../data/voluntaryBenefitsData';
import { BenefitInterestCTA } from '../components/blocks/BenefitInterestCTA';
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

export const BenefitDetail: React.FC = () => {
  const { benefitId } = useParams<{ benefitId: string }>();
  const benefit = voluntaryBenefits.find((b) => b.id === benefitId && !b.hidden);

  if (!benefit) {
    return (
      <>
        <Helmet>
          <title>Benefit not found | MPB Health</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LandingPage className="bdt">
          <PageHero
            ariaLabel="Benefit not found"
            align="center"
            title="We couldn't find that benefit."
            lede="The link may be out of date. Every feature and benefit your membership can include is listed on one page."
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

  const title = `${benefit.name} insurance`;
  const hasPricing = Boolean(benefit.pricingTiers && benefit.pricingTiers.length > 0);

  return (
    <>
      <Helmet>
        <title>{benefit.name} Insurance - MPB Health</title>
        <meta name="description" content={benefit.description} />
      </Helmet>

      <LandingPage className="bdt">
        <PageHero
          ariaLabel={title}
          kicker="Voluntary benefit"
          title={title}
          lede={benefit.tagline}
          media={{ type: 'image', src: benefit.heroImage, alt: title }}
          actions={
            <>
              <a className="lr-btn lr-btn--white" href="#interest-form">
                Get more information
              </a>
              <Link className="lr-btn lr-btn--glass" to="/features">
                See all features
              </Link>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="About this benefit">
            <div className="lr-inner">
              <Reveal>
                <h2 className="lr-h2">What this benefit gives you.</h2>
                <div className="lr-prose">
                  <p>{benefit.detailedDescription}</p>
                </div>
              </Reveal>
              <ul className="lr-ledger" style={{ marginTop: '2.5rem' }}>
                {benefit.keyFeatures.map((item) => (
                  <li key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="What is covered and who is eligible">
            <div className="lr-inner">
              <div className="lr-formgrid">
                <Reveal>
                  <h2 className="lr-h2">What's covered.</h2>
                  <ul className="lr-ledger lr-ledger--1 lr-ledger--tight">
                    {benefit.coverage.map((item) => (
                      <li key={item}>
                        <p>{item}</p>
                      </li>
                    ))}
                  </ul>
                  {benefit.membership.length > 0 && (
                    <ul className="lr-checks" style={{ marginTop: '2rem' }}>
                      {benefit.membership.map((item) => (
                        <li key={item}>
                          <Check strokeWidth={3} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
                <aside className="lr-aside" aria-label="Eligibility">
                  <Reveal>
                    <div className="lr-panel">
                      <h2 className="lr-panel__title">Who's eligible</h2>
                      <ul className="lr-ledger lr-ledger--1 lr-ledger--tight">
                        {benefit.eligibility.map((item) => (
                          <li key={item}>
                            <p>{item}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                </aside>
              </div>
            </div>
          </section>

          {hasPricing && (
            <section className="lr-sec" aria-label="Pricing options">
              <div className="lr-inner">
                <SectionHead
                  title="Pricing options."
                  lede="Typical monthly ranges for each level of coverage."
                  align="left"
                />
                <ul className={`lr-ledger${benefit.pricingTiers!.length >= 3 ? ' lr-ledger--3' : ''}`}>
                  {benefit.pricingTiers!.map((tier) => (
                    <li key={tier.name}>
                      <h3>{tier.name}</h3>
                      <p>
                        <strong>{tier.priceRange}</strong>
                      </p>
                      <ul className="lr-checks" style={{ marginTop: '1rem' }}>
                        {tier.features.map((item) => (
                          <li key={item}>
                            <Check strokeWidth={3} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <p className="lr-note">
                  Actual pricing depends on age, coverage amount, and other factors. Contact us for a
                  personalized quote.
                </p>
              </div>
            </section>
          )}

          {benefit.faqs.length > 0 && (
            <FaqSection
              items={benefit.faqs}
              intro={`Answers to the questions people ask most about ${benefit.name.toLowerCase()} insurance.`}
            />
          )}

          <section className="lr-sec lr-sec--soft" aria-label="Request information" id="interest-form">
            <div className="lr-inner">
              <SectionHead
                title="Tell us you're interested."
                lede="A licensed benefit specialist will follow up"
                ledeMuted="with coverage information tailored to you. No obligation."
              />
              <div className="lr-panel lr-formwrap lr-benefitform">
                <BenefitInterestCTA
                  benefitType={benefit.id}
                  benefitName={benefit.name}
                  gradientFrom={benefit.gradientFrom}
                  gradientTo={benefit.gradientTo}
                />
              </div>
            </div>
          </section>

          <AuroraBand
            title={`Questions about ${benefit.name.toLowerCase()} insurance?`}
            lede="Our benefit specialists can walk you through the options and help you decide whether this coverage fits."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
                <Link className="lr-btn lr-btn--glass" to="/contact">
                  Send us a message
                </Link>
              </>
            }
            note={NOT_INSURANCE}
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default BenefitDetail;
