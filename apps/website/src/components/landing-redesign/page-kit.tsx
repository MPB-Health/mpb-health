import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import NumberFlow, { type Format } from '@number-flow/react';
import { AuroraFlow } from './AuroraFlow';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import './landing-redesign.css';
import './landing-pages.css';

export const easeOut = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */

/**
 * Wraps an inner page in the landing chrome: overlay header that drops
 * into the glass pill once the hero is scrolled past, and the curtain
 * footer. Pages render `<PageHero>` then `<Sheet>` inside.
 */
export function LandingPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [floating, setFloating] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => {
    setFloating(y > window.innerHeight * 0.5);
  });

  return (
    <div className={`lr lr-page${className ? ` ${className}` : ''}`}>
      <LandingHeader floating={floating} />
      {children}
      <LandingFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export type HeroMedia =
  | { type: 'image'; src: string; alt?: string; width?: number; height?: number }
  | { type: 'video'; src: string; poster?: string };

export function PageHero({
  kicker,
  title,
  lede,
  actions,
  micro,
  rail,
  media,
  panel,
  caption,
  by,
  align = 'left',
  variant = 'default',
  ariaLabel,
}: {
  kicker?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  micro?: React.ReactNode;
  rail?: Array<{ value: string; label: string }>;
  media?: HeroMedia;
  /** Custom right-column module (a form, a price ladder); replaces `media`. */
  panel?: React.ReactNode;
  caption?: React.ReactNode;
  /** Attribution line under a quote-led title. */
  by?: React.ReactNode;
  align?: 'left' | 'center';
  variant?: 'default' | 'quote';
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const windowY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const windowScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
  };
  const item = {
    hidden: reduce ? {} : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOut } },
  };

  const split = Boolean(media || panel);
  const cls = [
    'lr-phero',
    split ? 'lr-phero--split' : '',
    align === 'center' ? 'lr-phero--center' : '',
    variant === 'quote' ? 'lr-phero--quote' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={cls} aria-label={ariaLabel ?? 'Page introduction'} ref={ref}>
      <div className="lr-phero__media">
        <AuroraFlow className="lr-hero__shader" speed={0.5} />
      </div>
      <div className="lr-inner lr-phero__inner">
        <div className="lr-phero__grid">
          <motion.div
            className="lr-phero__content"
            variants={stagger}
            initial="hidden"
            animate="show"
            style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
          >
            {kicker ? (
              <motion.p variants={item} className="lr-phero__kicker">
                {kicker}
              </motion.p>
            ) : null}
            <motion.h1 variants={item} className="lr-phero__title">
              {title}
            </motion.h1>
            {by ? (
              <motion.p variants={item} className="lr-phero__by">
                {by}
              </motion.p>
            ) : null}
            {lede ? (
              <motion.p variants={item} className="lr-phero__lede">
                {lede}
              </motion.p>
            ) : null}
            {actions || micro ? (
              <motion.div variants={item} className="lr-phero__actions">
                {actions}
                {micro ? <p className="lr-phero__micro">{micro}</p> : null}
              </motion.div>
            ) : null}
            {rail?.length ? (
              <motion.dl variants={item} className="lr-phero__rail">
                {rail.map((r) => (
                  <div key={r.label}>
                    <dt>{r.value}</dt>
                    <dd>{r.label}</dd>
                  </div>
                ))}
              </motion.dl>
            ) : null}
          </motion.div>

          {panel ? (
            <motion.div
              className="lr-phero__window lr-phero__window--panel"
              initial={reduce ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: easeOut, delay: 0.25 }}
              style={reduce ? undefined : { y: windowY }}
            >
              {panel}
            </motion.div>
          ) : media ? (
            <motion.div
              className="lr-phero__window"
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: easeOut, delay: 0.25 }}
              style={reduce ? undefined : { y: windowY, scale: windowScale }}
            >
              {media.type === 'video' ? (
                <video
                  src={media.src}
                  poster={media.poster}
                  autoPlay={!reduce}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
              ) : (
                <img
                  src={media.src}
                  alt={media.alt ?? ''}
                  width={media.width}
                  height={media.height}
                  // React 18.3 only forwards the lowercase form without a warning
                  {...({ fetchpriority: 'high' } as Record<string, string>)}
                  decoding="async"
                />
              )}
              {caption ? <div className="lr-phero__caption">{caption}</div> : null}
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sheet — white body rising over the hero                            */
/* ------------------------------------------------------------------ */

export function Sheet({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, -90]);
  return (
    <motion.div className="lr-sheet" style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reveal + counters                                                  */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  /** Kept for call-site compatibility; section entrances are intentionally static. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const Comp = as;
  return <Comp className={className}>{children}</Comp>;
}

export function CountUp({
  value,
  suffix,
  prefix,
  format,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  format?: Format;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const shown = inView || reduce ? value : 0;
  return (
    <span ref={ref}>
      <NumberFlow
        value={shown}
        prefix={prefix}
        suffix={suffix}
        format={format}
        transformTiming={{ duration: 1400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        spinTiming={{ duration: 1400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        opacityTiming={{ duration: 400, easing: 'ease-out' }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section head                                                       */
/* ------------------------------------------------------------------ */

export function SectionHead({
  eyebrow,
  title,
  lede,
  ledeMuted,
  align = 'center',
  children,
}: {
  /** Ignored: section eyebrows were removed from the system. */
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  ledeMuted?: React.ReactNode;
  align?: 'center' | 'left';
  children?: React.ReactNode;
}) {
  return (
    <Reveal className={`lr-sec__head${align === 'left' ? ' lr-sec__head--left' : ''}`}>
      <h2 className="lr-h2">{title}</h2>
      {lede ? (
        <p className="lr-twotone">
          {lede}
          {ledeMuted ? <> <span>{ledeMuted}</span></> : null}
        </p>
      ) : null}
      {children}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Aurora band                                                        */
/* ------------------------------------------------------------------ */

export function AuroraBand({
  title,
  lede,
  actions,
  note,
  ariaLabel,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  note?: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <section className="lr-band" aria-label={ariaLabel ?? 'Get started'}>
      <AuroraFlow className="lr-band__shader" />
      <div className="lr-inner lr-band__inner">
        <Reveal>
          <h2 className="lr-band__title">{title}</h2>
          {lede ? <p className="lr-band__lede">{lede}</p> : null}
          {actions ? <div className="lr-band__actions">{actions}</div> : null}
          {note ? <p className="lr-band__note">{note}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ list (native details, homepage skin)                           */
/* ------------------------------------------------------------------ */

export function FaqList({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: React.ReactNode }>;
}) {
  return (
    <div className="lr-faq__list">
      {items.map(({ question, answer }) => (
        <details key={question} className="lr-faq__item">
          <summary>
            {question}
            <Plus className="lr-faq__plus" strokeWidth={1.8} />
          </summary>
          {typeof answer === 'string' ? (
            <p className="lr-faq__answer">{answer}</p>
          ) : (
            <div className="lr-faq__answer">{answer}</div>
          )}
        </details>
      ))}
    </div>
  );
}

export function FaqSection({
  title = (
    <>
      Frequently asked
      <br />
      questions
    </>
  ),
  items,
  intro,
}: {
  title?: React.ReactNode;
  items: ReadonlyArray<{ question: string; answer: React.ReactNode }>;
  intro?: React.ReactNode;
}) {
  return (
    <section className="lr-faq lr-sec" aria-label="Frequently asked questions">
      <div className="lr-inner">
        <div className="lr-faq__grid">
          <Reveal>
            <h2 className="lr-faq__title">{title}</h2>
            {intro ? <p className="lr-body" style={{ marginTop: '1.2rem', maxWidth: '26rem' }}>{intro}</p> : null}
          </Reveal>
          <Reveal delay={0.1}>
            <FaqList items={items} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan cards                                                         */
/* ------------------------------------------------------------------ */

export interface PlanCardData {
  id: string;
  name: string;
  price: string;
  per?: string;
  tagline: string;
  whoFor?: string;
  features: ReadonlyArray<string>;
  enrollUrl: string;
  learnUrl?: string;
  featured?: boolean;
  badge?: string;
  footnote?: string;
}

export function PlanCard({ plan, delay = 0 }: { plan: PlanCardData; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <article className={`lr-plan${plan.featured ? ' lr-plan--featured' : ''}`}>
        {plan.badge ? <span className="lr-plan__badge">{plan.badge}</span> : null}
        <div>
          <h3 className="lr-plan__name">{plan.name}</h3>
          <p className="lr-plan__tag">{plan.tagline}</p>
        </div>
        <div className="lr-plan__price">
          <strong>{plan.price}</strong>
          <span>{plan.per ?? '/ month, starting at'}</span>
        </div>
        {plan.whoFor ? <p className="lr-plan__for">{plan.whoFor}</p> : null}
        <ul className="lr-plan__list">
          {plan.features.map((f) => (
            <li key={f}>
              <Check strokeWidth={2.4} />
              {f}
            </li>
          ))}
        </ul>
        <div className="lr-plan__actions">
          <Link
            to={plan.enrollUrl}
            className={`lr-btn ${plan.featured ? 'lr-btn--white' : 'lr-btn--navy'}`}
          >
            Enroll in {plan.name}
          </Link>
          {plan.learnUrl ? (
            <Link
              to={plan.learnUrl}
              className={`lr-btn ${plan.featured ? 'lr-btn--glass' : 'lr-btn--ghost'}`}
            >
              Learn more
            </Link>
          ) : null}
        </div>
        {plan.footnote ? <p className="lr-plan__foot">{plan.footnote}</p> : null}
      </article>
    </Reveal>
  );
}

export function PlanGrid({ plans, cols }: { plans: ReadonlyArray<PlanCardData>; cols?: number }) {
  return (
    <div className="lr-plans" style={cols ? ({ '--cols': cols } as React.CSSProperties) : undefined}>
      {plans.map((p, i) => (
        <PlanCard key={p.id} plan={p} delay={i * 0.08} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison table                                                   */
/* ------------------------------------------------------------------ */

export function CompareTable({
  columns,
  groups,
}: {
  columns: ReadonlyArray<string>;
  groups: ReadonlyArray<{
    title: string;
    rows: ReadonlyArray<{ label: string; note?: string; values: ReadonlyArray<boolean | string> }>;
  }>;
}) {
  return (
    <div className="lr-tablewrap">
      <table className="lr-table">
        <thead>
          <tr>
            <th scope="col">Feature</th>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.title}>
              <tr className="lr-table__group">
                <th scope="rowgroup" colSpan={columns.length + 1}>
                  {g.title}
                </th>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">
                    {r.label}
                    {r.note ? <small>{r.note}</small> : null}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={i}>
                      {typeof v === 'string' ? (
                        v
                      ) : v ? (
                        <span className="lr-table__yes" aria-label="Included">
                          <Check strokeWidth={2.6} />
                        </span>
                      ) : (
                        <span className="lr-table__no" aria-label="Not included">
                          <Plus style={{ transform: 'rotate(45deg)' }} strokeWidth={2.4} />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
