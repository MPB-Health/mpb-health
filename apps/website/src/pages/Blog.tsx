import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, TrendingUp, Heart, Calendar, Clock, ArrowRight } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { supabase, BlogArticle } from '../lib/supabase';
import { useCmsLive } from '../hooks/useCmsLive';
import { NewsletterSubscribe } from '../components/blocks/NewsletterSubscribe';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './blog.css';

const Blog: React.FC = () => {
  // Live data: Realtime + focus refetch so newly published posts appear
  // without a manual refresh.
  const { data: blogPosts, loading } = useCmsLive<BlogArticle>({
    table: 'blog_articles',
    realtimeFilter: 'is_published=eq.true',
    buildQuery: async () => {
      const result = await supabase
        .from('blog_articles')
        .select('id, title, slug, excerpt, featured_image_url, category, published_date, read_time')
        .eq('is_published', true)
        .neq('category', 'Event')
        .order('published_date', { ascending: false });

      // Treat "table not in schema cache" as empty list rather than an error
      // so the page renders gracefully before migrations run.
      if (
        result.error?.message?.includes('schema cache') ||
        result.error?.code === 'PGRST204' ||
        result.error?.code === 'PGRST205'
      ) {
        return { data: [], error: null };
      }
      return result;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>Healthcare Blog | MPB Health</title>
        <meta
          name="description"
          content="Stay informed with MPB Health's blog. Expert insights on healthcare, wellness, medical cost sharing, and affordable healthcare solutions."
        />
      </Helmet>

      <div className="lr hiw blg">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="Healthcare blog">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="blg-label">Healthcare Blog</p>
              <h1 className="hiw-hero__title">Healthcare Insights &amp; Wellness Tips</h1>
              <p className="hiw-hero__lede">
                Expert insights on healthcare, wellness, and living your healthiest life.
              </p>
              <div className="blg-hero__stats">
                <span className="blg-stat">
                  <BookOpen aria-hidden="true" />
                  {blogPosts.length}+ Articles
                </span>
                <span className="blg-stat">
                  <TrendingUp aria-hidden="true" />
                  Weekly Updates
                </span>
                <span className="blg-stat">
                  <Heart aria-hidden="true" />
                  Expert Advice
                </span>
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/newsletter-blog-images-2.jpg"
              alt="A group of hands holding a red heart together"
              width={500}
              height={378}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Latest articles ──────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Latest articles">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="blg-label">Latest Articles</p>
              <h2 className="hiw-title">Healthcare Insights &amp; Updates</h2>
              <p className="hiw-body">
                Explore our complete collection of healthcare insights and wellness tips
              </p>
            </div>

            {loading ? (
              <div className="blg-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="blg-skeleton">
                    <div className="blg-skeleton__img" />
                    <div className="blg-skeleton__body">
                      <div className="blg-skeleton__bar" style={{ height: '0.8rem', width: '30%', marginBottom: '0.9rem' }} />
                      <div className="blg-skeleton__bar" style={{ height: '1.1rem', width: '90%', marginBottom: '0.7rem' }} />
                      <div className="blg-skeleton__bar" style={{ height: '0.8rem', width: '100%', marginBottom: '0.5rem' }} />
                      <div className="blg-skeleton__bar" style={{ height: '0.8rem', width: '70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="blg-state">
                <div className="blg-state__icon">
                  <BookOpen aria-hidden="true" />
                </div>
                <h3 className="blg-state__title">No articles available yet</h3>
                <p className="blg-state__text">Check back soon for new content!</p>
              </div>
            ) : (
              <div className="blg-grid">
                {blogPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="blg-card">
                    <div className="blg-card__media">
                      <img
                        src={post.featured_image_url.startsWith('http') ? post.featured_image_url : `/${post.featured_image_url.replace(/^\//, '')}`}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="blg-card__category">{post.category}</span>
                    </div>
                    <div className="blg-card__body">
                      <div className="blg-card__meta">
                        <span className="blg-card__meta-item">
                          <Calendar aria-hidden="true" />
                          {formatDate(post.published_date)}
                        </span>
                        {post.read_time && (
                          <span className="blg-card__meta-item">
                            <Clock aria-hidden="true" />
                            {post.read_time} min
                          </span>
                        )}
                      </div>
                      <h3 className="blg-card__title">{post.title}</h3>
                      <p className="blg-card__excerpt">{post.excerpt}</p>
                      <span className="blg-card__link">
                        Read Article <ArrowRight />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Newsletter ───────────────────────────────────────────── */}
        <section className="blg-newsletter" aria-label="Subscribe to the newsletter">
          <div className="blg-newsletter__inner">
            <NewsletterSubscribe source="blog" variant="default" />
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { Blog };
export default Blog;
