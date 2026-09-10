import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useResourceDetail, incrementDownloadCount } from '../hooks/useResources';
import { ResourceCard } from '../components/resources/ResourceCard';
import { useResources } from '../hooks/useResources';
import { AuroraBand, LandingPage, PageHero, SectionHead, Sheet } from '../components/landing-redesign/page-kit';
import { sanitizeHtml } from '@mpbhealth/utils';

const NOT_INSURANCE =
  'MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines.';

/** What the hero button says, by resource type. */
const DOWNLOAD_LABEL: Record<string, string> = {
  Guide: 'Download the guide',
  Checklist: 'Download the checklist',
  Form: 'Open the form',
  Webinar: 'Watch the webinar',
  Marketing: 'Download the materials',
};

/** CMS image paths may be absolute URLs or repo-relative paths. */
const imageSrc = (src?: string | null) =>
  src ? (src.startsWith('http') ? src : `/${src.replace(/^\//, '')}`) : '';

/** "Compliance Document" -> "Compliance document". */
const sentenceCase = (s: string) => {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

export const ResourceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { resource, loading, error } = useResourceDetail(slug || '');

  const { resources: relatedResources } = useResources({
    search: '',
    types: resource ? [resource.resource_type] : [],
    audiences: [],
    topics: [],
    sortBy: 'newest',
  });

  const related = relatedResources
    .filter((r) => r.id !== resource?.id)
    .slice(0, 3);

  const handleShare = (platform: 'twitter' | 'linkedin' | 'email') => {
    const url = window.location.href;
    const title = resource?.title || '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    };

    window.open(shareUrls[platform], '_blank');
  };

  if (loading) {
    return (
      <LandingPage className="lr-article">
        <PageHero ariaLabel="Loading resource" align="center" kicker="Resource library" title="Loading the resource…" />
        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Resource">
            <div className="lr-inner" />
          </section>
        </Sheet>
      </LandingPage>
    );
  }

  if (error || !resource) {
    return <Navigate to="/resources" replace />;
  }

  const cover = imageSrc(resource.featured_image_url);
  const type = resource.resource_type || 'Resource';
  const audience = resource.target_audience || '';
  const kicker = audience ? `${sentenceCase(type)} for ${audience.toLowerCase()}` : sentenceCase(type);
  const downloadLabel = DOWNLOAD_LABEL[type] || 'Download the resource';
  const updated = resource.updated_at || resource.published_date;

  // Keep the download counter the old button fired, but on a real link so the
  // file's href and target survive.
  const trackDownload = () => {
    if (resource.id) void incrementDownloadCount(resource.id);
  };

  return (
    <>
      <Helmet>
        <title>{resource.title} | Resource Library | MPB Health</title>
        <meta name="description" content={resource.description} />
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={resource.description} />
        <meta property="og:image" content={resource.featured_image_url} />
      </Helmet>

      <LandingPage className="lr-article">
        <PageHero
          ariaLabel="Resource"
          align={cover ? 'left' : 'center'}
          kicker={kicker}
          title={resource.title}
          lede={resource.description}
          actions={
            <>
              {resource.file_url ? (
                <a
                  className="lr-btn lr-btn--white"
                  href={resource.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackDownload}
                >
                  {downloadLabel}
                </a>
              ) : null}
              <Link className="lr-btn lr-btn--glass" to="/resources">
                Back to resources
              </Link>
            </>
          }
          media={cover ? { type: 'image', src: cover, alt: resource.title } : undefined}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Resource details">
            <div className="lr-inner">
              <ul className="lr-ledger lr-ledger--3 lr-ledger--tight" style={{ marginBottom: '2.5rem' }}>
                <li>
                  <h3>Audience</h3>
                  <p>{audience || 'Everyone'}</p>
                </li>
                <li>
                  <h3>{resource.topics.length === 1 ? 'Topic' : 'Topics'}</h3>
                  <p>{resource.topics.length > 0 ? resource.topics.join(', ') : 'General'}</p>
                </li>
                <li>
                  <h3>Updated</h3>
                  <p>
                    <time dateTime={updated}>{longDate(updated)}</time>
                  </p>
                </li>
              </ul>

              {resource.content ? (
                <div
                  className="lr-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.content) }}
                />
              ) : null}

              <div className="lr-article__share" style={{ maxWidth: '44rem' }}>
                {resource.file_url ? (
                  <a
                    className="lr-btn lr-btn--navy lr-btn--sm"
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackDownload}
                  >
                    {downloadLabel}
                  </a>
                ) : null}
                <button type="button" className="lr-btn lr-btn--ghost lr-btn--sm" onClick={() => handleShare('linkedin')}>
                  Share on LinkedIn
                </button>
                <button type="button" className="lr-btn lr-btn--ghost lr-btn--sm" onClick={() => handleShare('twitter')}>
                  Share on X
                </button>
                <button type="button" className="lr-btn lr-btn--ghost lr-btn--sm" onClick={() => handleShare('email')}>
                  Share by email
                </button>
              </div>
            </div>
          </section>

          {related.length > 0 ? (
            <section className="lr-sec lr-sec--hair" aria-label="Related resources">
              <div className="lr-inner">
                <SectionHead title="More resources like this." align="left" />
                <div className="lr-tiles" style={{ '--cols': 3 } as React.CSSProperties}>
                  {related.map((relatedResource) => (
                    <ResourceCard key={relatedResource.id} resource={relatedResource} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <AuroraBand
            title="Questions about this resource?"
            lede="Our team can walk you through any guide or form, and explain how health sharing works for your situation."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/contact">
                  Contact our team
                </Link>
                <Link className="lr-btn lr-btn--glass" to="/resources">
                  Browse all resources
                </Link>
              </>
            }
            note={NOT_INSURANCE}
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default ResourceDetail;
