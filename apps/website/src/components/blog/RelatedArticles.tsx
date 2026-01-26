import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { BlogArticle } from '../../lib/supabase';

interface RelatedArticlesProps {
  articles: BlogArticle[];
  className?: string;
  maxArticles?: number;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  articles,
  className = '',
  maxArticles = 3,
}) => {
  if (!articles || articles.length === 0) return null;

  const displayArticles = articles.slice(0, maxArticles);

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Related Articles
        </h2>
        <Link
          to="/blog"
          className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 group"
        >
          View all
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
              {article.featured_image_url ? (
                <img
                  src={
                    article.featured_image_url.startsWith('http')
                      ? article.featured_image_url
                      : `/${article.featured_image_url.replace(/^\//, '')}`
                  }
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30">
                  <span className="text-4xl">📖</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full mb-2">
                {article.category}
              </div>
              
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                {article.excerpt}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={article.published_date}>
                  {new Date(article.published_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
