import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Users, Award, MapPin } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { supabase, CmsEvent } from '../lib/supabase';
import { useCmsLive } from '../hooks/useCmsLive';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './events.css';

const LOCATION_TYPE_LABEL: Record<string, string> = {
  in_person: 'In Person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

// event_date is stored as a `timestamptz` with the admin's chosen day at
// 00:00 UTC. In any negative-offset timezone (e.g. Eastern), naively
// passing that to toLocaleDateString rolls it back one calendar day.
// Forcing UTC keeps the displayed day equal to the day the admin entered.
function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const Events: React.FC = () => {
  // Live data: Realtime subscription + refetch on tab focus so edits made
  // in the admin appear here within ~1s without a manual page refresh.
  const { data: events, loading } = useCmsLive<CmsEvent>({
    table: 'events',
    realtimeFilter: 'is_published=eq.true',
    buildQuery: () =>
      supabase
        .from('events')
        .select('id, title, slug, excerpt, featured_image_url, event_date, location, location_type')
        .eq('is_published', true)
        .order('event_date', { ascending: false }),
  });

  return (
    <>
      <Helmet>
        <title>Events | MPB Health</title>
        <meta
          name="description"
          content="Explore MPB Health's events, conferences, and community gatherings. Join us as we celebrate excellence and build connections in healthcare."
        />
      </Helmet>

      <div className="lr hiw evt">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="MPB Health events">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="evt-label">Events</p>
              <h1 className="hiw-hero__title">MPB Health Events &amp; Celebrations</h1>
              <p className="hiw-hero__lede">
                Join us as we celebrate excellence, build connections, and shape the future of
                community healthcare. Discover our latest events and company culture.
              </p>
              <div className="evt-hero__stats">
                <span className="evt-stat">
                  <Calendar aria-hidden="true" />
                  Year-Round Events
                </span>
                <span className="evt-stat">
                  <Users aria-hidden="true" />
                  Community Focused
                </span>
                <span className="evt-stat">
                  <Award aria-hidden="true" />
                  Excellence Celebrated
                </span>
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/delegates-networking.jpg"
              alt="Delegates networking at an MPB Health event"
              width={1600}
              height={1067}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Latest events ────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Latest events">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Latest Events</h2>
              <p className="hiw-body">
                Explore our complete collection of events, celebrations, and community gatherings
              </p>
            </div>

            {loading ? (
              <div className="evt-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="evt-skeleton">
                    <div className="evt-skeleton__img" />
                    <div className="evt-skeleton__body">
                      <div className="evt-skeleton__bar" style={{ height: '0.8rem', width: '30%', marginBottom: '0.9rem' }} />
                      <div className="evt-skeleton__bar" style={{ height: '1.1rem', width: '90%', marginBottom: '0.7rem' }} />
                      <div className="evt-skeleton__bar" style={{ height: '0.8rem', width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="evt-state">
                <div className="evt-state__icon">
                  <Calendar aria-hidden="true" />
                </div>
                <h3 className="evt-state__title">No events available yet</h3>
                <p className="evt-state__text">Check back soon!</p>
              </div>
            ) : (
              <div className="evt-grid">
                {events.map((event) => (
                  <Link key={event.id} to={`/events/${event.slug}`} className="evt-card">
                    <div className="evt-card__media">
                      {event.featured_image_url ? (
                        <img
                          src={event.featured_image_url.startsWith('https') ? event.featured_image_url : `/${event.featured_image_url.replace(/^\//, '')}`}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Calendar className="evt-card__media-fallback" aria-hidden="true" />
                      )}
                    </div>
                    <div className="evt-card__body">
                      <div className="evt-card__meta">
                        <span className="evt-card__meta-item">
                          <Calendar aria-hidden="true" />
                          <span>{formatEventDate(event.event_date)}</span>
                        </span>
                        {event.location && (
                          <span className="evt-card__meta-item">
                            <MapPin aria-hidden="true" />
                            <span>{event.location}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="evt-card__title">{event.title}</h3>
                      <p className="evt-card__excerpt">{event.excerpt}</p>
                      <span className="evt-card__type">
                        {LOCATION_TYPE_LABEL[event.location_type] || event.location_type}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { Events };
export default Events;
