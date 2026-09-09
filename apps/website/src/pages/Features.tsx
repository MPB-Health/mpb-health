import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { ArrowRight, Search } from 'lucide-react';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  Sheet,
} from '../components/landing-redesign/page-kit';
import { healthcareFeatures } from '../data/healthcareFeaturesData';
import './how-it-works.css';
import './features.css';

const CATEGORIES = [
  { id: 'all', name: 'All benefits' },
  { id: 'medical', name: 'Medical care' },
  { id: 'wellness', name: 'Wellness' },
  { id: 'support', name: 'Support' },
  { id: 'savings', name: 'Savings' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const CATEGORY_BY_FEATURE: Record<string, CategoryId> = {
  'health-sharing': 'medical',
  'primary-care': 'medical',
  'urgent-care': 'medical',
  'maternity-care': 'medical',
  'preventive-care': 'wellness',
  'mental-health': 'wellness',
  'membership-concierge': 'support',
  'pet-telehealth': 'support',
  'rx-benefits': 'savings',
  'hsa-compatibility': 'savings',
};

export const Features: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const filteredFeatures = healthcareFeatures.filter(
    (feature) => selectedCategory === 'all' || (CATEGORY_BY_FEATURE[feature.id] ?? 'all') === selectedCategory
  );

  const selectedCategoryName =
    CATEGORIES.find((c) => c.id === selectedCategory)?.name ?? 'All benefits';

  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage className="hiw ftr">
        <PageHero
          ariaLabel="Membership features"
          kicker="Membership features"
          title="Everything your membership can include."
          lede={
            <>
              From <strong>virtual care and prescription savings</strong> to global access and everyday
              support, discover the range of features available with MPB Health.
            </>
          }
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                Get your quote
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/compare-plans">
                Compare memberships
              </Link>
            </>
          }
          rail={[
            { value: '$0', label: 'Virtual care, included' },
            { value: '12,000+', label: 'Families served' },
            { value: '4.9/5', label: 'Google rating' },
          ]}
          media={{
            type: 'image',
            src: '/assets/featureHero.jpg',
            alt: 'A smiling family enjoying time together outdoors',
            width: 1920,
            height: 1280,
          }}
        />

        <Sheet>
          {/* ── Filter + grid ────────────────────────────────────────── */}
          <section className="lr-sec lr-sec--top" aria-label="Membership benefits" id="features-grid">
            <div className="lr-inner">
              <Reveal>
                <div className="lr-chips" role="group" aria-label="Filter benefits by category">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      aria-pressed={selectedCategory === category.id}
                      className={`lr-chip${selectedCategory === category.id ? ' is-active' : ''}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <p className="ftr-count" aria-live="polite">
                  Showing <strong>{filteredFeatures.length}</strong> benefit
                  {filteredFeatures.length !== 1 ? 's' : ''}
                  {selectedCategory !== 'all' && ` in ${selectedCategoryName.toLowerCase()}`}
                </p>
              </Reveal>

              {filteredFeatures.length === 0 ? (
                <div className="ftr-empty">
                  <span className="lr-cell__tile">
                    <Search strokeWidth={1.8} />
                  </span>
                  <h2 className="lr-h3">No benefits found</h2>
                  <p className="lr-body">Try adjusting your filter.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="lr-btn lr-btn--navy lr-btn--sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="ftr-grid">
                  {filteredFeatures.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <Reveal key={feature.id} delay={(i % 3) * 0.06}>
                        <Link to={`/features/${feature.id}`} className="ftr-card">
                          <div className="ftr-card__media">
                            <img
                              src={feature.heroImage}
                              alt=""
                              width={400}
                              height={192}
                              loading="lazy"
                              decoding="async"
                            />
                            <span className="ftr-card__icon">
                              <Icon strokeWidth={1.8} />
                            </span>
                          </div>

                          <div className="ftr-card__body">
                            <p className="ftr-card__tagline">{feature.tagline}</p>
                            <h2 className="ftr-card__title">{feature.name}</h2>
                            <p className="ftr-card__text">{feature.shortDescription}</p>

                            <div className="ftr-card__plans">
                              {feature.eligiblePlans.slice(0, 3).map((plan) => (
                                <span key={plan} className="ftr-card__plan">
                                  {plan}
                                </span>
                              ))}
                              {feature.eligiblePlans.length > 3 && (
                                <span className="ftr-card__plan">+{feature.eligiblePlans.length - 3}</span>
                              )}
                            </div>

                            <span className="lr-more">
                              Learn more <ArrowRight />
                            </span>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto', marginTop: '2.5rem' }}>
                Features vary by membership. MPB Health memberships are not insurance and are subject to
                eligibility requirements and member guidelines.
              </p>
            </div>
          </section>

          {/* ── Closing ──────────────────────────────────────────────── */}
          <AuroraBand
            ariaLabel="Talk to a specialist"
            title="Need help choosing the right membership?"
            lede="Our specialists can help you explore your options and find the membership that fits your healthcare needs."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/contact">
                  Schedule a call
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default Features;
