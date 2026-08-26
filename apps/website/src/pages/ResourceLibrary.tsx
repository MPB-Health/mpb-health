import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { useResources } from '../hooks/useResources';
import { ResourceFilters as IResourceFilters } from '../lib/supabase';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { ResourceCard } from '../components/resources/ResourceCard';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './resource-library.css';

export const ResourceLibrary: React.FC = () => {
  const [filters, setFilters] = useState<IResourceFilters>({
    search: '',
    types: [],
    audiences: [],
    topics: [],
    sortBy: 'newest',
  });

  const { resources, topics, loading, error, totalCount } = useResources(filters);

  const featuredResources = resources.filter((r) => r.is_featured).slice(0, 3);
  const regularResources = resources.filter((r) => !r.is_featured);

  const scrollToGrid = () => {
    const element = document.getElementById('features-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Resource Library | MPB Health</title>
        <meta
          name="description"
          content="Access guides, webinars, compliance documents, and educational resources to support your health sharing journey with MPB Health."
        />
      </Helmet>

      <div className="lr hiw rl">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="Resource library">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="rl-label">Resource Library</p>
              <h1 className="hiw-hero__title">Your Complete Resource Hub</h1>
              <p className="hiw-hero__lede">
                Access guides, forms, and educational materials to support your health sharing
                journey.
              </p>
              <div className="rl-hero__actions">
                <button type="button" className="rl-btn rl-btn--primary" onClick={scrollToGrid}>
                  Browse Resources
                  <ArrowRight />
                </button>
                <button
                  type="button"
                  className="rl-btn rl-btn--ghost"
                  onClick={() => {
                    setFilters({ ...filters, types: ['Form'] });
                    setTimeout(scrollToGrid, 100);
                  }}
                >
                  <FileText />
                  View Forms
                </button>
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/healthcare-images-for-healthcare-blog-website2-980x653.png"
              alt="Palm trees in front of the Miami skyline at sunset"
              width={980}
              height={653}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Featured resources ───────────────────────────────────── */}
        {featuredResources.length > 0 && (
          <section className="hiw-section" aria-label="Featured resources">
            <div className="hiw-inner">
              <div className="hiw-section__header">
                <p className="rl-label">Featured Resources</p>
                <h2 className="hiw-title">Most Popular Resources</h2>
                <p className="hiw-body">
                  Our most popular and recently updated guides and materials
                </p>
              </div>

              <div className="rl-grid">
                {featuredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Browse all ───────────────────────────────────────────── */}
        <section id="features-grid" className="hiw-section" aria-label="Complete resource collection">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="rl-label">Browse All</p>
              <h2 className="hiw-title">Complete Resource Collection</h2>
              <p className="hiw-body">
                Filter by type, audience, or topic to find exactly what you need
              </p>
            </div>

            <div className="rl-filters">
              <ResourceFilters
                filters={filters}
                topics={topics}
                onFiltersChange={setFilters}
                totalCount={totalCount}
              />
            </div>

            {loading ? (
              <div className="rl-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rl-skeleton">
                    <div className="rl-skeleton__img" />
                    <div className="rl-skeleton__body">
                      <div className="rl-skeleton__bar" style={{ height: '0.8rem', width: '30%', marginBottom: '0.9rem' }} />
                      <div className="rl-skeleton__bar" style={{ height: '1.1rem', width: '90%', marginBottom: '0.7rem' }} />
                      <div className="rl-skeleton__bar" style={{ height: '0.8rem', width: '100%', marginBottom: '0.5rem' }} />
                      <div className="rl-skeleton__bar" style={{ height: '0.8rem', width: '70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rl-state">
                <div className="rl-state__icon">
                  <BookOpen aria-hidden="true" />
                </div>
                <h3 className="rl-state__title">Error Loading Resources</h3>
                <p className="rl-state__text">{error}</p>
                <button
                  type="button"
                  className="rl-btn rl-btn--primary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : regularResources.length === 0 ? (
              <div className="rl-state">
                <div className="rl-state__icon">
                  <BookOpen aria-hidden="true" />
                </div>
                <h3 className="rl-state__title">No resources found</h3>
                <p className="rl-state__text">Try adjusting your filters or search terms</p>
                <button
                  type="button"
                  className="rl-btn rl-btn--primary"
                  onClick={() =>
                    setFilters({
                      search: '',
                      types: [],
                      audiences: [],
                      topics: [],
                      sortBy: 'newest',
                    })
                  }
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="rl-grid">
                {regularResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="rl-cta" aria-label="Contact our team">
          <div className="rl-cta__card">
            <p className="rl-label">Need Help?</p>
            <h2 className="rl-cta__title">Can't Find What You're Looking For?</h2>
            <p className="rl-cta__text">
              Our team is here to assist you with any questions about our resources or health
              sharing programs.
            </p>
            <div className="rl-cta__actions">
              <Link to="/contact" className="rl-btn rl-btn--primary">
                Contact Our Team
                <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export default ResourceLibrary;
