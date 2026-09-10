import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LandingPage, PageHero, Sheet } from '../components/landing-redesign/page-kit';

const WashingtonStatement = () => {
  return (
    <>
      <Helmet>
        <title>Washington Statement | MPB Health</title>
        <meta name="description" content="Washington state-specific disclosures for MPB Health medical cost sharing programs." />
      </Helmet>

      <LandingPage className="legal">
        <PageHero
          ariaLabel="Washington statement"
          align="center"
          title="Washington statement"
          lede="Important disclosures for Washington state residents."
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Washington statement text">
            <div className="lr-inner">
              <div className="lr-prose">
                <h2>Washington state notice</h2>
                <p>
                  This page contains important information for Washington state residents regarding medical cost sharing programs.
                </p>

                <h3>Important disclosure</h3>
                <p>
                  Medical cost sharing programs are not insurance and do not guarantee payment of medical expenses.
                  Members are responsible for the payment of their own medical expenses. The organization facilitates
                  the sharing of medical expenses between members.
                </p>

                <h3>State-specific requirements</h3>
                <p>
                  Washington state law requires specific disclosures regarding health care sharing ministries and
                  medical cost sharing programs. Members should be aware that:
                </p>
                <ul>
                  <li>Participation in a medical cost sharing program is voluntary</li>
                  <li>Medical expenses may not be shared in all circumstances</li>
                  <li>Pre-membership conditions may not be eligible for sharing</li>
                  <li>There is no guarantee of payment for any medical expenses</li>
                </ul>

                <h3>Contact information</h3>
                <p>
                  For questions about Washington state requirements or to discuss your specific situation,
                  please contact our team at <a href="mailto:support@mpb.health">support@mpb.health</a> or
                  call us at <a href="tel:8558164650">(855) 816-4650</a>.
                </p>
              </div>
            </div>
          </section>
        </Sheet>
      </LandingPage>
    </>
  );
};

export default WashingtonStatement;
