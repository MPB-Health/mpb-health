import React from 'react';
import { Link } from 'react-router-dom';
import { createClientLogger } from '@mpbhealth/utils';
import { SEOHead } from '../components/SEOHead';
import { ContactForm } from '../components/forms/ContactForm';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const log = createClientLogger('Contact');

const BOOKING_URL = 'https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/';

const Contact: React.FC = () => {
  const handleFormSubmit = (formData: any) => {
    log.info('Form submitted:', formData);
  };

  return (
    <>
      <SEOHead pathname="/contact" />

      <LandingPage>
        <PageHero
          ariaLabel="Contact MPB Health"
          align="center"
          title="Talk to a real person."
          lede="Have questions about medical cost sharing? Our healthcare advisors will help you find an affordable membership for you and your family."
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Send us a message">
            <div className="lr-inner">
              <div className="lr-formgrid">
                <Reveal>
                  <div className="lr-panel lr-formwrap">
                    <ContactForm onSubmit={handleFormSubmit} />
                  </div>
                </Reveal>

                <Reveal delay={0.1}>
                  <aside className="lr-aside" aria-label="Contact information">
                    <div className="lr-contact">
                      <div>
                        <div>
                          <h3>Phone</h3>
                          <a href="tel:+18558164650">(855) 816-4650</a>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h3>Email</h3>
                          <a href="mailto:info@mympb.com">info@mympb.com</a>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h3>Office</h3>
                          <p>
                            5301 N Federal Hwy Suite 155
                            <br />
                            Boca Raton, FL 33487
                          </p>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h3>Hours</h3>
                          <p>
                            Monday – Friday: 9:00 AM – 5:00 PM
                            <br />
                            Saturday – Sunday: Closed
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lr-panel lr-panel--soft">
                      <h3 className="lr-panel__title">Prefer to book a time?</h3>
                      <p className="lr-body">
                        Pick a slot that suits you and an advisor will call you back. No pressure, no
                        scripts.
                      </p>
                      <p style={{ margin: '1.2rem 0 0' }}>
                        <a
                          className="lr-btn lr-btn--navy lr-btn--sm"
                          href={BOOKING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Schedule a call
                        </a>
                      </p>
                    </div>
                  </aside>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Visit our office">
            <div className="lr-inner">
              <SectionHead title="Visit us in Boca Raton." lede="5301 N Federal Hwy, Suite 155." ledeMuted="Weekdays 9 to 5." />
              <Reveal>
                <div className="lr-map">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3570.887595886799!2d-80.08905842416968!3d26.358597377005556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d8e2c3e3e3e3e3%3A0x1234567890abcdef!2s5301%20N%20Federal%20Hwy%20Suite%20155%2C%20Boca%20Raton%2C%20FL%2033487!5e0!3m2!1sen!2sus!4v1635789012345"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="MPB Health Office Location"
                  />
                </div>
              </Reveal>
            </div>
          </section>

          <AuroraBand
            title="Not sure where to start? Start with a conversation."
            lede="Our advisors answer questions honestly and help you find the membership that fits your family."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
                <Link className="lr-btn lr-btn--glass" to="/get-a-quote">
                  Get your quote
                </Link>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { Contact };
export default Contact;
