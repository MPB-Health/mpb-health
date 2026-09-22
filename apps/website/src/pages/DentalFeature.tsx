import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
  AuroraBand,
  FaqSection,
  LandingPage,
  PageHero,
  Sheet,
  easeOut,
} from '../components/landing-redesign/page-kit';
import {
  CAREINGTON,
  CAREINGTON_MORE,
  COMMON_USES,
  DENTAL_FAQS,
  DENTAL_FEATURE,
  DIALCARE,
  HOW_IT_WORKS,
  SAVINGS_SCALE,
} from '../data/dentalFeatureData';
import './dental-feature.css';

const SCALE_MAX = 50;
const SCALE_TICKS = [0, 10, 20, 30, 40, 50];

/**
 * The page's signature: the discount structure drawn to scale. Only the
 * percentages the approved copy states are plotted; the 20–50% range fades
 * out past 20% because the upper end is "up to", not a guarantee.
 */
function SavingsScale() {
  const reduce = useReducedMotion();
  return (
    <figure className="dnt-scale" aria-labelledby="dnt-scale-cap">
      <figcaption id="dnt-scale-cap" className="dnt-scale__cap">
        Savings at participating Careington dentists, as a share of the provider’s normal fee
      </figcaption>
      <ol className="dnt-scale__rows">
        {SAVINGS_SCALE.map((row, i) => {
          const range = row.to > row.from;
          const value = range ? `${row.from}–${row.to}%` : `${row.to}%`;
          return (
            <li key={row.label} className="dnt-scale__row">
              <div className="dnt-scale__label">
                <h3>{row.label}</h3>
                <p>{row.detail}</p>
              </div>
              <div className="dnt-scale__track" aria-hidden="true">
                <motion.span
                  className={`dnt-scale__bar${range ? ' dnt-scale__bar--range' : ''}`}
                  style={{
                    width: `${(row.to / SCALE_MAX) * 100}%`,
                    '--solid': `${(row.from / row.to) * 100}%`,
                  } as React.CSSProperties}
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.2, ease: easeOut, delay: 0.15 + i * 0.14 }}
                />
              </div>
              <strong className="dnt-scale__value">
                <span className="sr-only">{row.label}: save </span>
                {value}
              </strong>
            </li>
          );
        })}
      </ol>
      <div className="dnt-scale__axis" aria-hidden="true">
        <div className="dnt-scale__ticks">
          {SCALE_TICKS.map((t) => (
            <span key={t} style={{ left: `${(t / SCALE_MAX) * 100}%` }}>
              {t}%
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

export const DentalFeature: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>{DENTAL_FEATURE.metaTitle}</title>
        <meta name="description" content={DENTAL_FEATURE.metaDescription} />
        <link rel="canonical" href="https://mpb.health/features/dental" />
        <meta property="og:title" content={DENTAL_FEATURE.metaTitle} />
        <meta property="og:description" content={DENTAL_FEATURE.metaDescription} />
        <meta property="og:image" content={`https://mpb.health${DENTAL_FEATURE.heroImage}`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <LandingPage className="dnt">
        <PageHero
          ariaLabel={DENTAL_FEATURE.name}
          kicker="Healthcare features"
          title={DENTAL_FEATURE.name}
          lede={DENTAL_FEATURE.tagline}
          media={{
            type: 'image',
            src: DENTAL_FEATURE.heroImage,
            alt: 'A brother and sister laughing while brushing their teeth in a sunlit bathroom',
            width: 1400,
            height: 1715,
          }}
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/plans">
                Explore Memberships
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/features">
                See all features
              </Link>
            </>
          }
        />

        <Sheet>
          {/* ── Intro: the two services and when each one helps ─────── */}
          <section className="lr-sec lr-sec--top dnt-intro" aria-label="About dental savings and teledentistry">
            <div className="lr-inner">
              <p className="dnt-intro__lead">
                {DENTAL_FEATURE.intro[0]} <span>{DENTAL_FEATURE.intro[1]}</span>
              </p>
              <ul className="dnt-paths">
                <li>
                  <a href="#careington">
                    <span className="dnt-paths__when">When you’re booking a visit</span>
                    <strong>{CAREINGTON.name}</strong>
                    <span className="dnt-paths__what">
                      Save 20% to 50% on most procedures at participating dentists.
                    </span>
                  </a>
                </li>
                <li>
                  <a href="#teledentistry">
                    <span className="dnt-paths__when">When something hurts, or you have a question</span>
                    <strong>{DIALCARE.name}</strong>
                    <span className="dnt-paths__what">
                      Talk to a licensed dentist by phone or video, 24/7/365.
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* ── Careington ───────────────────────────────────────────── */}
          <section className="lr-sec lr-sec--hair dnt-network" id="careington" aria-labelledby="careington-title">
            <div className="lr-inner">
              <div className="dnt-network__head">
                <div>
                  <p className="dnt-label">{CAREINGTON.name}</p>
                  <h2 className="lr-h2" id="careington-title">
                    {CAREINGTON.tagline}
                  </h2>
                </div>
                <p className="lr-body dnt-network__body">{CAREINGTON.body}</p>
              </div>

              <SavingsScale />

              <ul className="lr-ledger dnt-ledger">
                {CAREINGTON_MORE.map((f) => (
                  <li key={f.title}>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── DialCare: the after-hours panel ──────────────────────── */}
          <section className="dnt-night" id="teledentistry" aria-labelledby="teledentistry-title">
            <div className="lr-inner">
              <div className="dnt-night__panel">
                <div className="dnt-night__glow" aria-hidden="true" />
                <div className="dnt-night__grid">
                  <div>
                    <p className="dnt-label dnt-label--light">{DIALCARE.name}</p>
                    <h2 className="dnt-night__title" id="teledentistry-title">
                      Expert dental guidance, <span>24/7/365.</span>
                    </h2>
                  </div>
                  <div className="dnt-night__body">
                    {DIALCARE.body.map((p) => (
                      <p key={p.slice(0, 24)}>{p}</p>
                    ))}
                  </div>
                </div>

                <ul className="dnt-night__features">
                  {DIALCARE.features.map((f) => (
                    <li key={f.title}>
                      <h3>{f.title}</h3>
                      <p>{f.description}</p>
                    </li>
                  ))}
                </ul>

                <p className="dnt-night__note">
                  <strong>Disclaimer:</strong> {DIALCARE.disclaimer}{' '}
                  <strong>
                    State availability may vary. Please visit{' '}
                    <a href="https://www.dialcare.com/states" target="_blank" rel="noopener noreferrer">
                      dialcare.com/states
                    </a>{' '}
                    for up-to-date information.
                  </strong>
                </p>
              </div>
            </div>
          </section>

          {/* ── Common uses ─────────────────────────────────────────── */}
          <section className="lr-sec dnt-uses" aria-labelledby="uses-title">
            <div className="lr-inner">
              <h2 className="lr-h2" id="uses-title">
                Common uses
              </h2>
              <div className="dnt-uses__cols">
                <div>
                  <h3 className="dnt-uses__head">
                    Dental savings <span>at a participating dentist</span>
                  </h3>
                  <ul className="dnt-uses__list">
                    {COMMON_USES.savings.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="dnt-uses__head">
                    Teledentistry <span>by phone or video</span>
                  </h3>
                  <ul className="dnt-uses__list">
                    {COMMON_USES.teledentistry.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="dnt-disclosure" role="note" aria-label="Discount plan disclosure">
                <p>
                  <strong>THIS DENTAL DISCOUNT PLAN IS NOT INSURANCE</strong> and is not intended to replace
                  health insurance. This plan does not meet the minimum creditable coverage requirements
                  under M.G.L. c.111M and 956 CMR 5.00. This plan is not a Qualified Health Plan under the
                  Affordable Care Act. The range of discounts will vary depending on the type of provider and
                  service. The plan does not pay providers directly. Plan members must pay for all services
                  but will receive a discount from participating providers. The list of participating
                  providers is at{' '}
                  <a href="https://mpbhealth.telemedsimplified.com" target="_blank" rel="noopener noreferrer">
                    mpbhealth.telemedsimplified.com
                  </a>
                  . A written list of participating providers is available upon request. You may cancel
                  within the first 30 days after effective date or receipt of membership materials
                  (whichever is later) and receive a full refund. Discount Plan Organization and
                  administrator: Careington International Corporation, 7400 Gaylord Parkway, Frisco, TX
                  75034; phone <a href="tel:+18004410380">800-441-0380</a>.
                </p>
                <p>
                  <strong>This plan is not available in Washington.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* ── How it works: a real sequence, so it's numbered ─────── */}
          <section className="lr-sec lr-sec--soft dnt-how" aria-labelledby="how-title">
            <div className="lr-inner">
              <h2 className="lr-h2" id="how-title">
                How it works
              </h2>
              <div className="dnt-how__grid">
                <ol className="lr-steps">
                  {HOW_IT_WORKS.map((step, i) => (
                    <li key={step.title}>
                      <span className="lr-steps__num">{i + 1}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </li>
                  ))}
                </ol>

                <aside className="dnt-ask" aria-labelledby="ask-title">
                  <h3 id="ask-title">Have a question first?</h3>
                  <p>
                    For non-emergency dental concerns, open the MPB Health App, select the Dental tab, then
                    tap Teledentistry to connect with a licensed dentist by phone or video, available{' '}
                    <strong>24/7/365</strong>.
                  </p>
                  <ol className="dnt-ask__path" aria-label="Where to find it in the app">
                    <li>MPB Health App</li>
                    <li>
                      <ChevronRight aria-hidden="true" />
                      Dental
                    </li>
                    <li>
                      <ChevronRight aria-hidden="true" />
                      Teledentistry
                    </li>
                  </ol>
                </aside>
              </div>
            </div>
          </section>

          {/* ── Memberships ─────────────────────────────────────────── */}
          <section className="lr-sec dnt-plans" aria-labelledby="plans-title">
            <div className="lr-inner dnt-plans__inner">
              <div>
                <h2 className="lr-h2" id="plans-title">
                  Memberships that include this feature
                </h2>
                <p className="lr-body">This feature is available with:</p>
              </div>
              <div>
                <ul className="dnt-plans__list">
                  {DENTAL_FEATURE.eligiblePlans.map((plan) => (
                    <li key={plan}>
                      <Link to="/plans">{plan}</Link>
                    </li>
                  ))}
                </ul>
                <Link className="lr-btn lr-btn--ghost lr-btn--sm dnt-plans__cta" to="/plans">
                  Explore Memberships
                </Link>
              </div>
            </div>
          </section>

          <FaqSection
            items={DENTAL_FAQS}
            intro="What members ask most about dental savings and teledentistry."
          />

          {/* ── Footer disclosures (compliance: do not omit) ────────── */}
          <section className="lr-sec lr-sec--hair dnt-legal" aria-label="Disclosures">
            <div className="lr-inner">
              <p>
                Members may save 20% to 50% on most dental procedures through participating Careington
                providers. Savings vary by service and provider. DialCare Teledentistry availability may
                vary by state.
              </p>
              <p>
                <strong>This is not insurance.</strong> This is a discount plan (a health care discount
                plan) that provides access to discounts on dental and teledentistry services from
                participating providers. It is not a qualified health plan under the Affordable Care Act.
                The plan does not make payments to providers; members are responsible for paying for all
                services at the discounted rates. Discount Plan Organization: Careington International
                Corporation, 7400 Gaylord Parkway, Frisco, TX 75034. To view participating providers or the
                full list of discounts, log in to your Member Portal or call the number on your member ID
                card.
              </p>
            </div>
          </section>

          <AuroraBand
            ariaLabel="Explore memberships"
            title="More ways to care for your smile."
            lede="Dental savings and teledentistry come with the MPB Membership and MPB HSA Membership."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/plans">
                  Explore Memberships
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default DentalFeature;
