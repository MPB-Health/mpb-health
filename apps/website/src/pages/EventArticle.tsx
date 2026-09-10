import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createClientLogger } from '@mpbhealth/utils';
import { supabase, CmsEvent } from '../lib/supabase';
import { AuroraBand, LandingPage, PageHero, SectionHead, Sheet } from '../components/landing-redesign/page-kit';
import { sanitizeHtml } from '@mpbhealth/utils';

const log = createClientLogger('EventArticle');

const NOT_INSURANCE =
  'MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines.';

const FALLBACK_COVER = '/assets/brand/mpb-tile.png';

const LOCATION_TYPE_LABEL: Record<string, string> = {
  in_person: 'In person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

// Render the date in UTC so the day matches what the admin entered. The
// underlying column is `timestamptz` stored at 00:00 UTC for the chosen day,
// which would otherwise roll back to the prior day for negative-offset TZs.
const EVENT_DATE_OPTS_LONG: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** CMS image paths may be absolute URLs or repo-relative paths. */
const imageSrc = (src?: string | null) =>
  src ? (src.startsWith('http') ? src : `/${src.replace(/^\//, '')}`) : '';

/** "In Person Conference" -> "In person conference". */
const sentenceCase = (s: string) => {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function EventVideo({ url, title }: { url: string; title: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  return (
    <div className="lr-article__video">
      {ytMatch ? (
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : vimeoMatch ? (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video controls preload="metadata">
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

export const EventArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CmsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<CmsEvent[]>([]);

  const fetchEvent = useCallback(async () => {
    if (!slug) return;

    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, is_published, video_url, gallery_images')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Event not found');
        setEvent(null);
      } else {
        setEvent(data as CmsEvent);

        const { data: related } = await supabase
          .from('events')
          .select('id, title, slug, excerpt, featured_image_url, event_date')
          .eq('is_published', true)
          .neq('id', data.id)
          .order('event_date', { ascending: false })
          .limit(3);

        if (related) setRelatedEvents(related as CmsEvent[]);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetchEvent();
  }, [fetchEvent]);

  // Live updates: subscribe to changes to *this* event row and refetch on
  // tab focus, so edits made in the admin appear without a manual refresh.
  useEffect(() => {
    if (!slug) return;
    const channel = supabase
      .channel(`event-detail:${slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `slug=eq.${slug}` },
        () => {
          fetchEvent();
        }
      )
      .subscribe();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchEvent();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', fetchEvent);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', fetchEvent);
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore close-during-connect errors
      }
    };
  }, [slug, fetchEvent]);

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.excerpt,
          url: window.location.href,
        });
      } catch (_err) {
        log.info('Share cancelled or failed');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <LandingPage className="lr-article">
        <PageHero ariaLabel="Loading event" align="center" kicker="Events" title="Loading the event…" />
        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Event">
            <div className="lr-inner" />
          </section>
        </Sheet>
      </LandingPage>
    );
  }

  if (error || !event) {
    const failed = error === 'Failed to load event';
    return (
      <>
        <Helmet>
          <title>Event not found | MPB Health Events</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LandingPage className="lr-article">
          <PageHero
            ariaLabel="Event not found"
            align="center"
            kicker="Events"
            title={failed ? "We couldn't load that event." : "We couldn't find that event."}
            lede={
              failed
                ? 'Something went wrong on our side. Please try again in a moment, or browse upcoming events.'
                : 'It may have moved or been unpublished. Everything coming up is one click away.'
            }
            actions={
              <Link className="lr-btn lr-btn--white" to="/events">
                Browse all events
              </Link>
            }
          />
          <Sheet>
            <section className="lr-sec lr-sec--top" aria-label="Where to next">
              <div className="lr-inner">
                <div className="lr-article__col" style={{ textAlign: 'center' }}>
                  <p className="lr-body">
                    Want to hear about the next one first? <Link to="/contact">Get in touch</Link> and we
                    will keep you posted.
                  </p>
                </div>
              </div>
            </section>
            <AuroraBand
              title="Join a community that shares the care."
              lede="Get a personalized quote in about two minutes. No obligation."
              actions={
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get your quote
                </Link>
              }
              note={NOT_INSURANCE}
            />
          </Sheet>
        </LandingPage>
      </>
    );
  }

  const cover = imageSrc(event.featured_image_url);
  const start = new Date(event.event_date).toLocaleDateString('en-US', EVENT_DATE_OPTS_LONG);
  const end = event.event_end_date
    ? new Date(event.event_end_date).toLocaleDateString('en-US', EVENT_DATE_OPTS_LONG)
    : null;
  const where = event.location || (event.location_type === 'virtual' ? 'online' : '');
  const kicker = sentenceCase(
    `${LOCATION_TYPE_LABEL[event.location_type] || event.location_type || ''} ${event.event_type || ''}`
  );
  const gallery = (event.gallery_images ?? []).filter(Boolean);

  return (
    <>
      <Helmet>
        <title>{event.title} | MPB Health Events</title>
        <meta name="description" content={event.excerpt} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.excerpt} />
        <meta property="og:image" content={event.featured_image_url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.excerpt} />
        <meta name="twitter:image" content={event.featured_image_url} />
      </Helmet>

      <LandingPage className="lr-article">
        <PageHero
          ariaLabel="Event"
          align={cover ? 'left' : 'center'}
          kicker={kicker || undefined}
          title={event.title}
          by={
            <>
              <strong>
                <time dateTime={event.event_date}>{start}</time>
                {end ? (
                  <>
                    {' '}to <time dateTime={event.event_end_date ?? undefined}>{end}</time>
                  </>
                ) : null}
              </strong>
              {where ? `, ${where}` : ''}
              {event.organizer ? `. Hosted by ${event.organizer}.` : '.'}
            </>
          }
          lede={event.excerpt}
          actions={
            event.registration_url ? (
              <a
                className="lr-btn lr-btn--white"
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register for this event
              </a>
            ) : undefined
          }
          media={cover ? { type: 'image', src: cover, alt: event.title } : undefined}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Event details">
            <div className="lr-inner">
              {event.video_url ? (
                <div className="lr-article__col" style={{ marginBottom: '2.5rem' }}>
                  <EventVideo url={event.video_url} title={event.title} />
                </div>
              ) : null}
              <div className="lr-article__col">
                <div
                  className="lr-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.content) }}
                />
                <div className="lr-article__share">
                  {event.registration_url ? (
                    <a
                      className="lr-btn lr-btn--navy lr-btn--sm"
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register for this event
                    </a>
                  ) : null}
                  <button type="button" className="lr-btn lr-btn--ghost lr-btn--sm" onClick={handleShare}>
                    Share this event
                  </button>
                </div>
              </div>
            </div>
          </section>

          {gallery.length > 0 ? (
            <section className="lr-sec lr-sec--hair" aria-label="Event photos">
              <div className="lr-inner">
                <SectionHead title="From the day." align="left" />
                <div className="lr-tiles" style={{ '--cols': 3 } as React.CSSProperties}>
                  {gallery.map((src, idx) => (
                    <figure key={`${src}-${idx}`} className="lr-tile lr-tile--photo" style={{ margin: 0 }}>
                      <img
                        src={src}
                        alt={`${event.title}, photo ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                        }}
                      />
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {relatedEvents.length > 0 ? (
            <section className="lr-sec lr-sec--hair" aria-label="More events">
              <div className="lr-inner">
                <SectionHead title="More events." align="left" />
                <div className="lr-tiles" style={{ '--cols': 3 } as React.CSSProperties}>
                  {relatedEvents.slice(0, 3).map((related) => (
                    <Link key={related.id} to={`/events/${related.slug}`} className="lr-tile">
                      <img
                        src={imageSrc(related.featured_image_url) || FALLBACK_COVER}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_COVER;
                        }}
                      />
                      <div className="lr-tile__body">
                        <h3>{related.title}</h3>
                        <p>
                          {new Date(related.event_date).toLocaleDateString('en-US', EVENT_DATE_OPTS_LONG)}
                          {related.excerpt ? `. ${related.excerpt}` : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <AuroraBand
            title="Come to the next one."
            lede="We host conferences, webinars, and community gatherings all year. See what is coming up, or ask our team about an event near you."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/events">
                  Browse all events
                </Link>
                <Link className="lr-btn lr-btn--glass" to="/contact">
                  Contact our team
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

export default EventArticle;
