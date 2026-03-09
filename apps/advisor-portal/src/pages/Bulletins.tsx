import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
  X,
  Eye,
  Sparkles,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { contentService, type Bulletin } from '@mpbhealth/advisor-core';
import { GradientHeader } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Bulletins() {
  const { profile, unreadBulletinCount } = useAdvisor();
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [featuredBulletins, setFeaturedBulletins] = useState<Bulletin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [bulletinsData, featuredData] = await Promise.all([
          contentService.getBulletins({}, profile?.id),
          contentService.getFeaturedBulletins(3),
        ]);
        setBulletins(bulletinsData);
        setFeaturedBulletins(featuredData);
      } catch (err) {
        console.error('Failed to load bulletins:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  useEffect(() => {
    if (featuredBulletins.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredBulletins.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredBulletins.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredBulletins.length);
  }, [featuredBulletins.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredBulletins.length) % featuredBulletins.length);
  }, [featuredBulletins.length]);

  const filteredBulletins = bulletins.filter((b) => {
    if (!searchQuery) return true;
    return (
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Bulletins & Announcements"
        subtitle="Stay informed with the latest updates, policy changes, and important announcements from MPB Health."
        icon={<Newspaper className="w-6 h-6" />}
        actions={
          unreadBulletinCount > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="relative">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-white">
                {unreadBulletinCount} unread
              </span>
            </div>
          ) : undefined
        }
      >
        <div className="mt-1 pt-5 border-t border-white/10 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.08] backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/[0.06]">
            <Newspaper className="w-3.5 h-3.5 text-[#A4CC43]" />
            <span><strong className="text-white">{bulletins.length}</strong> total bulletins</span>
          </div>
          {bulletins.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.08] backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/[0.06]">
              <CalendarDays className="w-3.5 h-3.5 text-[#A4CC43]" />
              <span>Latest: <strong className="text-white">{format(new Date(bulletins[0].published_date), 'MMM d, yyyy')}</strong></span>
            </div>
          )}
          {unreadBulletinCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 backdrop-blur-sm rounded-full text-xs text-amber-200 border border-amber-400/20">
              <Eye className="w-3.5 h-3.5" />
              <span><strong className="text-white">{unreadBulletinCount}</strong> to review</span>
            </div>
          )}
        </div>
      </GradientHeader>

      {/* Featured slider */}
      {featuredBulletins.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-th-border">
          <div className="relative h-[280px] md:h-[320px]">
            {featuredBulletins.map((bulletin, index) => (
              <div
                key={bulletin.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide
                    ? 'opacity-100 translate-x-0'
                    : index < currentSlide
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="flex h-full">
                  {bulletin.featured_image_url && (
                    <div className="hidden md:block w-2/5 relative">
                      <img
                        src={bulletin.featured_image_url}
                        alt={`Featured image for ${bulletin.title}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0E2D41]/90" />
                    </div>
                  )}
                  <div className={`flex flex-col justify-center p-8 md:p-10 bg-gradient-to-br from-[#0E2D41] to-[#0A4E8E] ${
                    bulletin.featured_image_url ? 'md:w-3/5' : 'w-full'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#A4CC43]/20 text-[#A4CC43]">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </span>
                      <span className="text-white/40 text-xs">
                        {format(new Date(bulletin.published_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 leading-snug">
                      {bulletin.title}
                    </h2>
                    {bulletin.excerpt && (
                      <p className="text-white/60 text-sm line-clamp-3 mb-5 max-w-xl leading-relaxed">
                        {bulletin.excerpt}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/bulletins/${bulletin.slug}`)}
                      className="group flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A4E8E] rounded-lg text-sm font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] transition-all w-fit"
                    >
                      Read Bulletin
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {featuredBulletins.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {featuredBulletins.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`rounded-full transition-all ${
                      index === currentSlide
                        ? 'w-8 h-2 bg-white'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bulletins by title or content..."
              className="w-full pl-9 pr-8 py-2.5 bg-surface-tertiary rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/30 text-sm transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-th-text-tertiary shrink-0">
            Showing {filteredBulletins.length} of {bulletins.length} bulletins
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Articles grid */}
      {filteredBulletins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBulletins.map((bulletin) => {
            const isUnread = !bulletin.is_read;

            return (
              <article
                key={bulletin.id}
                onClick={() => navigate(`/bulletins/${bulletin.slug}`)}
                className={`bg-surface-primary rounded-xl border overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  isUnread
                    ? 'border-[#0C71C3]/30 ring-1 ring-[#0C71C3]/10'
                    : 'border-th-border'
                }`}
              >
                {bulletin.featured_image_url ? (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={bulletin.featured_image_url}
                      alt={`Featured image for ${bulletin.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#0C71C3] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                        New
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white/90 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-44 bg-gradient-to-br from-[#0A4E8E]/5 to-[#0C71C3]/10 flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-[#0A4E8E]/20" />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#0C71C3] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#0A4E8E]/10 text-[#0A4E8E]">
                      Bulletin
                    </span>
                    {isUnread ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <Eye className="w-2.5 h-2.5" />
                        Unread
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-th-text-tertiary">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Read
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-th-text-primary leading-snug mb-2 line-clamp-2 group-hover:text-[#0C71C3] transition-colors">
                    {bulletin.title}
                  </h3>

                  {bulletin.excerpt && (
                    <p className="text-th-text-tertiary text-sm line-clamp-2 mb-4 leading-relaxed">
                      {bulletin.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-th-border-subtle">
                    {!bulletin.featured_image_url && (
                      <span className="text-xs text-th-text-tertiary flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    {bulletin.featured_image_url && (
                      <span className="text-xs text-th-text-tertiary">
                        {formatDistanceToNow(new Date(bulletin.published_date), { addSuffix: true })}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[#0A4E8E] flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
                      Read
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border p-16 text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-1">No bulletins found</h3>
          <p className="text-th-text-tertiary text-sm">
            {searchQuery ? 'Try adjusting your search' : 'No bulletins at this time. Check back soon!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-[#0A4E8E] hover:text-[#0C71C3] font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
