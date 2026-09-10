import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AuroraBand,
  FaqSection,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

interface Event {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string;
  author: string;
  published_date: string;
  category: string;
}

const CALENDLY_URL = 'https://calendly.com/rebalarney-mympb/time-with-reba';
const APPLICATION_FORM_URL = 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448';

const benefits = [
  {
    title: 'Lucrative commissions',
    description:
      'Earn competitive commissions on every membership sale, plus ongoing residuals on renewals, so each client continues contributing to your income long after the first sale.',
  },
  {
    title: 'Free training and support',
    description:
      'Access live workshops, on-demand video courses, and a dedicated mentor, along with ready-to-use marketing assets and email templates to help you build momentum from day one.',
  },
  {
    title: 'Flexible and remote',
    description:
      'Work from anywhere, set your own hours, and rely on our fully digital quoting and enrollment platform to streamline client interactions and minimize admin work.',
  },
  {
    title: 'Purpose-driven culture',
    description:
      "Be part of a mission-focused team making healthcare more accessible; celebrate successes at quarterly retreats and take pride in the real impact you're creating.",
  },
  {
    title: 'Back-office support',
    description:
      'Our operations and compliance teams manage billing and regulatory updates, freeing you to focus on clients and grow your business with confidence.',
  },
  {
    title: 'Incentives and exclusive trips',
    description:
      'Compete in yearly performance challenges and earn invitations to all-expenses-paid retreats, rewarding your top achievements and strengthening team bonds.',
  },
] as const;

const perks = [
  'Unlimited earning potential',
  'Work-life balance',
  'No cold calling required',
  'Proven sales system',
  'Marketing materials provided',
  'Weekly team training',
] as const;

const faqItems = [
  {
    question: 'What qualifications do I need to join?',
    answer:
      "You'll need a valid health insurance license in the state(s) where you plan to sell, but prior industry experience isn't required. We'll guide you through any gaps and pair you with a mentor to ramp up quickly.",
  },
  {
    question: 'How long before I start earning?',
    answer:
      'Most new advisors begin closing business within two weeks of starting training. Since our enrollment platform is fully digital, you can be in front of prospects, and earning commissions, almost immediately.',
  },
  {
    question: 'What technology will I need?',
    answer:
      'Just a computer with internet access. Our cloud-based platform works seamlessly on any modern browser, with no special software required.',
  },
  {
    question: 'How much ongoing support can I expect?',
    answer:
      "You'll have access to our dedicated Business Development team during regular business hours for any questions or guidance. Plus, we host biweekly update meetings covering the latest industry trends, product enhancements, and best practices to keep you informed and successful.",
  },
] as const;

const JoinOurTeam: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = (event: MessageEvent) => {
      if (event.data && event.data.height && iframeRef.current) {
        const iframe = iframeRef.current;
        const height = parseInt(event.data.height, 10);
        if (height > 0) {
          iframe.style.height = `${height}px`;
        }
      }
    };

    window.addEventListener('message', handleResize);

    return () => {
      window.removeEventListener('message', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_articles')
          .select('id, title, slug, excerpt, featured_image_url, author, published_date, category')
          .eq('category', 'Event')
          .eq('is_published', true)
          .order('published_date', { ascending: false })
          .limit(3);

        // Handle missing table gracefully
        if (error?.message?.includes('schema cache') ||
            error?.code === 'PGRST204' ||
            error?.code === 'PGRST205') {
          setEvents([]);
          return;
        }
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <Helmet>
        <title>Join Our Team - MPB Health Careers</title>
        <meta
          name="description"
          content="Turn your passion for helping others into a thriving advisory business. Join MPB Health's community of impact-driven healthcare advisors."
        />
      </Helmet>

      <LandingPage className="jot">
        <PageHero
          ariaLabel="Join our team"
          kicker="Advisor careers"
          title="Join impact&#8209;driven health advisors."
          lede="Turn your passion for helping others into a thriving advisory business."
          actions={
            <>
              <a className="lr-btn lr-btn--white" href="#apply">
                Apply now
              </a>
              <a
                className="lr-btn lr-btn--glass"
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Schedule a call
              </a>
            </>
          }
          micro={
            <>
              Or call <a href="tel:8558164650">(855) 816-4650</a>
            </>
          }
          rail={[
            { value: '500+', label: 'Active advisors' },
            { value: '$2M+', label: 'Paid in commissions' },
            { value: '98%', label: 'Advisor satisfaction' },
          ]}
          media={{
            type: 'image',
            src: '/assets/mpbhealthteam.jpg',
            alt: 'The MPB Health team at the Boca Raton office opening',
          }}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Why advisors join">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <h2 className="lr-h2">Build your future with MPB Health.</h2>
                  <p className="lr-body">
                    Join a team that values your growth, celebrates your success, and empowers you to
                    make a real difference. We provide all the tools, training, and support you need
                    to build a thriving advisory business from day one.
                  </p>
                  <ul className="lr-checks">
                    {perks.map((text) => (
                      <li key={text}>
                        <Check strokeWidth={3} />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/delegates-networking.jpg"
                      alt="Advisors talking at an MPB Health networking reception"
                      width={1920}
                      height={1280}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
              </div>

              <Reveal>
                <ul className="lr-ledger" style={{ marginTop: '4rem' }}>
                  {benefits.map(({ title, description }) => (
                    <li key={title}>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Apply" id="apply">
            <div className="lr-inner">
              <SectionHead
                title="Ready to join our team?"
                lede="Take the first step towards building your advisory business."
                ledeMuted="Fill out the form and we'll be in touch to discuss your future with MPB Health."
                align="left"
              />
              <div className="lr-formgrid">
                <Reveal>
                  <div className="lr-panel lr-formwrap">
                    <h3 className="lr-panel__title">Application form</h3>
                    <iframe
                      ref={iframeRef}
                      src={APPLICATION_FORM_URL}
                      allow="payment"
                      style={{ border: '0', width: '100%', overflow: 'hidden', minHeight: '600px' }}
                      title="Application Form"
                      onError={() => {
                        console.error('Iframe failed to load');
                      }}
                    />
                  </div>
                </Reveal>

                <aside className="lr-aside" aria-label="Talk to us">
                  <Reveal>
                    <div className="lr-panel">
                      <h3 className="lr-panel__title">Prefer to talk first?</h3>
                      <p className="lr-body">
                        We're excited to meet passionate, driven individuals like you. Book a time
                        with our team and we'll walk you through the opportunity.
                      </p>
                      <p style={{ margin: '1.2rem 0 0' }}>
                        <a
                          className="lr-btn lr-btn--navy lr-btn--sm"
                          href={CALENDLY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Schedule a call
                        </a>
                      </p>
                      <p className="lr-note" style={{ marginTop: '0.9rem' }}>
                        Or call <a href="tel:8558164650">(855) 816-4650</a>
                      </p>
                    </div>
                  </Reveal>

                  <Reveal>
                    <div className="lr-panel lr-panel--soft">
                      <h3 className="lr-panel__title">Having trouble viewing the form?</h3>
                      <p className="lr-body">Open it directly in a new window instead.</p>
                      <p style={{ margin: '1.2rem 0 0' }}>
                        <a
                          className="lr-btn lr-btn--ghost lr-btn--sm"
                          href={APPLICATION_FORM_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open the form in a new window
                        </a>
                      </p>
                    </div>
                  </Reveal>
                </aside>
              </div>
            </div>
          </section>

          {events.length > 0 && (
            <section className="lr-sec" aria-label="Upcoming events">
              <div className="lr-inner">
                <SectionHead
                  title="Join us at upcoming events."
                  lede="Connect with fellow advisors and learn from industry leaders."
                  align="left"
                />
                <Reveal>
                  <div className="lr-tiles">
                    {events.map((event) => {
                      const formattedDate = new Date(event.published_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      const imageUrl = event.featured_image_url.startsWith('/')
                        ? event.featured_image_url
                        : `/${event.featured_image_url}`;

                      return (
                        <Link key={event.id} to={`/events/${event.slug}`} className="lr-tile">
                          <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            style={imageUrl.includes('womenHealth.jpg') ? { objectPosition: 'center 0px' } : undefined}
                          />
                          <div className="lr-tile__body">
                            <h3>{event.title}</h3>
                            <p>{formattedDate}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          <FaqSection
            items={faqItems}
            intro="Get answers to common questions about joining our team."
          />

          <AuroraBand
            title="Let's build something together."
            lede="Apply today, or schedule a call and we'll talk through what a career as an MPB Health advisor looks like for you."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="#apply">
                  Apply now
                </a>
                <a
                  className="lr-btn lr-btn--glass"
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule a call
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

export { JoinOurTeam };
export default JoinOurTeam;
