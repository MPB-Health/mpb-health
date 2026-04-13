import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button } from '@mpbhealth/ui';
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
} from 'lucide-react';
import { contentService, type Bulletin } from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useAdvisor } from '../contexts/AdvisorContext';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function BulletinDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; title: string; fileUrl: string }>({
    isOpen: false,
    title: '',
    fileUrl: '',
  });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const loadBulletin = async () => {
      try {
        const data = await contentService.getBulletinBySlug(slug);
        if (cancelled) return;
        setBulletin(data);

        if (data && profile?.id) {
          await contentService.markBulletinRead(data.id, profile.id);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load bulletin:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 15_000);
    loadBulletin();

    return () => { cancelled = true; clearTimeout(timeout); };
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

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    const lowerHref = href.toLowerCase();

    // Open all document links (PDFs, images, etc.) in a popup modal
    const isDocument = lowerHref.endsWith('.pdf') ||
      lowerHref.endsWith('.png') ||
      lowerHref.endsWith('.jpg') ||
      lowerHref.endsWith('.jpeg') ||
      lowerHref.endsWith('.gif') ||
      lowerHref.endsWith('.webp') ||
      lowerHref.endsWith('.pptx') ||
      lowerHref.endsWith('.docx') ||
      lowerHref.endsWith('.xlsx');

    if (isDocument) {
      e.preventDefault();
      const linkText = anchor.textContent?.trim() || 'Document';
      setPdfModal({ isOpen: true, title: linkText, fileUrl: href });
    }
  }, []);


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
          The bulletin you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/bulletins')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bulletins
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: 'Bulletins', href: '/bulletins' },
          { label: bulletin.title },
        ]}
      />

      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => navigate('/bulletins')}
        className="mb-6 text-th-text-secondary hover:text-th-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Bulletins</span>
      </Button>

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
        {/* Bulletin Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-th-accent-100 dark:bg-th-accent-900/30 text-th-accent-700 dark:text-th-accent-400">
          <Bell className="w-3.5 h-3.5" />
          Bulletin
        </span>

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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={isBookmarked ? 'bg-th-accent-100 text-th-accent-700 dark:bg-th-accent-900/30 dark:text-th-accent-400' : 'text-th-text-secondary'}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-th-text-secondary"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
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
        ref={contentRef}
        className="bulletin-content prose prose-lg max-w-none mb-12 dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-ul:my-4 prose-li:text-base prose-li:leading-relaxed prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-hr:my-8"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(bulletin.content) }}
      />

      {/* Bottom Navigation */}
      <div className="border-t border-th-border pt-6 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/bulletins')}
          className="text-th-accent-600 hover:text-th-accent-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all bulletins
        </Button>
      </div>

      {/* PDF Preview Modal */}
      <DocumentPreviewModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ isOpen: false, title: '', fileUrl: '' })}
        title={pdfModal.title}
        fileUrl={pdfModal.fileUrl}
      />
    </div>
  );
}
