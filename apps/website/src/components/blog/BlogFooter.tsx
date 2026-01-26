import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BlogArticle, BlogAuthor } from '../../lib/supabase';
import { AuthorBox } from './AuthorBox';
import { ShareButtons } from './ShareButtons';
import { BlogCTA } from './BlogCTA';
import { RelatedArticles } from './RelatedArticles';
import { NewsletterSubscribe } from '../blocks/NewsletterSubscribe';

interface BlogFooterProps {
  article: BlogArticle;
  author?: BlogAuthor;
  relatedArticles?: BlogArticle[];
  showNewsletter?: boolean;
  showCTA?: boolean;
  ctaRoute?: string;
  ctaHeadline?: string;
  ctaButtonText?: string;
  complianceText?: string;
  className?: string;
}

export const BlogFooter: React.FC<BlogFooterProps> = ({
  article,
  author,
  relatedArticles = [],
  showNewsletter = true,
  showCTA = true,
  ctaRoute = '/plans',
  ctaHeadline,
  ctaButtonText,
  complianceText = 'MPB Health is committed to smart, member-driven care. Health sharing is not insurance and is not subject to insurance regulations.',
  className = '',
}) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Generate Article Schema for SEO
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
      {/* SEO Schema Markup */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <footer className={`blog-footer ${className}`}>
        {/* Divider */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </div>

        {/* Author Section */}
        <section className="bg-gray-50 dark:bg-gray-900 py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AuthorBox author={author} authorName={article.author} />
          </div>
        </section>

        {/* Share Section */}
        <section className="bg-white dark:bg-gray-800 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ShareButtons
              url={currentUrl}
              title={article.title}
            />
          </div>
        </section>

        {/* CTA Section */}
        {showCTA && (
          <section className="bg-gray-50 dark:bg-gray-900 py-12">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <BlogCTA
                headline={ctaHeadline}
                buttonText={ctaButtonText}
                buttonRoute={ctaRoute}
              />
            </div>
          </section>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="bg-white dark:bg-gray-800 py-12 border-t border-gray-200 dark:border-gray-700">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <RelatedArticles articles={relatedArticles} />
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        {showNewsletter && (
          <section className="bg-gray-50 dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-700">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <NewsletterSubscribe source="blog-footer" variant="default" />
            </div>
          </section>
        )}

        {/* Compliance / Trust Footer */}
        <section className="bg-white dark:bg-gray-800 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {complianceText}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              &copy; {new Date().getFullYear()} MPB Health. All rights reserved.{' '}
              <a
                href="/terms"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Terms of Service
              </a>{' '}
              &middot;{' '}
              <a
                href="/privacy"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </section>
      </footer>
    </>
  );
};

export default BlogFooter;
