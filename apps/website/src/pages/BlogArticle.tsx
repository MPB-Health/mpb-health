import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured, BlogArticle as BlogArticleType, BlogAuthor } from '../lib/supabase';
import { NewsletterSubscribe } from '../components/blocks/NewsletterSubscribe';
import { AuroraBand, LandingPage, PageHero, Reveal, SectionHead, Sheet } from '../components/landing-redesign/page-kit';
import { sanitizeHtml } from '@mpbhealth/utils';

const NOT_INSURANCE =
  'MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines.';

const FALLBACK_COVER = '/assets/brand/mpb-tile.png';

/** CMS image paths may be absolute URLs or repo-relative paths. */
const imageSrc = (src?: string | null) =>
  src ? (src.startsWith('http') ? src : `/${src.replace(/^\//, '')}`) : '';

/** "Health Sharing" -> "Health sharing"; keeps acronyms such as "FAQ". */
const sentenceCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const acronym = w.length > 1 && w === w.toUpperCase();
      if (i === 0) return w.charAt(0).toUpperCase() + (acronym ? w.slice(1) : w.slice(1).toLowerCase());
      return acronym ? w : w.toLowerCase();
    })
    .join(' ');

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

/** Share pills: the same share targets the old icon row opened, as text buttons. */
function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const open = (href: string) => window.open(href, '_blank', 'width=600,height=400');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="lr-article__share" aria-label="Share this article">
      <button
        type="button"
        className="lr-btn lr-btn--ghost lr-btn--sm"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}
      >
        Share on LinkedIn
      </button>
      <button
        type="button"
        className="lr-btn lr-btn--ghost lr-btn--sm"
        onClick={() => open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)}
      >
        Share on X
      </button>
      <button
        type="button"
        className="lr-btn lr-btn--ghost lr-btn--sm"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
      >
        Share on Facebook
      </button>
      <button type="button" className="lr-btn lr-btn--ghost lr-btn--sm" onClick={copyLink}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}

export const BlogArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<BlogArticleType | null>(null);
  const [author, setAuthor] = useState<BlogAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticleType[]>([]);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_articles')
          .select('id, title, slug, excerpt, content, featured_image_url, category, author, author_id, tags, published_date, read_time, is_published, view_count')
          .eq('slug', slug)
          .eq('is_published', true)
          .neq('category', 'Event')
          .maybeSingle();

        // Handle missing table gracefully
        if (fetchError?.message?.includes('schema cache') || 
            fetchError?.code === 'PGRST204' ||
            fetchError?.code === 'PGRST205') {
          setError('Article not found');
          setArticle(null);
          return;
        }
        if (fetchError) throw fetchError;

        if (!data) {
          setError('Article not found');
          setArticle(null);
        } else {
          setArticle(data as BlogArticleType);

          // Fetch author details if author_id exists
          if (data.author_id) {
            const { data: authorData } = await supabase
              .from('blog_authors')
              .select('id, name, slug, avatar_url, bio, role, social_linkedin, social_twitter, social_website, is_active')
              .eq('id', data.author_id)
              .eq('is_active', true)
              .maybeSingle();
            
            if (authorData) {
              setAuthor(authorData as BlogAuthor);
            }
          }

          // Fetch related articles - by tags first, then by category
          let related: BlogArticleType[] = [];
          
          // Try to find articles with matching tags first
          if (data.tags && data.tags.length > 0) {
            const { data: tagRelated } = await supabase
              .from('blog_articles')
              .select('id, title, slug, excerpt, featured_image_url, category, published_date, read_time, tags')
              .eq('is_published', true)
              .neq('category', 'Event')
              .neq('id', data.id)
              .overlaps('tags', data.tags)
              .order('published_date', { ascending: false })
              .limit(3);
            
            if (tagRelated && tagRelated.length > 0) {
              related = tagRelated as BlogArticleType[];
            }
          }
          
          // If not enough tag-related articles, supplement with category matches
          if (related.length < 3) {
            const existingIds = related.map(r => r.id);
            const { data: categoryRelated } = await supabase
              .from('blog_articles')
              .select('id, title, slug, excerpt, featured_image_url, category, published_date, read_time, tags')
              .eq('is_published', true)
              .eq('category', data.category)
              .neq('category', 'Event')
              .neq('id', data.id)
              .not('id', 'in', `(${existingIds.join(',')})`.replace('()', '("")'))
              .order('published_date', { ascending: false })
              .limit(3 - related.length);

            if (categoryRelated) {
              related = [...related, ...(categoryRelated as BlogArticleType[])];
            }
          }

          setRelatedArticles(related);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  // Track article view count
  useEffect(() => {
    const trackView = async () => {
      // Only track once per page load and only for valid articles
      if (!article || viewTracked.current) return;
      
      viewTracked.current = true;
      
      try {
        // Increment view_count in blog_articles table
        const { error: updateError } = await supabase.rpc('increment_blog_view', {
          article_id: article.id
        });
        
        // If RPC doesn't exist, fallback to direct update
        if (updateError?.message?.includes('function') || updateError?.code === '42883') {
          await supabase
            .from('blog_articles')
            .update({ view_count: (article.view_count || 0) + 1 })
            .eq('id', article.id);
        }
      } catch (err) {
        // Silently fail view tracking - don't break the user experience
        console.debug('View tracking skipped:', err);
      }
    };

    trackView();
  }, [article]);

  if (loading) {
    return (
      <LandingPage className="lr-article">
        <PageHero ariaLabel="Loading article" align="center" kicker="Blog" title="Loading the article…" />
        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Article">
            <div className="lr-inner" />
          </section>
        </Sheet>
      </LandingPage>
    );
  }

  if (error || !article) {
    const failed = error === 'Failed to load article';
    return (
      <>
        <Helmet>
          <title>Article not found | MPB Health Blog</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LandingPage className="lr-article">
          <PageHero
            ariaLabel="Article not found"
            align="center"
            kicker="Blog"
            title={failed ? "We couldn't load that article." : "We couldn't find that article."}
            lede={
              failed
                ? 'Something went wrong on our side. Please try again in a moment, or browse the latest posts.'
                : 'It may have moved or been unpublished. The latest posts are one click away.'
            }
            actions={
              <Link className="lr-btn lr-btn--white" to="/blog">
                Browse the blog
              </Link>
            }
          />
          <Sheet>
            <section className="lr-sec lr-sec--top" aria-label="Where to next">
              <div className="lr-inner">
                <div className="lr-article__col" style={{ textAlign: 'center' }}>
                  <p className="lr-body">
                    Looking for something specific? <Link to="/faq">Our FAQ</Link> answers the questions
                    members ask most, and <Link to="/contact">our team</Link> is a call away.
                  </p>
                </div>
              </div>
            </section>
            <AuroraBand
              title="Ready to see what membership costs?"
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

  const cover = imageSrc(article.featured_image_url);
  const authorName = author?.name || article.author;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Article schema for SEO (previously emitted by BlogFooter)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featured_image_url,
    datePublished: article.published_date,
    dateModified: article.updated_at || article.published_date,
    author: author
      ? {
          '@type': 'Person',
          name: author.name,
          url: author.social_website || author.social_linkedin,
          jobTitle: author.role,
        }
      : {
          '@type': 'Organization',
          name: 'MPB Health',
          url: 'https://mpb.health',
        },
    publisher: {
      '@type': 'Organization',
      name: 'MPB Health',
      url: 'https://mpb.health',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mpb.health/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl,
    },
    articleSection: article.category,
    keywords: article.tags?.join(', '),
  };

  return (
    <>
      <Helmet>
        <title>{article.title} | MPB Health Blog</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.featured_image_url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.featured_image_url} />
        {article.tags && article.tags.length > 0 && (
          <meta name="keywords" content={article.tags.join(', ')} />
        )}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <LandingPage className="lr-article">
        <PageHero
          ariaLabel="Article"
          align={cover ? 'left' : 'center'}
          kicker={article.category ? sentenceCase(article.category) : undefined}
          title={article.title}
          by={
            <>
              By <strong>{authorName}</strong>, {longDate(article.published_date)}
            </>
          }
          lede={article.excerpt}
          media={cover ? { type: 'image', src: cover, alt: article.title } : undefined}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Article body">
            <div className="lr-inner">
              <div className="lr-article__col">
                <div
                  className="lr-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                />
                {article.tags && article.tags.length > 0 ? (
                  <p className="lr-note">Tagged {article.tags.join(', ')}.</p>
                ) : null}
                <ShareRow title={article.title} />
              </div>

              {authorName ? (
                <div className="lr-article__col">
                  <Reveal>
                    <div className="lr-panel lr-panel--soft">
                      <h2 className="lr-panel__title">About the author</h2>
                      <div className="lr-article__author">
                        {author?.avatar_url ? (
                          <img
                            className="lr-article__avatar"
                            src={author.avatar_url}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div>
                          <h3>{authorName}</h3>
                          {author?.role ? <p className="lr-note">{author.role}</p> : null}
                          {author?.bio ? (
                            <p className="lr-body" style={{ marginTop: '0.6rem' }}>
                              {author.bio}
                            </p>
                          ) : null}
                          {author && (author.social_linkedin || author.social_twitter || author.social_website) ? (
                            <div className="lr-article__links">
                              {author.social_linkedin ? (
                                <a
                                  className="lr-btn lr-btn--ghost lr-btn--sm"
                                  href={author.social_linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  LinkedIn
                                </a>
                              ) : null}
                              {author.social_twitter ? (
                                <a
                                  className="lr-btn lr-btn--ghost lr-btn--sm"
                                  href={author.social_twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  X
                                </a>
                              ) : null}
                              {author.social_website ? (
                                <a
                                  className="lr-btn lr-btn--ghost lr-btn--sm"
                                  href={author.social_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Website
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              ) : null}

              <div className="lr-article__col">
                <Reveal>
                  <div className="lr-panel lr-formwrap">
                    <h2 className="lr-panel__title">Get the next article by email</h2>
                    <p className="lr-body" style={{ marginBottom: '1.2rem' }}>
                      Healthcare savings, wellness tips, and membership news, a few times a month.
                      Unsubscribe any time.
                    </p>
                    <NewsletterSubscribe source="blog-footer" variant="inline" />
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {relatedArticles.length > 0 ? (
            <section className="lr-sec lr-sec--hair" aria-label="Related articles">
              <div className="lr-inner">
                <SectionHead title="Keep reading." align="left" />
                <div className="lr-tiles" style={{ '--cols': 3 } as React.CSSProperties}>
                  {relatedArticles.slice(0, 3).map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="lr-tile">
                      <img
                        src={imageSrc(post.featured_image_url) || FALLBACK_COVER}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_COVER;
                        }}
                      />
                      <div className="lr-tile__body">
                        <h3>{post.title}</h3>
                        {post.excerpt ? <p>{post.excerpt}</p> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <AuroraBand
            title="Ready to see what membership costs?"
            lede="Join a community that shares the care. Get a personalized quote in about two minutes, no obligation."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get your quote
                </Link>
                <Link className="lr-btn lr-btn--glass" to="/blog">
                  Browse the blog
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

export default BlogArticle;
