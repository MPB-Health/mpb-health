import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  Eye,
  Tag,
  Bookmark,
  BookmarkCheck,
  Share2,
  Bell,
  AlertTriangle,
  Info,
  Megaphone,
} from 'lucide-react';
import { contentService, type Bulletin } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function BulletinDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const loadBulletin = async () => {
      if (!slug) return;
      try {
        const data = await contentService.getBulletinBySlug(slug);
        setBulletin(data);

        // Mark as read
        if (data && profile?.id) {
          await contentService.markBulletinRead(data.id, profile.id);
        }
      } catch (err) {
        console.error('Failed to load bulletin:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBulletin();
  }, [slug, profile?.id]);

  const handleBookmark = async () => {
    if (!bulletin || !profile?.id) return;
    try {
      const result = await contentService.toggleBulletinBookmark(bulletin.id, profile.id);
      setIsBookmarked(result);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleShare = async () => {
    if (!bulletin) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback
    }
  };

  const getCategoryIcon = (categorySlug: string | undefined) => {
    switch (categorySlug) {
      case 'alert': return AlertTriangle;
      case 'announcement': return Megaphone;
      case 'news': return Info;
      default: return Bell;
    }
  };

  const getCategoryColor = (categorySlug: string | undefined) => {
    switch (categorySlug) {
      case 'alert':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'announcement':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'news':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'update':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div className="text-center py-16">
        <Bell className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
        <h2 className="text-xl font-semibold text-th-text-primary mb-2">Bulletin not found</h2>
        <p className="text-th-text-tertiary mb-6">
          The bulletin you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/bulletins')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bulletins
        </button>
      </div>
    );
  }

  const categorySlug = bulletin.category?.slug;
  const CategoryIcon = getCategoryIcon(categorySlug);
  const colorClass = getCategoryColor(categorySlug);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/bulletins')}
        className="flex items-center gap-2 text-th-text-secondary hover:text-th-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Bulletins</span>
      </button>

      {/* Featured Image */}
      {bulletin.featured_image_url && (
        <div className="rounded-2xl overflow-hidden mb-8 max-h-[400px]">
          <img
            src={bulletin.featured_image_url}
            alt={bulletin.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Header */}
      <div className="mb-8">
        {/* Category Badge */}
        {bulletin.category && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${colorClass}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            {bulletin.category.name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-th-text-primary leading-tight mb-4">
          {bulletin.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-th-text-tertiary">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {format(new Date(bulletin.published_date), 'MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {bulletin.view_count} views
          </span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-th-border">
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isBookmarked
                ? 'bg-th-accent-100 text-th-accent-700 dark:bg-th-accent-900/30 dark:text-th-accent-400'
                : 'text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-th-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Excerpt */}
      {bulletin.excerpt && (
        <div className="bg-surface-secondary rounded-xl p-5 mb-8 border-l-4 border-th-accent-500">
          <p className="text-th-text-secondary italic leading-relaxed">
            {bulletin.excerpt}
          </p>
        </div>
      )}

      {/* Article Content */}
      <div
        className="prose prose-lg max-w-none dark:prose-invert
          prose-headings:text-th-text-primary prose-headings:font-bold
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-p:text-th-text-secondary prose-p:leading-relaxed
          prose-a:text-th-accent-600 prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-th-accent-300 prose-blockquote:text-th-text-secondary
          prose-strong:text-th-text-primary
          prose-ul:text-th-text-secondary prose-ol:text-th-text-secondary
          prose-li:text-th-text-secondary
          prose-img:rounded-xl prose-img:shadow-md
          prose-code:bg-surface-tertiary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-gray-900 prose-pre:rounded-xl
          mb-12"
        dangerouslySetInnerHTML={{ __html: bulletin.content }}
      />

      {/* Bottom Navigation */}
      <div className="border-t border-th-border pt-6 mb-4">
        <button
          onClick={() => navigate('/bulletins')}
          className="flex items-center gap-2 text-th-accent-600 hover:text-th-accent-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all bulletins
        </button>
      </div>
    </div>
  );
}
