import React from 'react';
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
  // Only allow http(s) iframes — never javascript: or data: URLs.
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
    default: {
      // Exhaustive-check fallback — `_kind` ensures TS errors if a new block
      // kind is added to the union but missing from this switch.
      const _kind: never = block;
      void _kind;
      return null;
    }
  }
}
