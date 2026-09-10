import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import { HealthcarePlanCategoryWithDetails } from '../lib/supabase';
import { getPlanCategoryBySlug } from '../lib/planCategoryService';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const NOT_INSURANCE =
  'MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines.';

const PlanCategoryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<HealthcarePlanCategoryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) {
        setError('No category specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPlanCategoryBySlug(slug);

        if (!data) {
          setError('Category not found');
        } else {
          setCategory(data);
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setError('Failed to load category details');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  const handleGetQuote = () => {
    const element = document.getElementById('calculator');
    if (element) {
      navigate('/', { replace: false });
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <LandingPage className="pcd">
        <PageHero
          ariaLabel="Loading membership"
          align="center"
          title="One moment."
          lede="Loading membership details."
        />
      </LandingPage>
    );
  }

  if (error || !category) {
    return (
      <>
        <Helmet>
          <title>Membership not found | MPB Health</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LandingPage className="pcd">
          <PageHero
            ariaLabel="Membership not found"
            align="center"
            title="We couldn't find that membership."
            lede={error || 'The membership you are looking for does not exist.'}
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/plans">
                  See all memberships
                </Link>
                <Link className="lr-btn lr-btn--glass" to="/">
                  Back to home
                </Link>
              </>
            }
          />
        </LandingPage>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.title} | MPB Health</title>
        <meta name="description" content={category.description} />
        <meta property="og:title" content={`${category.title} | MPB Health`} />
        <meta property="og:description" content={category.description} />
        <meta property="og:image" content={category.image_url} />
        <meta property="og:type" content="website" />
      </Helmet>

      <LandingPage className="pcd">
        <PageHero
          ariaLabel={category.title}
          align="center"
          kicker={category.recommendations || undefined}
          title={category.title}
          lede={category.description}
          micro={category.subtitle || undefined}
          actions={
            <>
              <button type="button" className="lr-btn lr-btn--white" onClick={handleGetQuote}>
                Get your quote
              </button>
              <Link className="lr-btn lr-btn--glass" to="/contact">
                Talk to an advisor
              </Link>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Who this membership is for">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src={category.image_url}
                      alt={category.image_alt}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">Who this membership is for.</h2>
                  {category.best_for && <p className="lr-body">{category.best_for}</p>}
                  {category.profiles.length > 0 && (
                    <ul className="lr-checks">
                      {category.profiles.map((profile) => (
                        <li key={profile.id}>
                          <Check strokeWidth={3} />
                          <span>{profile.profile_text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              </div>
            </div>
          </section>

          {category.included_features.length > 0 && (
            <section className="lr-sec lr-sec--soft" aria-label="What you get">
              <div className="lr-inner">
                <SectionHead title="What you get." align="left" />
                <ul className="lr-ledger lr-ledger--tight">
                  {category.included_features.map((feature) => (
                    <li key={feature.id}>
                      <p>{feature.feature_text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {category.excluded_features.length > 0 && (
            <section className="lr-sec lr-sec--hair" aria-label="Things to keep in mind">
              <div className="lr-inner">
                <SectionHead
                  title="Things to keep in mind."
                  lede="Read these before you enroll,"
                  ledeMuted="so there are no surprises later."
                  align="left"
                />
                <ul className="lr-ledger lr-ledger--1">
                  {category.excluded_features.map((feature) => (
                    <li key={feature.id}>
                      <p>{feature.feature_text}</p>
                    </li>
                  ))}
                </ul>
                <p style={{ margin: '2rem 0 0' }}>
                  <Link className="lr-btn lr-btn--ghost lr-btn--sm" to="/individuals-and-families">
                    Compare all memberships
                  </Link>
                </p>
              </div>
            </section>
          )}

          <AuroraBand
            title="Ready to get started?"
            lede="Our healthcare advisors are here to help you choose the membership that fits. Your quote takes under two minutes and needs no credit card."
            actions={
              <>
                <button type="button" className="lr-btn lr-btn--white" onClick={handleGetQuote}>
                  Get your personalized quote
                </button>
                <Link className="lr-btn lr-btn--glass" to="/contact">
                  Speak with an advisor
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

export default PlanCategoryDetail;
