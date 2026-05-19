'use client';

import React, { useState, useEffect } from 'react';
import { sanitizeHtml } from '@mpbhealth/utils';
import { ArrowRight } from 'lucide-react';
import type {
  CmsBlock,
  CmsHeroProps,
  CmsRichTextProps,
  CmsImageProps,
  CmsImageGridProps,
  CmsCtaBandProps,
  CmsStatsProps,
  CmsTwoColumnProps,
  CmsFaqProps,
  CmsEmbedProps,
  CmsSpacerProps,
  CmsBannerProps,
  CmsTestimonialProps,
  CmsTestimonialCarouselProps,
  CmsPricingTableProps,
  CmsTabsProps,
  CmsAccordionProps,
  CmsTeamGridProps,
  CmsLogoWallProps,
  CmsCountdownProps,
  CmsNewsletterSignupProps,
  CmsDividerProps,
  CmsVideoHeroProps,
  CmsIconGridProps,
  CmsAlertBoxProps,
  CmsButtonGroupProps,
  CmsMapProps,
  CmsTableProps,
} from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function CtaLink({
  href,
  label,
  variant = 'primary',
}: {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const isExternal = /^https?:\/\//i.test(href);
  const target = isExternal ? '_blank' : undefined;
  const rel = isExternal ? 'noopener noreferrer' : undefined;
  const base =
    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors';
  const className =
    variant === 'primary'
      ? `${base} bg-primary text-white hover:bg-primary/90`
      : `${base} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`;
  return (
    <a href={href} target={target} rel={rel} className={className}>
      {label}
      <ArrowRight className="w-4 h-4" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroBlock({ props }: { props: CmsHeroProps }) {
  const alignment = props.alignment ?? 'center';
  const align = alignment === 'left' ? 'text-left items-start' : 'text-center items-center';
  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      style={
        props.background_image
          ? {
              backgroundImage: `url('${props.background_image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {props.background_image && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/65 to-white/85" />
      )}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-6 ${align}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 text-balance">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl leading-relaxed">
              {props.subtitle}
            </p>
          )}
          {(props.primary_cta || props.secondary_cta) && (
            <div className={`flex flex-wrap gap-3 ${alignment === 'center' ? 'justify-center' : ''}`}>
              {props.primary_cta && (
                <CtaLink
                  href={props.primary_cta.href}
                  label={props.primary_cta.label}
                  variant="primary"
                />
              )}
              {props.secondary_cta && (
                <CtaLink
                  href={props.secondary_cta.href}
                  label={props.secondary_cta.label}
                  variant="secondary"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Rich text
// ---------------------------------------------------------------------------

function RichTextBlock({ props }: { props: CmsRichTextProps }) {
  const widthClass = props.max_width === 'wide' ? 'max-w-5xl' : 'max-w-3xl';
  return (
    <section className="py-12 sm:py-16">
      <div className={`mx-auto ${widthClass} px-4 sm:px-6 lg:px-8`}>
        <div
          className="prose prose-neutral max-w-none prose-headings:text-neutral-900 prose-a:text-primary prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.html || '') }}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

function ImageBlock({ props }: { props: CmsImageProps }) {
  const aspectClass =
    props.aspect_ratio === '4:3'
      ? 'aspect-[4/3]'
      : props.aspect_ratio === '1:1'
        ? 'aspect-square'
        : props.aspect_ratio === 'auto'
          ? ''
          : 'aspect-video';
  return (
    <section className="py-8 sm:py-12">
      <figure className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`${aspectClass} overflow-hidden rounded-xl bg-neutral-100`}>
          <img
            src={props.src}
            alt={props.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {props.caption && (
          <figcaption className="mt-3 text-center text-sm text-neutral-500">
            {props.caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Image grid
// ---------------------------------------------------------------------------

function ImageGridBlock({ props }: { props: CmsImageGridProps }) {
  const cols =
    props.columns === 4
      ? 'lg:grid-cols-4'
      : props.columns === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-3';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 ${cols} gap-4`}>
          {props.items.map((item, idx) => (
            <figure key={`${item.src}-${idx}`} className="overflow-hidden rounded-lg">
              <div className="aspect-square bg-neutral-100 overflow-hidden">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              {item.caption && (
                <figcaption className="mt-2 text-sm text-neutral-500 text-center">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA band
// ---------------------------------------------------------------------------

function CtaBandBlock({ props }: { props: CmsCtaBandProps }) {
  const isSubtle = props.variant === 'subtle';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`rounded-2xl px-8 py-12 sm:px-12 sm:py-14 flex flex-col items-center text-center gap-5 ${
            isSubtle
              ? 'bg-neutral-100 text-neutral-900'
              : 'bg-gradient-to-r from-primary to-cyan-600 text-white'
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-balance">{props.title}</h2>
          {props.subtitle && (
            <p
              className={`max-w-2xl text-base sm:text-lg ${
                isSubtle ? 'text-neutral-600' : 'text-white/90'
              }`}
            >
              {props.subtitle}
            </p>
          )}
          <CtaLink
            href={props.cta.href}
            label={props.cta.label}
            variant={isSubtle ? 'primary' : 'secondary'}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function StatsBlock({ props }: { props: CmsStatsProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-6 ${
            props.items.length === 4
              ? 'sm:grid-cols-2 lg:grid-cols-4'
              : props.items.length === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-3'
          }`}
        >
          {props.items.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="bg-white rounded-xl border border-neutral-200 p-6 text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">
                {item.value}
              </div>
              <div className="mt-2 text-sm text-neutral-600">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Two-column
// ---------------------------------------------------------------------------

function TwoColumnBlock({ props }: { props: CmsTwoColumnProps }) {
  const imageFirst = props.image_position === 'left';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid lg:grid-cols-2 gap-10 items-center ${
            imageFirst ? '' : 'lg:[&>*:first-child]:order-1'
          }`}
        >
          <div className="aspect-video lg:aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
            <img
              src={props.image_src}
              alt={props.image_alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            {props.title && (
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                {props.title}
              </h2>
            )}
            <div
              className="prose prose-neutral max-w-none prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.body_html || '') }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function FaqBlock({ props }: { props: CmsFaqProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
            {props.title}
          </h2>
        )}
        <div className="space-y-3">
          {props.items.map((item, idx) => (
            <details
              key={`${item.question}-${idx}`}
              className="group bg-white border border-neutral-200 rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-medium text-neutral-900 flex items-center justify-between">
                <span>{item.question}</span>
                <span className="transition-transform group-open:rotate-180 text-neutral-400">
                  ▾
                </span>
              </summary>
              <div
                className="px-5 pb-5 prose prose-neutral max-w-none prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer_html || '') }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Embed (YouTube / Vimeo / generic iframe)
// ---------------------------------------------------------------------------

function parseEmbedSrc(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

function EmbedBlock({ props }: { props: CmsEmbedProps }) {
  const src = parseEmbedSrc(props.url);
  if (!src) {
    return null;
  }
  const aspect =
    props.aspect_ratio === '4:3'
      ? 'aspect-[4/3]'
      : props.aspect_ratio === '1:1'
        ? 'aspect-square'
        : 'aspect-video';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className={`${aspect} overflow-hidden rounded-xl bg-neutral-900`}>
          <iframe
            src={src}
            title={props.title || 'Embedded media'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Spacer
// ---------------------------------------------------------------------------

function SpacerBlock({ props }: { props: CmsSpacerProps }) {
  const h =
    props.size === 'sm'
      ? 'h-6'
      : props.size === 'lg'
        ? 'h-20'
        : props.size === 'xl'
          ? 'h-32'
          : 'h-12';
  return <div aria-hidden className={h} />;
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function BannerBlock({ props }: { props: CmsBannerProps }) {
  const variantStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    promo: 'bg-gradient-to-r from-primary/10 to-cyan-500/10 border-primary/20 text-neutral-900',
  };
  const style = variantStyles[props.variant ?? 'info'] || variantStyles.info;
  return (
    <section className={`border-y ${style}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-3 text-sm font-medium">
        <span>{props.text}</span>
        {props.link && (
          <a
            href={props.link.href}
            className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
          >
            {props.link.label}
          </a>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Testimonial
// ---------------------------------------------------------------------------

function TestimonialBlock({ props }: { props: CmsTestimonialProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <blockquote className="bg-white rounded-xl border border-neutral-200 p-8 sm:p-10">
          <p className="text-lg sm:text-xl text-neutral-700 leading-relaxed italic">
            &ldquo;{props.quote}&rdquo;
          </p>
          <footer className="mt-6 flex items-center gap-4">
            {props.avatar_src && (
              <img
                src={props.avatar_src}
                alt={props.author}
                className="w-12 h-12 rounded-full object-cover bg-neutral-100"
              />
            )}
            <div>
              <div className="font-semibold text-neutral-900">{props.author}</div>
              {props.role && (
                <div className="text-sm text-neutral-500">{props.role}</div>
              )}
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Testimonial Carousel
// ---------------------------------------------------------------------------

function TestimonialCarouselBlock({ props }: { props: CmsTestimonialCarouselProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
            {props.title}
          </h2>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-300">
          {props.items.map((item, idx) => (
            <blockquote
              key={`${item.author}-${idx}`}
              className="flex-shrink-0 w-[320px] sm:w-[380px] snap-start bg-white rounded-xl border border-neutral-200 p-6"
            >
              <p className="text-neutral-700 leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-4 flex items-center gap-3">
                {item.avatar_src && (
                  <img
                    src={item.avatar_src}
                    alt={item.author}
                    className="w-10 h-10 rounded-full object-cover bg-neutral-100"
                  />
                )}
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">{item.author}</div>
                  {item.role && (
                    <div className="text-xs text-neutral-500">{item.role}</div>
                  )}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing Table
// ---------------------------------------------------------------------------

function PricingTableBlock({ props }: { props: CmsPricingTableProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-10">
            {props.title}
          </h2>
        )}
        <div
          className={`grid gap-6 ${
            props.plans.length === 2
              ? 'sm:grid-cols-2 max-w-3xl mx-auto'
              : props.plans.length >= 4
                ? 'sm:grid-cols-2 lg:grid-cols-4'
                : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {props.plans.map((plan, idx) => (
            <div
              key={`${plan.name}-${idx}`}
              className={`rounded-xl border p-6 sm:p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-primary ring-2 ring-primary/20 bg-white'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
              {plan.description && (
                <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>
              )}
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-neutral-500 ml-1">/{plan.period}</span>
                )}
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-sm text-neutral-600">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.cta && (
                <CtaLink
                  href={plan.cta.href}
                  label={plan.cta.label}
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function TabsBlock({ props }: { props: CmsTabsProps }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
            {props.title}
          </h2>
        )}
        <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
          {props.tabs.map((tab, idx) => (
            <button
              key={`${tab.label}-${idx}`}
              onClick={() => setActiveIdx(idx)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                idx === activeIdx
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {props.tabs[activeIdx] && (
            <div
              className="prose prose-neutral max-w-none prose-headings:text-neutral-900 prose-a:text-primary"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(props.tabs[activeIdx].content_html || ''),
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

function AccordionBlock({ props }: { props: CmsAccordionProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
            {props.title}
          </h2>
        )}
        <div className="space-y-3">
          {props.items.map((item, idx) => (
            <details
              key={`${item.heading}-${idx}`}
              className="group bg-white border border-neutral-200 rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-medium text-neutral-900 flex items-center justify-between">
                <span>{item.heading}</span>
                <span className="transition-transform group-open:rotate-180 text-neutral-400">
                  ▾
                </span>
              </summary>
              <div
                className="px-5 pb-5 prose prose-neutral max-w-none prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.body_html || '') }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Team Grid
// ---------------------------------------------------------------------------

function TeamGridBlock({ props }: { props: CmsTeamGridProps }) {
  const cols =
    props.columns === 2
      ? 'sm:grid-cols-2'
      : props.columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-10">
            {props.title}
          </h2>
        )}
        <div className={`grid gap-6 ${cols}`}>
          {props.members.map((member, idx) => (
            <div
              key={`${member.name}-${idx}`}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden text-center"
            >
              {member.photo_src && (
                <div className="aspect-square bg-neutral-100 overflow-hidden">
                  <img
                    src={member.photo_src}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="font-semibold text-neutral-900">{member.name}</div>
                {member.role && (
                  <div className="text-sm text-neutral-500 mt-0.5">{member.role}</div>
                )}
                {member.bio && (
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{member.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Logo Wall
// ---------------------------------------------------------------------------

function LogoWallBlock({ props }: { props: CmsLogoWallProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-lg font-semibold text-neutral-500 text-center mb-8 uppercase tracking-wider">
            {props.title}
          </h2>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {props.logos.map((logo, idx) => (
            <img
              key={`${logo.src}-${idx}`}
              src={logo.src}
              alt={logo.alt}
              className={`h-8 sm:h-10 w-auto object-contain ${
                props.grayscale ? 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all' : ''
              }`}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

function CountdownBlock({ props }: { props: CmsCountdownProps }) {
  const calcTimeLeft = () => {
    const diff = new Date(props.target_date).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.target_date]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-8">
            {props.title}
          </h2>
        )}
        <div className="flex justify-center gap-4 sm:gap-6">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <span className="mt-2 text-xs sm:text-sm text-neutral-500 font-medium">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Newsletter Signup
// ---------------------------------------------------------------------------

function NewsletterSignupBlock({ props }: { props: CmsNewsletterSignupProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
            {props.title}
          </h2>
        )}
        {props.description && (
          <p className="text-neutral-600 mb-6">{props.description}</p>
        )}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder={props.placeholder || 'Enter your email'}
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            {props.button_label || 'Subscribe'}
          </button>
        </form>
        {props.disclaimer && (
          <p className="mt-3 text-xs text-neutral-400">{props.disclaimer}</p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

function DividerBlock({ props }: { props: CmsDividerProps }) {
  const width = props.width === 'full' ? 'max-w-none' : props.width === 'narrow' ? 'max-w-xs' : 'max-w-2xl';
  const style =
    props.style === 'dashed'
      ? 'border-dashed'
      : props.style === 'dotted'
        ? 'border-dotted'
        : 'border-solid';
  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <hr className={`${width} mx-auto border-t border-neutral-200 ${style}`} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Video Hero
// ---------------------------------------------------------------------------

function VideoHeroBlock({ props }: { props: CmsVideoHeroProps }) {
  const alignment = props.alignment ?? 'center';
  const align = alignment === 'left' ? 'text-left items-start' : 'text-center items-center';
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <video
        src={props.video_src}
        poster={props.poster_src}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-6 ${align}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-balance">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
              {props.subtitle}
            </p>
          )}
          {props.cta && (
            <a
              href={props.cta.href}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white/90 transition-colors"
            >
              {props.cta.label}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Icon Grid
// ---------------------------------------------------------------------------

function IconGridBlock({ props }: { props: CmsIconGridProps }) {
  const cols =
    props.columns === 2
      ? 'sm:grid-cols-2'
      : props.columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-10">
            {props.title}
          </h2>
        )}
        <div className={`grid gap-6 ${cols}`}>
          {props.items.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="bg-white rounded-xl border border-neutral-200 p-6"
            >
              {item.icon && (
                <div className="text-3xl mb-3">{item.icon}</div>
              )}
              <h3 className="font-semibold text-neutral-900">{item.title}</h3>
              {item.description && (
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alert Box
// ---------------------------------------------------------------------------

function AlertBoxBlock({ props }: { props: CmsAlertBoxProps }) {
  const variantStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };
  const style = variantStyles[props.variant ?? 'info'] || variantStyles.info;
  const icons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };
  const icon = icons[props.variant ?? 'info'] || icons.info;
  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className={`rounded-xl border p-5 flex gap-3 ${style}`}>
          <span className="text-lg flex-shrink-0">{icon}</span>
          <div>
            {props.title && (
              <div className="font-semibold mb-1">{props.title}</div>
            )}
            <div
              className="prose prose-sm max-w-none [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.body_html || '') }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Button Group
// ---------------------------------------------------------------------------

function ButtonGroupBlock({ props }: { props: CmsButtonGroupProps }) {
  const alignment =
    props.alignment === 'left'
      ? 'justify-start'
      : props.alignment === 'right'
        ? 'justify-end'
        : 'justify-center';
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-wrap gap-3 ${alignment}`}>
          {props.buttons.map((btn, idx) => (
            <CtaLink
              key={`${btn.label}-${idx}`}
              href={btn.href}
              label={btn.label}
              variant={btn.variant === 'secondary' ? 'secondary' : 'primary'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

function MapBlock({ props }: { props: CmsMapProps }) {
  const src = props.embed_url || `https://www.google.com/maps?q=${encodeURIComponent(props.address || '')}&output=embed`;
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-6">
            {props.title}
          </h2>
        )}
        <div className="aspect-video overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          <iframe
            src={src}
            title={props.title || 'Map'}
            className="w-full h-full"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function TableBlock({ props }: { props: CmsTableProps }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {props.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
            {props.title}
          </h2>
        )}
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            {props.headers && props.headers.length > 0 && (
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  {props.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left font-semibold text-neutral-900"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-100">
              {props.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-neutral-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Public renderer + metadata for the admin UI
// ---------------------------------------------------------------------------

export interface BlockMeta {
  kind: CmsBlock['kind'];
  label: string;
  description: string;
  defaultProps: Record<string, unknown>;
}

export const BLOCK_REGISTRY: BlockMeta[] = [
  {
    kind: 'hero',
    label: 'Hero',
    description: 'Large title with subtitle and call-to-action buttons',
    defaultProps: {
      title: 'Section title',
      subtitle: 'Supporting subtitle copy',
      primary_cta: { label: 'Get started', href: '/contact' },
    } satisfies Partial<CmsHeroProps>,
  },
  {
    kind: 'rich_text',
    label: 'Rich Text',
    description: 'Formatted body content with headings, lists, and links',
    defaultProps: { html: '<p>Start writing…</p>' } satisfies Partial<CmsRichTextProps>,
  },
  {
    kind: 'image',
    label: 'Image',
    description: 'Single image with optional caption',
    defaultProps: { src: '', alt: '', aspect_ratio: '16:9' } satisfies Partial<CmsImageProps>,
  },
  {
    kind: 'image_grid',
    label: 'Image Grid',
    description: 'Gallery of images in a responsive grid',
    defaultProps: { columns: 3, items: [] } satisfies Partial<CmsImageGridProps>,
  },
  {
    kind: 'cta_band',
    label: 'CTA Band',
    description: 'Full-width call to action with a single button',
    defaultProps: {
      title: 'Ready to get started?',
      cta: { label: 'Contact us', href: '/contact' },
    } satisfies Partial<CmsCtaBandProps>,
  },
  {
    kind: 'stats',
    label: 'Stats',
    description: '3 or 4 number+label cards in a row',
    defaultProps: {
      items: [
        { value: '50k+', label: 'Members' },
        { value: '20+', label: 'States' },
        { value: '$1B', label: 'Shared' },
      ],
    } satisfies Partial<CmsStatsProps>,
  },
  {
    kind: 'two_column',
    label: 'Two-Column',
    description: 'Image on one side, text on the other',
    defaultProps: {
      title: 'Section title',
      body_html: '<p>Body content goes here.</p>',
      image_src: '',
      image_alt: '',
      image_position: 'right',
    } satisfies Partial<CmsTwoColumnProps>,
  },
  {
    kind: 'faq',
    label: 'FAQ',
    description: 'Collapsible Q&A list',
    defaultProps: {
      title: 'Frequently asked questions',
      items: [{ question: 'Sample question?', answer_html: '<p>Sample answer.</p>' }],
    } satisfies Partial<CmsFaqProps>,
  },
  {
    kind: 'embed',
    label: 'Embed',
    description: 'YouTube, Vimeo, or generic HTTPS iframe',
    defaultProps: { url: '', aspect_ratio: '16:9' } satisfies Partial<CmsEmbedProps>,
  },
  {
    kind: 'spacer',
    label: 'Spacer',
    description: 'Vertical empty space between sections',
    defaultProps: { size: 'md' } satisfies Partial<CmsSpacerProps>,
  },
  {
    kind: 'banner',
    label: 'Banner',
    description: 'Full-width announcement strip with variant colors',
    defaultProps: {
      text: 'Important announcement goes here',
      variant: 'info',
    } satisfies Partial<CmsBannerProps>,
  },
  {
    kind: 'testimonial',
    label: 'Testimonial',
    description: 'Single quote card with author info',
    defaultProps: {
      quote: 'This product changed everything for us.',
      author: 'Jane Doe',
      role: 'CEO, Acme Corp',
    } satisfies Partial<CmsTestimonialProps>,
  },
  {
    kind: 'testimonial_carousel',
    label: 'Testimonial Carousel',
    description: 'Scrollable row of testimonial quotes',
    defaultProps: {
      items: [
        { quote: 'Amazing experience!', author: 'Jane Doe', role: 'CEO' },
        { quote: 'Highly recommended.', author: 'John Smith', role: 'CTO' },
      ],
    } satisfies Partial<CmsTestimonialCarouselProps>,
  },
  {
    kind: 'pricing_table',
    label: 'Pricing Table',
    description: 'Comparison columns for plans and pricing',
    defaultProps: {
      plans: [
        { name: 'Basic', price: '$9', period: 'mo', features: ['Feature 1', 'Feature 2'], cta: { label: 'Choose', href: '#' } },
        { name: 'Pro', price: '$29', period: 'mo', features: ['All Basic features', 'Feature 3'], highlighted: true, cta: { label: 'Choose', href: '#' } },
      ],
    } satisfies Partial<CmsPricingTableProps>,
  },
  {
    kind: 'tabs',
    label: 'Tabs',
    description: 'Tabbed content sections with client-side navigation',
    defaultProps: {
      tabs: [
        { label: 'Tab 1', content_html: '<p>Tab 1 content.</p>' },
        { label: 'Tab 2', content_html: '<p>Tab 2 content.</p>' },
      ],
    } satisfies Partial<CmsTabsProps>,
  },
  {
    kind: 'accordion',
    label: 'Accordion',
    description: 'Generic expandable sections',
    defaultProps: {
      items: [{ heading: 'Section 1', body_html: '<p>Content here.</p>' }],
    } satisfies Partial<CmsAccordionProps>,
  },
  {
    kind: 'team_grid',
    label: 'Team Grid',
    description: 'Photo + name + role cards in a grid',
    defaultProps: {
      columns: 3,
      members: [{ name: 'Jane Doe', role: 'CEO', photo_src: '' }],
    } satisfies Partial<CmsTeamGridProps>,
  },
  {
    kind: 'logo_wall',
    label: 'Logo Wall',
    description: 'Logo grid with optional grayscale filter',
    defaultProps: {
      logos: [{ src: '', alt: 'Partner' }],
      grayscale: true,
    } satisfies Partial<CmsLogoWallProps>,
  },
  {
    kind: 'countdown',
    label: 'Countdown',
    description: 'Countdown timer to a target date',
    defaultProps: {
      title: 'Coming soon',
      target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    } satisfies Partial<CmsCountdownProps>,
  },
  {
    kind: 'newsletter_signup',
    label: 'Newsletter Signup',
    description: 'Email capture form with title and description',
    defaultProps: {
      title: 'Stay in the loop',
      description: 'Get the latest updates straight to your inbox.',
      button_label: 'Subscribe',
    } satisfies Partial<CmsNewsletterSignupProps>,
  },
  {
    kind: 'divider',
    label: 'Divider',
    description: 'Horizontal separator with style variants',
    defaultProps: { style: 'solid', width: 'medium' } satisfies Partial<CmsDividerProps>,
  },
  {
    kind: 'video_hero',
    label: 'Video Hero',
    description: 'Hero section with video background',
    defaultProps: {
      title: 'Section title',
      video_src: '',
    } satisfies Partial<CmsVideoHeroProps>,
  },
  {
    kind: 'icon_grid',
    label: 'Icon Grid',
    description: 'Feature cards with icons and descriptions',
    defaultProps: {
      columns: 3,
      items: [{ icon: '🚀', title: 'Feature', description: 'Description goes here.' }],
    } satisfies Partial<CmsIconGridProps>,
  },
  {
    kind: 'alert_box',
    label: 'Alert Box',
    description: 'Callout box with variant styling',
    defaultProps: {
      variant: 'info',
      title: 'Note',
      body_html: '<p>Important information here.</p>',
    } satisfies Partial<CmsAlertBoxProps>,
  },
  {
    kind: 'button_group',
    label: 'Button Group',
    description: 'Row of CTA buttons',
    defaultProps: {
      alignment: 'center',
      buttons: [{ label: 'Primary', href: '#', variant: 'primary' }],
    } satisfies Partial<CmsButtonGroupProps>,
  },
  {
    kind: 'map',
    label: 'Map',
    description: 'Embedded Google Map',
    defaultProps: {
      address: '1600 Amphitheatre Parkway, Mountain View, CA',
    } satisfies Partial<CmsMapProps>,
  },
  {
    kind: 'table',
    label: 'Table',
    description: 'Data table with clean styling',
    defaultProps: {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [['Cell 1', 'Cell 2', 'Cell 3']],
    } satisfies Partial<CmsTableProps>,
  },
];

export function BlockRenderer({ block }: { block: CmsBlock }) {
  switch (block.kind) {
    case 'hero':
      return <HeroBlock props={block.props} />;
    case 'rich_text':
      return <RichTextBlock props={block.props} />;
    case 'image':
      return <ImageBlock props={block.props} />;
    case 'image_grid':
      return <ImageGridBlock props={block.props} />;
    case 'cta_band':
      return <CtaBandBlock props={block.props} />;
    case 'stats':
      return <StatsBlock props={block.props} />;
    case 'two_column':
      return <TwoColumnBlock props={block.props} />;
    case 'faq':
      return <FaqBlock props={block.props} />;
    case 'embed':
      return <EmbedBlock props={block.props} />;
    case 'spacer':
      return <SpacerBlock props={block.props} />;
    case 'banner':
      return <BannerBlock props={block.props} />;
    case 'testimonial':
      return <TestimonialBlock props={block.props} />;
    case 'testimonial_carousel':
      return <TestimonialCarouselBlock props={block.props} />;
    case 'pricing_table':
      return <PricingTableBlock props={block.props} />;
    case 'tabs':
      return <TabsBlock props={block.props} />;
    case 'accordion':
      return <AccordionBlock props={block.props} />;
    case 'team_grid':
      return <TeamGridBlock props={block.props} />;
    case 'logo_wall':
      return <LogoWallBlock props={block.props} />;
    case 'countdown':
      return <CountdownBlock props={block.props} />;
    case 'newsletter_signup':
      return <NewsletterSignupBlock props={block.props} />;
    case 'divider':
      return <DividerBlock props={block.props} />;
    case 'video_hero':
      return <VideoHeroBlock props={block.props} />;
    case 'icon_grid':
      return <IconGridBlock props={block.props} />;
    case 'alert_box':
      return <AlertBoxBlock props={block.props} />;
    case 'button_group':
      return <ButtonGroupBlock props={block.props} />;
    case 'map':
      return <MapBlock props={block.props} />;
    case 'table':
      return <TableBlock props={block.props} />;
    default:
      return null;
  }
}
