import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import { supabase, isSupabaseConfigured, BlogArticle as BlogArticleType, BlogAuthor } from '../lib/supabase';
import { BlogFooter } from '../components/blog';
import { sanitizeHtml } from '@mpbhealth/utils';

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
          .select('*')
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
          setArticle(data);

          // Fetch author details if author_id exists
          if (data.author_id) {
            const { data: authorData } = await supabase
              .from('blog_authors')
              .select('*')
              .eq('id', data.author_id)
              .eq('is_active', true)
              .maybeSingle();
            
            if (authorData) {
              setAuthor(authorData);
            }
          }

          // Fetch related articles - by tags first, then by category
          let related: BlogArticleType[] = [];
          
          // Try to find articles with matching tags first
          if (data.tags && data.tags.length > 0) {
            const { data: tagRelated } = await supabase
              .from('blog_articles')
              .select('*')
              .eq('is_published', true)
              .neq('category', 'Event')
              .neq('id', data.id)
              .overlaps('tags', data.tags)
              .order('published_date', { ascending: false })
              .limit(3);
            
            if (tagRelated && tagRelated.length > 0) {
              related = tagRelated;
            }
          }
          
          // If not enough tag-related articles, supplement with category matches
          if (related.length < 3) {
            const existingIds = related.map(r => r.id);
            const { data: categoryRelated } = await supabase
              .from('blog_articles')
              .select('*')
              .eq('is_published', true)
              .eq('category', data.category)
              .neq('category', 'Event')
              .neq('id', data.id)
              .not('id', 'in', `(${existingIds.join(',')})`.replace('()', '("")'))
              .order('published_date', { ascending: false })
              .limit(3 - related.length);

            if (categoryRelated) {
              related = [...related, ...categoryRelated];
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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            {error || 'Article Not Found'}
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

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
      </Helmet>

      <article className="bg-white">
        {/* Back Button */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <header className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {article.category}
            </span>
            {article.tags && article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-neutral-600 mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{author?.name || article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={article.published_date}>
                {new Date(article.published_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>

          <p className="text-xl text-neutral-600 leading-relaxed">
            {article.excerpt}
          </p>
        </header>

        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-12">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-neutral-100">
              <img
                src={article.featured_image_url.startsWith('http') ? article.featured_image_url : `/${article.featured_image_url.replace(/^\//, '')}`}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Article Content */}
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
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </div>

        {/* Blog Footer Component */}
        <BlogFooter
          article={article}
          author={author || undefined}
          relatedArticles={relatedArticles}
          showNewsletter={true}
          showCTA={true}
          ctaRoute="/plans"
        />
      </article>
    </>
  );
};

export default BlogArticle;
