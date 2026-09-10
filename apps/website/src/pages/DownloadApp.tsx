import React from 'react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { APP_STORE_URLS, isAppAvailable } from '../config/apps';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const features = [
  {
    title: 'Secure access',
    description: 'View your membership details and benefits securely.',
  },
  {
    title: 'Quick submissions',
    description: 'Submit medical expenses in seconds with photo capture.',
  },
  {
    title: 'Find providers',
    description: 'Search for healthcare providers in your network.',
  },
  {
    title: 'Track status',
    description: 'Monitor your sharing requests in real time.',
  },
] as const;

function StoreLinks() {
  return (
    <>
      {isAppAvailable('appStore') ? (
        <a
          className="lr-btn lr-btn--white"
          href={APP_STORE_URLS.appStore!}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download on the App Store
        </a>
      ) : (
        <span className="lr-btn lr-btn--white" aria-disabled="true">
          App Store: coming soon
        </span>
      )}
      {isAppAvailable('googlePlay') ? (
        <a
          className="lr-btn lr-btn--glass"
          href={APP_STORE_URLS.googlePlay!}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get it on Google Play
        </a>
      ) : (
        <span className="lr-btn lr-btn--glass" aria-disabled="true">
          Google Play: coming soon
        </span>
      )}
    </>
  );
}

const DownloadApp = () => {
  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage className="dla">
        <PageHero
          ariaLabel="Download the MPB Health app"
          kicker="Member app"
          title="Your membership, in your pocket."
          lede="Take control of your healthcare anytime, anywhere. Manage your membership, submit expenses, find providers, and connect with support, all from your mobile device."
          actions={<StoreLinks />}
          micro="Available for iOS and Android devices."
          panel={
            <img
              src="/assets/CellPhone.png"
              alt="The MPB Health app"
              width={1080}
              height={1920}
              decoding="async"
            />
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="What you can do in the app">
            <div className="lr-inner">
              <SectionHead
                title="Everything you need in one app."
                lede="Our mobile app puts your healthcare management at your fingertips."
                align="left"
              />
              <Reveal>
                <ul className="lr-ledger">
                  {features.map(({ title, description }) => (
                    <li key={title}>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Member portal and app">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media lr-split__media--wide">
                    <img
                      src="/assets/how-it-works-app.png"
                      alt="A member checking a bill on her phone"
                      width={1400}
                      height={933}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">Healthcare technology, made simple.</h2>
                  <p className="lr-body">
                    The app and the member portal share one account, so what you do on your phone
                    shows up on your desktop and the other way round. Video visits with a provider,
                    bill tracking, real-time status on every submission, and a direct line to your
                    concierge all live in the same place.
                  </p>
                  <p className="lr-body">
                    Your data is protected with HIPAA-compliant encryption, and notifications stay in
                    sync across all of your devices.
                  </p>
                  <p style={{ margin: '1.6rem 0 0' }}>
                    <a
                      className="lr-btn lr-btn--ghost"
                      href="https://app.mpb.health/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open the member portal
                    </a>
                  </p>
                </Reveal>
              </div>
            </div>
          </section>

          <AuroraBand
            title="Ready to get started?"
            lede="Download the MPB Health app today and take the first step toward simpler, more accessible healthcare management."
            actions={<StoreLinks />}
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default DownloadApp;
