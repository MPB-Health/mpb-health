import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Users, Award, MapPin } from 'lucide-react';
import { supabase, isSupabaseConfigured, CmsEvent } from '../lib/supabase';

const LOCATION_TYPE_LABEL: Record<string, string> = {
  in_person: 'In Person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

const Events: React.FC = () => {
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, slug, excerpt, featured_image_url, event_date, location, location_type')
          .eq('is_published', true)
          .order('event_date', { ascending: false });

        if (error) throw error;
        if (data) setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <Helmet>
        <title>Events | MPB Health</title>
        <meta
          name="description"
          content="Explore MPB Health's events, conferences, and community gatherings. Join us as we celebrate excellence and build connections in healthcare."
        />
      </Helmet>

      <section
        className="relative pt-20 pb-16 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/delegates-networking.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/85" />
        <div className="absolute inset-0 bg-neutral-900/10" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
                MPB Health
              </span>{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
                Events & Celebrations
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join us as we celebrate excellence, build connections, and shape the future of community healthcare. Discover our latest events and company culture.
            </p>

            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-slide-up animate-delayed-2">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  Year-Round
                </div>
                <div className="text-sm text-neutral-600">Events</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  Community
                </div>
                <div className="text-sm text-neutral-600">Focused</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums mb-1">
                  Excellence
                </div>
                <div className="text-sm text-neutral-600">Celebrated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                Latest Events
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Explore our complete collection of events, celebrations, and community gatherings
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200 animate-pulse">
                    <div className="h-48 bg-neutral-200"></div>
                    <div className="p-5">
                      <div className="h-4 bg-neutral-200 rounded w-20 mb-3"></div>
                      <div className="h-6 bg-neutral-200 rounded mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-neutral-600">No events available yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-neutral-200"
                  >
                    <div className="relative h-48 overflow-hidden bg-neutral-100">
                      {event.featured_image_url ? (
                        <img
                          src={event.featured_image_url.startsWith('https') ? event.featured_image_url : `/${event.featured_image_url.replace(/^\//, '')}`}
                          alt={event.title}
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
                      <div className="flex items-center gap-3 text-sm text-neutral-500 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-neutral-600 text-sm line-clamp-2">
                        {event.excerpt}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600">
                          {LOCATION_TYPE_LABEL[event.location_type] || event.location_type}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export { Events };
export default Events;
