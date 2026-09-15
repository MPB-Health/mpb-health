import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { ArrowRight, Phone, Search, ChevronDown } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { healthcareFeatures } from '../data/healthcareFeaturesData';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './features.css';

export const Features: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const categories = [
    { id: 'all', name: 'All Benefits' },
    { id: 'medical', name: 'Medical Care' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'support', name: 'Support' },
    { id: 'savings', name: 'Savings' },
  ];

  const getCategoryForFeature = (featureId: string): string => {
    const medicalFeatures = ['health-sharing', 'primary-care', 'urgent-care', 'maternity-care'];
    const wellnessFeatures = ['preventive-care', 'mental-health'];
    const supportFeatures = ['membership-concierge', 'pet-telehealth'];
    const savingsFeatures = ['rx-benefits', 'hsa-compatibility'];

    if (medicalFeatures.includes(featureId)) return 'medical';
    if (wellnessFeatures.includes(featureId)) return 'wellness';
    if (supportFeatures.includes(featureId)) return 'support';
    if (savingsFeatures.includes(featureId)) return 'savings';
    return 'all';
  };

  const filteredFeatures = healthcareFeatures.filter(
    (feature) => selectedCategory === 'all' || getCategoryForFeature(feature.id) === selectedCategory
  );

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Benefits';

  return (
    <>
      <MarketingHydrationSeo />

      <div className="lr hiw ftr">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="Membership features">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <h1 className="hiw-hero__title">Membership Features</h1>
              <p className="hiw-hero__sub">Everything your membership can include.</p>
              <p className="hiw-hero__lede">
                Discover the range of features available with MPB Health, from virtual care and
                prescription savings to global access and everyday support.
              </p>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/featureHero.jpg"
              alt="A smiling family enjoying time together outdoors"
              width={1920}
              height={1280}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Filter ───────────────────────────────────────────────── */}
        <section className="ftr-filter" aria-label="Filter benefits by category">
          <div className="ftr-filter__inner">
            <div className="ftr-filter__pills">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`ftr-pill${selectedCategory === category.id ? ' ftr-pill--active' : ''}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="ftr-filter__mobile">
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="ftr-filter__mobile-btn"
              >
                <span>Filter: {selectedCategoryName}</span>
                <ChevronDown className={showMobileFilter ? 'is-open' : ''} />
              </button>

              {showMobileFilter && (
                <div className="ftr-filter__mobile-menu">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowMobileFilter(false);
                      }}
                      className={`ftr-filter__mobile-item${
                        selectedCategory === category.id ? ' ftr-filter__mobile-item--active' : ''
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ftr-count">
              Showing <strong>{filteredFeatures.length}</strong> benefit
              {filteredFeatures.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` in ${selectedCategoryName}`}
            </div>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────────── */}
        <section id="features-grid" className="ftr-grid__section" aria-label="Membership benefits">
          {filteredFeatures.length === 0 ? (
            <div className="ftr-empty">
              <div className="ftr-empty__icon">
                <Search />
              </div>
              <h3 className="ftr-empty__title">No benefits found</h3>
              <p className="ftr-empty__text">Try adjusting your filter</p>
              <button onClick={() => setSelectedCategory('all')} className="ftr-empty__clear">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="ftr-grid">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.id} to={`/features/${feature.id}`} className="ftr-card">
                    <div className="ftr-card__media">
                      <img
                        src={feature.heroImage}
                        alt={feature.name}
                        width={400}
                        height={192}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="ftr-card__icon">
                        <Icon className={feature.color} />
                      </div>
                    </div>

                    <div className="ftr-card__body">
                      <h3 className="ftr-card__title">{feature.name}</h3>
                      <p className="ftr-card__tagline">{feature.tagline}</p>
                      <p className="ftr-card__text">{feature.shortDescription}</p>

                      <div className="ftr-card__plans">
                        {feature.eligiblePlans.slice(0, 3).map((plan, idx) => (
                          <span key={idx} className="ftr-card__plan">
                            {plan}
                          </span>
                        ))}
                        {feature.eligiblePlans.length > 3 && (
                          <span className="ftr-card__plan">
                            +{feature.eligiblePlans.length - 3}
                          </span>
                        )}
                      </div>

                      <span className="ftr-card__link">
                        Learn more <ArrowRight />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="ftr-cta" aria-label="Talk to a specialist">
          <div className="ftr-cta__card">
            <p className="ftr-cta__label">Expert Support</p>
            <h2 className="ftr-cta__title">Need help choosing the right membership?</h2>
            <p className="ftr-cta__text">
              Our specialists can help you explore your options and find the membership that fits
              your healthcare needs.
            </p>
            <div className="ftr-cta__actions">
              <Link to="/contact" className="ftr-cta__btn ftr-cta__btn--primary">
                Schedule a Call
                <ArrowRight />
              </Link>
              <a href="tel:8558164650" className="ftr-cta__btn ftr-cta__btn--ghost">
                <Phone />
                (855) 816-4650
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export default Features;
