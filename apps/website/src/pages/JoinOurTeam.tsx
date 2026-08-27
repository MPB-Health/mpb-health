import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Phone,
  DollarSign,
  GraduationCap,
  Clock,
  Heart,
  Shield,
  Award,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  ExternalLink
} from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { supabase } from '../lib/supabase';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './join-our-team.css';

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

const JoinOurTeam: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [_loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

  const benefits = [
    {
      icon: DollarSign,
      iconClass: 'jt-benefit__icon--green',
      title: 'Lucrative Commissions',
      description: 'Earn competitive commissions on every membership sale, plus ongoing residuals on renewals—so each client continues contributing to your income long after the first sale.',
    },
    {
      icon: GraduationCap,
      iconClass: '',
      title: 'Free Training & Support',
      description: 'Access live workshops, on-demand video courses, and a dedicated mentor, along with ready-to-use marketing assets and email templates to help you build momentum from day one.',
    },
    {
      icon: Clock,
      iconClass: 'jt-benefit__icon--teal',
      title: 'Flexible & Remote',
      description: 'Work from anywhere, set your own hours, and rely on our fully digital quoting and enrollment platform to streamline client interactions and minimize admin work.',
    },
    {
      icon: Heart,
      iconClass: 'jt-benefit__icon--teal',
      title: 'Purpose-Driven Culture',
      description: 'Be part of a mission-focused team making healthcare more accessible; celebrate successes at quarterly retreats and take pride in the real impact you\'re creating.',
    },
    {
      icon: Shield,
      iconClass: '',
      title: 'Back-Office Support',
      description: 'Our operations and compliance teams manage billing and regulatory updates—freeing you to focus on clients and grow your business with confidence.',
    },
    {
      icon: Award,
      iconClass: 'jt-benefit__icon--green',
      title: 'Incentives & Exclusive Trips',
      description: 'Compete in yearly performance challenges and earn invitations to all-expenses-paid retreats—rewarding your top achievements and strengthening team bonds.',
    }
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Active Advisors' },
    { icon: TrendingUp, value: '$2M+', label: 'Paid in Commissions' },
    { icon: Target, value: '98%', label: 'Advisor Satisfaction' },
    { icon: Sparkles, value: '24/7', label: 'Support Available' }
  ];

  const faqItems = [
    {
      question: 'What qualifications do I need to join?',
      answer: 'You\'ll need a valid health insurance license in the state(s) where you plan to sell, but prior industry experience isn\'t required. We\'ll guide you through any gaps and pair you with a mentor to ramp up quickly.'
    },
    {
      question: 'How long before I start earning?',
      answer: 'Most new advisors begin closing business within two weeks of starting training. Since our enrollment platform is fully digital, you can be in front of prospects—and earning commissions—almost immediately.'
    },
    {
      question: 'What technology will I need?',
      answer: 'Just a computer with internet access. Our cloud-based platform works seamlessly on any modern browser, with no special software required.'
    },
    {
      question: 'How much ongoing support can I expect?',
      answer: 'You\'ll have access to our dedicated Business Development team during regular business hours for any questions or guidance. Plus, we host biweekly update meetings covering the latest industry trends, product enhancements, and best practices to keep you informed and successful.'
    }
  ];

  const perks = [
    'Unlimited earning potential',
    'Work-life balance',
    'No cold calling required',
    'Proven sales system',
    'Marketing materials provided',
    'Weekly team training'
  ];

  return (
    <>
      <Helmet>
        <title>Join Our Team - MPB Health Careers</title>
        <meta
          name="description"
          content="Turn your passion for helping others into a thriving advisory business. Join MPB Health's community of impact-driven healthcare advisors."
        />
      </Helmet>

      <div className="lr hiw jt">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="Join our team">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="jt-label">Career Opportunities</p>
              <h1 className="hiw-hero__title">Join Impact-Driven Health Advisors</h1>
              <p className="hiw-hero__lede">
                Turn your passion for helping others into a thriving advisory business.
              </p>
              <div className="jt-hero__actions">
                <a
                  href="https://calendly.com/rebalarney-mympb/time-with-reba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jt-btn jt-btn--primary"
                >
                  Schedule a Call
                  <ArrowRight aria-hidden="true" />
                </a>
                <a href="tel:8558164650" className="jt-btn jt-btn--ghost">
                  <Phone aria-hidden="true" />
                  (855) 816-4650
                </a>
              </div>
              <div className="jt-hero__stats">
                {stats.map((stat) => (
                  <span key={stat.label} className="jt-stat">
                    <stat.icon aria-hidden="true" />
                    <strong>{stat.value}</strong> {stat.label}
                  </span>
                ))}
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/making.jpg"
              alt="MPB Health team members connecting"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Why join us ──────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Why join us">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="jt-label">Why Join Us</p>
              <h2 className="hiw-title">Build Your Future With MPB Health</h2>
              <p className="hiw-body">
                Join a team that values your growth, celebrates your success, and empowers you to
                make a real difference
              </p>
            </div>

            <div className="jt-benefits-grid">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="jt-benefit">
                  <div className={`jt-benefit__icon ${benefit.iconClass}`}>
                    <benefit.icon aria-hidden="true" />
                  </div>
                  <h3 className="jt-benefit__title">{benefit.title}</h3>
                  <p className="jt-benefit__text">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quick perks ──────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Quick perks">
          <div className="hiw-inner">
            <div className="jt-perks">
              <img
                className="jt-perks__img"
                src="/assets/delegates-networking.jpg"
                alt="Team Success"
                loading="lazy"
                decoding="async"
              />
              <div>
                <p className="jt-label">Quick Perks</p>
                <h2 className="jt-perks__title">Everything You Need to Succeed</h2>
                <p className="jt-perks__text">
                  We provide all the tools, training, and support you need to build a thriving
                  advisory business from day one.
                </p>

                <ul className="jt-perks__list">
                  {perks.map((perk) => (
                    <li key={perk}>
                      <span className="jt-check">
                        <Check aria-hidden="true" />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="jt-perks__actions">
                  <a
                    href="https://calendly.com/rebalarney-mympb/time-with-reba"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jt-btn jt-btn--primary"
                  >
                    Get Started Today
                    <ArrowRight aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Apply now ────────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Apply now">
          <div className="hiw-inner">
            <div className="jt-apply">
              <div className="jt-apply__copy">
                <p className="jt-label">Apply Now</p>
                <h2 className="jt-apply__title">Ready to Join Our Team?</h2>
                <p className="jt-apply__text">
                  Take the first step towards building your advisory business. Fill out the form
                  and we'll be in touch to discuss your future with MPB Health.
                </p>

                <div className="jt-apply__connect">
                  <h3 className="jt-apply__connect-title">Let's Connect!</h3>
                  <p className="jt-apply__connect-text">
                    We're excited to meet passionate, driven individuals like you
                  </p>
                </div>

                <div className="jt-apply__actions">
                  <a
                    href="https://calendly.com/rebalarney-mympb/time-with-reba"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jt-btn jt-btn--primary"
                  >
                    Schedule a Call
                    <ArrowRight aria-hidden="true" />
                  </a>
                  <a href="tel:8558164650" className="jt-btn jt-btn--ghost">
                    <Phone aria-hidden="true" />
                    (855) 816-4650
                  </a>
                </div>
              </div>

              <div className="jt-form-card">
                <div className="jt-form-card__head">
                  <h3 className="jt-form-card__title">Application Form</h3>
                  <a
                    href="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jt-form-card__open"
                  >
                    <ExternalLink aria-hidden="true" />
                    Open in New Window
                  </a>
                </div>
                <iframe
                  ref={iframeRef}
                  src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448"
                  allow="payment"
                  style={{ border: '0', width: '100%', overflow: 'hidden', minHeight: '600px' }}
                  title="Application Form"
                  onError={() => {
                    console.error('Iframe failed to load');
                  }}
                />
                <div className="jt-form-card__note">
                  <p>
                    <strong>Having trouble viewing the form?</strong> Click the "Open in New
                    Window" button above to access it directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Latest events ────────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="hiw-section" aria-label="Latest events">
            <div className="hiw-inner">
              <div className="hiw-section__header">
                <p className="jt-label">Latest Events</p>
                <h2 className="hiw-title">Join Us at Upcoming Events</h2>
                <p className="hiw-body">
                  Connect with fellow advisors and learn from industry leaders
                </p>
              </div>

              <div className="jt-events-grid">
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
                    <a key={event.id} href={`/events/${event.slug}`} className="jt-event">
                      <div className="jt-event__media">
                        <img
                          src={imageUrl}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          style={imageUrl.includes('womenHealth.jpg') ? { objectPosition: 'center 0px' } : undefined}
                        />
                      </div>
                      <div className="jt-event__body">
                        <div className="jt-event__meta">
                          <span className="jt-event__category">{event.category}</span>
                          <span>{formattedDate}</span>
                        </div>
                        <h3 className="jt-event__title">{event.title}</h3>
                        <p className="jt-event__excerpt">{event.excerpt}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Frequently asked questions">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="jt-label">FAQ</p>
              <h2 className="hiw-title">Frequently Asked Questions</h2>
              <p className="hiw-body">Get answers to common questions about joining our team</p>
            </div>

            <div className="jt-faq-wrap">
              <img
                className="jt-faq-wrap__img"
                src="/assets/mpbhealthteam.jpg"
                alt="MPB Health Team"
                loading="lazy"
                decoding="async"
              />

              <div className="jt-faq-list">
                {faqItems.map((faq, index) => (
                  <div key={faq.question} className="jt-faq">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="jt-faq__btn"
                    >
                      <h3 className="jt-faq__q">{faq.question}</h3>
                      {openFaqIndex === index ? (
                        <ChevronUp className="jt-faq__chevron" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="jt-faq__chevron" aria-hidden="true" />
                      )}
                    </button>
                    {openFaqIndex === index && (
                      <div className="jt-faq__body">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { JoinOurTeam };
export default JoinOurTeam;
