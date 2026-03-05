import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, MapPin, ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { createClientLogger } from '@mpbhealth/utils';
import { supabase, CmsEvent } from '../lib/supabase';
import { sanitizeHtml } from '@mpbhealth/utils';

const log = createClientLogger('EventArticle');

const LOCATION_TYPE_LABEL: Record<string, string> = {
  in_person: 'In Person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

export const EventArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CmsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<CmsEvent[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Event not found');
          setEvent(null);
        } else {
          setEvent(data);

          const { data: related } = await supabase
            .from('events')
            .select('*')
            .eq('is_published', true)
            .neq('id', data.id)
            .order('event_date', { ascending: false })
            .limit(3);

          if (related) setRelatedEvents(related);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

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
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-neutral-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            {error || 'Event Not Found'}
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const endDate = event.event_end_date ? new Date(event.event_end_date) : null;

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

      <article className="bg-white">
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
          </div>
        </div>

        <header className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {LOCATION_TYPE_LABEL[event.location_type] || event.location_type}
            </span>
            <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-full capitalize">
              {event.event_type}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-neutral-600 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={event.event_date}>
                {eventDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {endDate && ` - ${endDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`}
              </time>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            {event.organizer && (
              <div className="text-neutral-500">
                Organized by <span className="font-medium text-neutral-700">{event.organizer}</span>
              </div>
            )}
          </div>

          <p className="text-xl text-neutral-600 leading-relaxed">
            {event.excerpt}
          </p>

          <div className="mt-6 flex items-center gap-4">
            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Register Now
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-primary border border-neutral-300 rounded-lg hover:border-primary transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </header>

        {event.featured_image_url && (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-12">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-neutral-100">
              <img
                src={event.featured_image_url.startsWith('http') ? event.featured_image_url : `/${event.featured_image_url.replace(/^\//, '')}`}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
          <div
            className="prose prose-lg prose-neutral max-w-none
              prose-headings:font-bold prose-headings:text-neutral-900
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-neutral-900 prose-strong:font-semibold
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-neutral-700 prose-li:my-2
              prose-blockquote:border-l-4 prose-blockquote:border-primary
              prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-neutral-600
              prose-img:rounded-lg prose-img:shadow-md
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.content) }}
          />
        </div>

        {relatedEvents.length > 0 && (
          <div className="bg-neutral-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-8">
                Related Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedEvents.map((related) => (
                  <Link
                    key={related.id}
                    to={`/events/${related.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-neutral-200"
                  >
                    <div className="relative h-48 overflow-hidden bg-neutral-100">
                      {related.featured_image_url ? (
                        <img
                          src={related.featured_image_url.startsWith('http') ? related.featured_image_url : `/${related.featured_image_url.replace(/^\//, '')}`}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(related.event_date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-neutral-600 text-sm line-clamp-2">
                        {related.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
};

export default EventArticle;
