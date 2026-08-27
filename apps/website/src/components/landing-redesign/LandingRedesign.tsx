import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Users,
  ShieldCheck,
  HeartPulse,
  Headset,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Video,
} from 'lucide-react';
import { GoogleGIcon, RxIcon } from './icons';
import { AuroraFlow } from './AuroraFlow';
import { homepageFaqQuestions } from '../../lib/schemaMarkup';
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

const INTRO_FEATURES = [
  {
    title: 'Community powered',
    body: 'Members contribute monthly amounts to help share eligible medical expenses, so care stays affordable.',
    Icon: Users,
  },
  {
    title: 'A personal concierge',
    body: 'A real person helps you schedule visits, navigate sharing requests, and get clear answers fast.',
    Icon: Headset,
  },
  {
    title: 'Pharmacy savings',
    body: 'Prescription discounts, plus 30% off supplements and vitamins as part of your membership.',
    Icon: RxIcon,
  },
] as const;

const PILLARS = [
  {
    title: 'Mental.',
    text: 'Access support for your mental and emotional well being.',
    image: '/assets/vibegirlD.png',
    to: '/features/mental-health',
  },
  {
    title: 'Physical.',
    text: 'Enjoy 30% off supplements and vitamins to support your overall health and wellness.',
    image: '/assets/runnervibeD.png',
    to: '/features/preventive-care',
  },
  {
    title: 'Balance.',
    text: 'Modern healthcare and real life working together so you can thrive.',
    image: '/assets/silouhettevibeD.png',
    to: '/how-it-works',
  },
] as const;

const WHY_CHIPS = [
  'Community Powered',
  'Modern Healthcare Access',
  'Worldwide Protection',
  'Preventive Care',
  'Pharmacy Savings',
  'Personal Concierge',
] as const;

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

const easeOut = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

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
      <div className="lr-social__quote-wrap">
        <p className={`lr-social__quote${long && !expanded ? ' is-clamped' : ''}`}>
          &ldquo;{quote}&rdquo;
        </p>
        {long ? (
          <button type="button" className="lr-social__more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Read less' : 'Read more'}
          </button>
        ) : null}
      </div>
      <div>
        <div className="lr-social__name">{name}</div>
        <div className="lr-social__meta">
          {location} · {family}
        </div>
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
  const heroRef = useRef<HTMLElement>(null);
  const estimateRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const heroInView = useInView(heroRef, { amount: 0.25 });
  const estimateInView = useInView(estimateRef, { amount: 0.2 });
  const showOrderBar = !heroInView && !estimateInView;

  const [navFloating, setNavFloating] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => {
    setNavFloating(y > window.innerHeight * 0.72);
  });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroContentY = useTransform(heroProgress, [0, 1], [0, 90]);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.65], [1, 0]);

  const pointerX = useMotionValue(-600);
  const pointerY = useMotionValue(-600);
  const springX = useSpring(pointerX, { stiffness: 140, damping: 22, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 140, damping: 22, mass: 0.6 });
  const dotsMask = useMotionTemplate`radial-gradient(340px at ${springX}px ${springY}px, rgba(0, 0, 0, 0.95), transparent 72%)`;
  const pointerGlow = useMotionTemplate`radial-gradient(480px at ${springX}px ${springY}px, rgba(255, 255, 255, 0.2), transparent 70%)`;

  const onHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(e.clientX - rect.left);
    pointerY.set(e.clientY - rect.top);
  };

  const onHeroPointerLeave = () => {
    pointerX.set(-600);
    pointerY.set(-600);
  };

  const scrollTrack = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  const heroStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
  };
  const heroItem = {
    hidden: reduce ? {} : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOut } },
  };

  return (
    <div className="lr">
      <LandingHeader floating={navFloating} />

      <section
        className="lr-hero"
        aria-label="Hero"
        ref={heroRef}
        onPointerMove={reduce ? undefined : onHeroPointerMove}
        onPointerLeave={reduce ? undefined : onHeroPointerLeave}
      >
        <div className="lr-hero__media">
          <AuroraFlow className="lr-hero__shader" speed={0.55} />
        </div>
        {reduce ? null : (
          <>
            <motion.div
              className="lr-hero__dots"
              aria-hidden="true"
              style={{ maskImage: dotsMask, WebkitMaskImage: dotsMask }}
            />
            <motion.div
              className="lr-hero__glow"
              aria-hidden="true"
              style={{ background: pointerGlow }}
            />
          </>
        )}
        <motion.div
          className="lr-hero__content"
          variants={heroStagger}
          initial="hidden"
          animate="show"
          style={reduce ? undefined : { y: heroContentY, opacity: heroContentOpacity }}
        >
          <motion.p variants={heroItem} className="lr-hero__kicker">
            The community-based alternative to traditional insurance.
          </motion.p>
          <motion.h1 variants={heroItem} className="lr-hero__headline">
            Healthcare that uplifts you
          </motion.h1>
          <motion.div variants={heroItem} className="lr-hero__actions">
            <a className="lr-btn lr-btn--white" href="#estimate">
              Get Your Quote
            </a>
            <p className="lr-hero__micro">Compare all memberships in 30 seconds.</p>
          </motion.div>
        </motion.div>
      </section>

      <section className="lr-intro" aria-label="Introducing MPB Health">
        <div className="lr-inner">
          <div className="lr-intro__grid">
            <Reveal>
              <div className="lr-intro__media">
                <img
                  src="/assets/vibegirlD.png"
                  alt=""
                  width={1512}
                  height={1040}
                  loading="lazy"
                  decoding="async"
                />
                <div className="lr-intro__quote">
                  <p>
                    &ldquo;MPB Health has given our family the freedom to live fully knowing we have
                    a community that&rsquo;s there when it matters most.&rdquo;
                  </p>
                  <footer>
                    <strong>Sarah M.</strong>, MPB Health Member
                  </footer>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="lr-intro__title">
                Introducing,
                <br />
                MPB Health.
              </h2>
              <p className="lr-twotone">
                Your gateway to qualified health share programs{' '}
                <span>
                  where affordable, community-based healthcare works as an alternative to
                  traditional insurance.
                </span>
              </p>
              <ul className="lr-intro__features">
                {INTRO_FEATURES.map(({ title, body, Icon }) => (
                  <li key={title} className="lr-intro__feature">
                    <span className="lr-intro__tile">
                      <Icon strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lr-strip" aria-label="Trust signals">
        <div className="lr-inner">
          <Reveal>
            <div className="lr-strip__grid">
              {TRUST.map(({ label, Icon, to }) => (
                <Link key={label} to={to} className="lr-strip__cell">
                  <Icon strokeWidth={1.7} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lr-estimate" aria-label="Quick rate estimate" id="estimate" ref={estimateRef}>
        <div className="lr-inner">
          <div className="lr-estimate__grid">
            <div className="lr-estimate__media">
              <img
                src="/assets/runnervibeD.png"
                alt=""
                width={1448}
                height={1086}
                loading="lazy"
                decoding="async"
              />
            </div>
            <Reveal>
              <QuickRateEstimateForm />
            </Reveal>
          </div>
          <div className="lr-estimate__trust">
            <span>
              <ShieldCheck /> Secure &amp; Private
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

      <section className="lr-gallery" aria-label="Mental, Physical, Balance">
        <div className="lr-inner">
          <Reveal className="lr-gallery__head">
            <h2 className="lr-gallery__title">
              Mental. Physical.
              <br />
              Balance.
            </h2>
            <p className="lr-twotone">
              Modern healthcare and real life working together{' '}
              <span>so you can thrive in every part of your well being.</span>
            </p>
          </Reveal>
          <div className="lr-gallery__grid">
            {PILLARS.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <Link to={card.to} className="lr-gallery__card">
                  <div className="lr-gallery__imgwrap">
                    <img src={card.image} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="lr-gallery__body">
                    <h3 className="lr-gallery__name">{card.title}</h3>
                    <p className="lr-gallery__text">{card.text}</p>
                    <span className="lr-gallery__link">
                      Learn more <ArrowRight />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lr-statement" aria-label="Why MPB Health">
        <div className="lr-statement__flow" aria-hidden="true" />
        <AuroraFlow />
        <div className="lr-inner lr-statement__inner">
          <Reveal>
            <h2 className="lr-statement__title">
              Health sharing that goes beyond the unexpected.
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="lr-statement__stats">
            <div>
              <div className="lr-statement__value">4.9/5</div>
              <div className="lr-statement__label">Average rating on Google Reviews</div>
            </div>
            <div>
              <div className="lr-statement__value">96%</div>
              <div className="lr-statement__label">Would recommend to friends and family</div>
            </div>
            <div>
              <div className="lr-statement__value">12,000+</div>
              <div className="lr-statement__label">Families served historically</div>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="lr-statement__chips">
              {WHY_CHIPS.map((chip) => (
                <span key={chip} className="lr-statement__chip">
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lr-social" aria-label="Member testimonials">
        <div className="lr-inner">
          <Reveal className="lr-social__head">
            <h2 className="lr-social__title">What our members say</h2>
            <p className="lr-twotone">
              Thousands of families have found a better way{' '}
              <span>to manage their healthcare costs with MPB Health.</span>
            </p>
            <a
              className="lr-social__reviews-link"
              href="https://www.google.com/search?q=MPBHealth+Reviews"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GoogleGIcon width={18} height={18} />
              View all Google Reviews
              <ExternalLink size={15} />
            </a>
          </Reveal>

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

      <section className="lr-faq" aria-label="Frequently asked questions">
        <div className="lr-inner">
          <div className="lr-faq__grid">
            <Reveal>
              <h2 className="lr-faq__title">
                Frequently
                <br />
                Asked Questions
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="lr-faq__list">
                {homepageFaqQuestions.map(({ question, answer }) => (
                  <details key={question} className="lr-faq__item">
                    <summary>
                      {question}
                      <Plus className="lr-faq__plus" strokeWidth={1.8} />
                    </summary>
                    <p className="lr-faq__answer">{answer}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <LandingFooter />

      <AnimatePresence>
        {showOrderBar ? (
          <motion.div
            className="lr-orderbar"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: easeOut }}
          >
            <div className="lr-orderbar__text">
              <div className="lr-orderbar__title">Quick Rate Estimate</div>
              <div className="lr-orderbar__sub">Compare all memberships in 30 seconds</div>
            </div>
            <a className="lr-orderbar__btn" href="#estimate">
              Get Your Quote
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default LandingRedesign;
