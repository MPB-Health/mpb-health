import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { FlowShell } from '../components/onboarding/FlowShell';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AuroraBand, LandingPage, PageHero, Sheet } from '../components/landing-redesign/page-kit';

export function GetStarted() {
  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage className="lr-flow">
        <PageHero
          ariaLabel="Find your membership"
          align="center"
          title="Find the membership that fits."
          lede="Answer a few questions and we'll recommend a membership. Takes about two minutes, no personal details needed."
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Membership finder">
            <div className="lr-inner">
              <h2 className="sr-only">Membership finder</h2>
              <div className="lr-panel lr-formwrap">
                <FlowShell />
              </div>

              <div className="lr-estimate__trust">
                <span>
                  <CheckCircle2 /> No personal info required
                </span>
                <span>
                  <Clock /> Under two minutes
                </span>
                <span>
                  <ShieldCheck /> Free and secure
                </span>
              </div>

              <p className="lr-body" style={{ marginTop: '2rem', textAlign: 'center' }}>
                Have questions? <a href="tel:+18558164650">Call (855) 816-4650</a> or{' '}
                <Link to="/contact">contact us</Link>.
              </p>
            </div>
          </section>

          <AuroraBand
            title="Prefer to talk it through?"
            lede="A licensed advisor can walk you through the memberships and send a personalized quote within 24 hours. No obligation."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get a quote
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

export default GetStarted;
