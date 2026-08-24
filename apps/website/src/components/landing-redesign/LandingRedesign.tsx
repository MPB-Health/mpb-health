import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  HeartPulse,
  Headset,
  Brain,
  Dumbbell,
  Leaf,
  ArrowRight,
  Stethoscope,
  Globe,
  Heart,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AgentIcon, GoogleGIcon, RxIcon } from './icons';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { QuickRateEstimateForm } from './QuickRateEstimateForm';
import './landing-redesign.css';

const TRUST = [
  { label: 'Community Powered', Icon: Users, to: '/features/health-sharing' },
  { label: 'Transparent & Simple', Icon: ShieldCheck, to: '/how-it-works' },
  { label: 'Affordable Healthcare', Icon: HeartPulse, to: '/features/preventive-care' },
  { label: 'Pharmacy Savings', Icon: RxIcon, to: '/features/rx-benefits' },
  { label: 'Personal Concierge', Icon: Headset, to: '/features/membership-concierge' },
] as const;

const PICTURE = [
  {
    title: 'Mental.',
    text: 'Access support for your mental and emotional well being.',
    Icon: Brain,
    tint: 'green' as const,
    image: '/assets/vibegirlD.png',
    width: 1512,
    height: 1040,
    to: '/features/mental-health',
  },
  {
    title: 'Physical.',
    text: 'Enjoy 30% off supplements and vitamins as part of your membership to support your overall health and wellness.',
    Icon: Dumbbell,
    tint: 'blue' as const,
    image: '/assets/runnervibeD.png',
    width: 1448,
    height: 1086,
    to: '/features/preventive-care',
  },
  {
    title: 'Balance.',
    text: 'Modern healthcare and real life working together so you can thrive.',
    Icon: Leaf,
    tint: 'green' as const,
    image: '/assets/silouhettevibeD.png',
    width: 1672,
    height: 941,
    to: '/how-it-works',
  },
] as const;

const WHY: Array<{
  label: string;
  Icon: React.ComponentType<{ strokeWidth?: number | string; fill?: string; className?: string }>;
  tint: 'green' | 'blue';
  filled?: boolean;
}> = [
  { label: 'Community\nPowered', Icon: Users, tint: 'green' },
  { label: 'Modern Healthcare\nAccess', Icon: Stethoscope, tint: 'blue' },
  { label: 'Worldwide\nProtection', Icon: Globe, tint: 'blue' },
  { label: 'Preventive\nCare', Icon: Heart, tint: 'blue', filled: true },
  { label: 'Pharmacy\nSavings', Icon: RxIcon, tint: 'blue' },
  { label: 'Personal\nConcierge', Icon: AgentIcon, tint: 'blue' },
];

const TESTIMONIALS = [
  {
    name: 'Patrick Dittoe',
    location: 'United States',
    family: 'Member',
    quote:
      'Adam at concierge services is my hero. He ended an hour of frustration trying to get Dr. visits scheduled. He was patient and informative.',
  },
  {
    name: 'Ryan Donovan',
    location: 'United States',
    family: 'Member',
    quote:
      "MPB have been rockstars all the way around. Getting set up was easy, payment was prompt and customer service has been excellent through and through. There is a learning curve coming from traditional insurance but they've been with me the whole way to make it easy and they've made sure I get what I'm looking for. Can't recommend highly enough.",
  },
  {
    name: 'Charlotte Cadieux',
    location: 'Portland, OR',
    family: 'Individual',
    quote:
      "I've cried tears of joy over how functional this system is. By far the easiest, most transparent and affordable coverage I've experienced. As an independent contractor, MPB beats anything the marketplace ever had to offer!",
  },
  {
    name: 'Laura Pascoe',
    location: 'Seattle, WA',
    family: 'Individual',
    quote:
      'In a healthcare landscape where it\'s easy to feel like just a number, MPB stands out by making me feel heard, respected, and human. They have been responsive, kind, and genuinely compassionate.',
  },
  {
    name: 'Katie Burke',
    location: 'Charlotte, NC',
    family: 'Individual',
    quote:
      "I didn't know things could ever be this easy! Angie and Adam clearly communicated and provided the assistance I needed quickly and efficiently. MPB is a refreshing change from our old BCBS coverage!",
  },
  {
    name: 'Gina Corsini Mattern',
    location: 'San Diego, CA',
    family: 'Individual',
    quote:
      'I greatly appreciate Christine introducing me to MPB Health. She did an excellent job explaining the plan and has been available to answer questions whenever they come up. Very happy with the coverage!',
  },
] as const;

function TestimonialCard({
  name,
  location,
  family,
  quote,
}: {
  name: string;
  location: string;
  family: string;
  quote: string;
}) {
  const long = quote.length >= 140;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="lr-social__card">
      <div className="lr-social__stars" aria-label="5 star rating">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} />
        ))}
      </div>
      <div className="lr-social__name">{name}</div>
      <div className="lr-social__meta">
        {location} • {family}
      </div>
      <div className="lr-social__quote-wrap">
        <Quote className="lr-social__quote-glyph" size={18} />
        <p className={`lr-social__quote${long && !expanded ? ' is-clamped' : ''}`}>"{quote}"</p>
        {long ? (
          <button type="button" className="lr-social__more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Read less' : 'Read more'}
          </button>
        ) : null}
      </div>
      <a
        className="lr-social__source"
        href="https://www.google.com/search?q=MPBHealth+Reviews"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GoogleGIcon width={14} height={14} /> Google Review
      </a>
    </article>
  );
}

export function LandingRedesign() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTrack = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  return (
    <div className="lr">
      <section className="lr-hero" aria-label="Hero">
        <div className="lr-hero__stage">
          <img
            className="lr-hero__image"
            src="/assets/hero.png"
            alt=""
            width={1920}
            height={1357}
            fetchPriority="high"
            decoding="async"
          />
          <LandingHeader />
          <div className="lr-hero__content">
            <div className="lr-hero__copy">
              <h1 className="lr-hero__headline">Healthcare that</h1>
              <img
                className="lr-hero__uplift"
                src="/assets/upliftyou.png"
                alt="uplifts you"
                width={817}
                height={370}
                decoding="async"
              />
            </div>
          </div>
          <div className="lr-hero__estimate">
            <QuickRateEstimateForm />
          </div>
        </div>
      </section>

      <section className="lr-trust" aria-label="Trust signals">
        <ul className="lr-trust__list">
          {TRUST.map(({ label, Icon, to }) => (
            <li key={label} className="lr-trust__item">
              <Link to={to} className="lr-trust__link">
                <span className="lr-trust__icon">
                  <Icon strokeWidth={1.6} />
                </span>
                <span className="lr-trust__label">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="lr-picture" aria-label="Mental, Physical, Balance">
        <div className="lr-picture__card">
          {PICTURE.map((card) => (
            <div key={card.title} className="lr-picture__col">
              <div className="lr-picture__head">
                <span className={`lr-picture__icon lr-picture__icon--${card.tint}`}>
                  <card.Icon strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="lr-picture__title">
                    <Link to={card.to}>{card.title}</Link>
                  </h3>
                  <p className="lr-picture__text">{card.text}</p>
                </div>
              </div>
              <Link to={card.to} className="lr-picture__img-link" aria-label={`${card.title} Learn more`}>
                <img
                  className="lr-picture__img"
                  src={card.image}
                  alt=""
                  width={card.width}
                  height={card.height}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              <Link to={card.to} className={`lr-picture__link lr-picture__link--${card.tint}`}>
                Learn more <ArrowRight />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="lr-why" aria-label="Why MPB Health">
        <div className="lr-why__card">
          <h2 className="lr-why__title">Why MPB Health?</h2>
          <p className="lr-why__sub">Health sharing that goes beyond the unexpected.</p>
          <div className="lr-why__grid">
            {WHY.map(({ label, Icon, tint, filled }) => (
              <div key={label} className="lr-why__item">
                <span className={`lr-why__icon lr-why__icon--${tint}`}>
                  <Icon strokeWidth={1.6} {...(filled ? { fill: 'currentColor' } : {})} />
                </span>
                <div className="lr-why__label">
                  {label.split('\n').map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lr-quote" aria-label="Member quote">
        <div className="lr-inner">
          <blockquote className="lr-quote__block">
            <p className="lr-quote__text">
              “MPB Health has given our family the freedom to live fully knowing we have a community
              that’s there when it matters most.”
            </p>
            <footer className="lr-quote__author">
              <div className="lr-quote__name">-Sarah M.</div>
              <div className="lr-quote__role">MPB Health Member</div>
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="lr-cta" aria-label="Call to action">
        <div className="lr-cta__inner">
          <h2 className="lr-cta__title">
            Ready to experience
            <br />
            healthcare differently?
          </h2>
          <a className="lr-cta__btn" href="#estimate">
            Get Your Quote <ArrowRight />
          </a>
        </div>
      </section>

      <section className="lr-social" aria-label="Social proof">
        <div className="lr-inner">
          <div className="lr-social__header">
            <h2 className="lr-social__title">What Our Members Say</h2>
            <p className="lr-social__sub">
              Join thousands of satisfied families who've discovered a better way to manage
              healthcare costs.
            </p>
            <a
              className="lr-social__reviews-link"
              href="https://www.google.com/search?q=MPBHealth+Reviews"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GoogleGIcon width={18} height={18} />
              View all Google Reviews
              <ExternalLink size={16} />
            </a>
          </div>

          <div className="lr-social__stats">
            <div>
              <div className="lr-social__stat-value">4.9/5</div>
              <div className="lr-social__stat-label">Average Rating</div>
              <div className="lr-social__stat-sub">Google Reviews</div>
            </div>
            <div>
              <div className="lr-social__stat-value">96%</div>
              <div className="lr-social__stat-label">Would Recommend</div>
              <div className="lr-social__stat-sub">To friends and family</div>
            </div>
            <div>
              <div className="lr-social__stat-value">50,000+</div>
              <div className="lr-social__stat-label">Families Served</div>
              <div className="lr-social__stat-sub">Historical enrollment</div>
            </div>
          </div>

          <div className="lr-social__carousel-wrap">
            <button
              type="button"
              className="lr-social__nav lr-social__nav--prev"
              aria-label="Show previous testimonials"
              onClick={() => scrollTrack(-1)}
            >
              <ChevronLeft />
            </button>
            <div className="lr-social__track" ref={trackRef} aria-label="Member testimonials">
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </div>
            <button
              type="button"
              className="lr-social__nav lr-social__nav--next"
              aria-label="Show next testimonials"
              onClick={() => scrollTrack(1)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export default LandingRedesign;
