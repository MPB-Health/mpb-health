import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Phone, ShieldCheck, Users, Video } from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { LeadForm } from '../components/forms/LeadForm';
import {
  AuroraBand,
  CountUp,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';
import { createClientLogger } from '@mpbhealth/utils';
import { generateOrganizationSchema } from '../lib/schemaMarkup';

const log = createClientLogger('GetAQuote');

const NEXT_STEPS = [
  { title: 'Submit your information', text: 'Complete the form with your details.' },
  { title: 'We review your needs', text: 'Our team analyzes your requirements.' },
  { title: 'Receive your quote', text: 'Get a personalized quote within 24 hours.' },
  { title: 'Speak with an advisor', text: 'Discuss your options with a specialist.' },
] as const;

const PRIVACY = [
  'Your information is encrypted and secure',
  'We will never sell your data to third parties',
  'No spam calls or emails. We respect your privacy.',
  'HIPAA-compliant data handling',
] as const;

const GetAQuote: React.FC = () => {
  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationSchema())}
        </script>
      </MarketingHydrationSeo>

      <LandingPage>
        <PageHero
          ariaLabel="Get a quote"
          align="center"
          kicker="Free quote"
          title="Your quote, in about two minutes."
          lede="Tell us a little about who needs care and a licensed advisor will send a personalized health sharing quote within 24 hours. No obligation."
          rail={[
            { value: '2–3 min', label: 'To complete' },
            { value: '24 hr', label: 'Response' },
            { value: '$0', label: 'Virtual care, included' },
          ]}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Quote request form" id="quote">
            <div className="lr-inner">
              <div className="lr-formgrid">
                <Reveal>
                  <div className="lr-panel lr-formwrap lr-quoteform">
                    <LeadForm onSubmit={(formData) => log.info('Quote form submitted', formData)} />
                  </div>
                </Reveal>

                <aside className="lr-aside" aria-label="About your quote">
                  <Reveal delay={0.08}>
                    <div className="lr-panel">
                      <h2 className="lr-panel__title">What happens next</h2>
                      <ol className="lr-steps lr-steps--tight">
                        {NEXT_STEPS.map((step, i) => (
                          <li key={step.title}>
                            <span className="lr-steps__num">0{i + 1}</span>
                            <div>
                              <h3>{step.title}</h3>
                              <p>{step.text}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Reveal>

                  <Reveal delay={0.14}>
                    <div className="lr-panel lr-panel--soft">
                      <h2 className="lr-panel__title">Need help?</h2>
                      <p className="lr-body">
                        Our team is here to answer any questions you have about health sharing or the
                        quote process.
                      </p>
                      <p style={{ margin: '1.2rem 0 0' }}>
                        <a className="lr-btn lr-btn--navy lr-btn--sm" href="tel:+18558164650">
                          <Phone strokeWidth={2} />
                          Call (855) 816-4650
                        </a>
                      </p>
                      <p className="lr-note" style={{ marginTop: '0.9rem' }}>
                        Monday to Friday, 9am to 6pm EST
                      </p>
                    </div>
                  </Reveal>

                  <Reveal delay={0.2}>
                    <div className="lr-panel">
                      <h2 className="lr-panel__title">Your privacy matters</h2>
                      <ul className="lr-checks" style={{ marginTop: 0 }}>
                        {PRIVACY.map((item) => (
                          <li key={item}>
                            <Check strokeWidth={3} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                </aside>
              </div>

              <div className="lr-estimate__trust">
                <span>
                  <ShieldCheck /> Secure &amp; private
                </span>
                <span>
                  <Users /> Over 12,000 members served
                </span>
                <span>
                  <Video /> $0 virtual care included
                </span>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Instant estimate">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <p className="lr-eyebrow">Prefer an instant estimate?</p>
                  <h2 className="lr-h2">
                    See every membership
                    <br />
                    priced for you.
                  </h2>
                  <p className="lr-twotone">
                    Answer three quick questions and compare memberships side by side.{' '}
                    <span>No email required, no waiting for a callback.</span>
                  </p>
                  <Link className="lr-btn lr-btn--grad" to="/individuals-and-families#estimate">
                    Get a 30-second estimate
                  </Link>
                </Reveal>
                <Reveal delay={0.1}>
                  <div className="lr-split__media lr-split__media--wide">
                    <img
                      src="/assets/how-it-works-app.png"
                      alt=""
                      width={1400}
                      height={933}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec" aria-label="Member results">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Real results"
                title="Members who made the switch."
                lede="Real families, real savings,"
                ledeMuted="and a rating they gave us themselves."
                align="left"
              />
              <Reveal>
                <dl className="lr-stats" style={{ '--cols': 3 } as React.CSSProperties}>
                  <div>
                    <dt>
                      <CountUp value={12000} suffix="+" />
                    </dt>
                    <dd>Families served</dd>
                  </div>
                  <div>
                    <dt>
                      <CountUp
                        value={4.9}
                        suffix="/5"
                        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                      />
                    </dt>
                    <dd>Google rating</dd>
                  </div>
                  <div>
                    <dt>
                      <CountUp value={96} suffix="%" />
                    </dt>
                    <dd>Would recommend</dd>
                  </div>
                </dl>
              </Reveal>
            </div>
          </section>

          <AuroraBand
            title="Thousands of families already share the way."
            lede="Start your quote now, or talk to a real advisor first. Either way, there is no obligation."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="#quote">
                  Start my quote
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

export { GetAQuote };
export default GetAQuote;
