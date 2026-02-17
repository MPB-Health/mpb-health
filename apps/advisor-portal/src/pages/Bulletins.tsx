import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Bell,
  AlertTriangle,
  Info,
  Megaphone,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
} from 'lucide-react';
import { contentService, type Bulletin, type BulletinCategory } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Bulletins() {
  const { profile } = useAdvisor();
  const navigate = useNavigate();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [featuredBulletins, setFeaturedBulletins] = useState<Bulletin[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bulletinsData, featuredData, categoriesData] = await Promise.all([
          contentService.getBulletins({}, profile?.id),
          contentService.getFeaturedBulletins(5),
          contentService.getBulletinCategories(),
        ]);
        setBulletins(bulletinsData);
        setFeaturedBulletins(featuredData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load bulletins:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  // Auto-advance slider
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

  // Filter bulletins
  const filteredBulletins = bulletins.filter((b) => {
    const matchesCategory = !selectedCategoryId || b.category_id === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">Bulletin</h1>
        <p className="text-th-text-tertiary text-sm mt-1">
          Stay updated with the latest announcements and important information
        </p>
      </div>

      {/* Featured Slider */}
      {featuredBulletins.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-th-accent-600 to-th-accent-800 shadow-lg">
          {/* Slides */}
          <div className="relative h-[320px] md:h-[360px]">
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
                  {/* Image Section */}
                  {bulletin.featured_image_url && (
                    <div className="hidden md:block w-2/5 relative">
                      <img
                        src={bulletin.featured_image_url}
                        alt={`Featured image for ${bulletin.title}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-th-accent-700/80" />
                    </div>
                  )}
                  {/* Content Section */}
                  <div className={`flex flex-col justify-center p-8 md:p-12 ${bulletin.featured_image_url ? 'md:w-3/5' : 'w-full'}`}>
                    {bulletin.category && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white w-fit mb-4">
                        {(() => { const Icon = getCategoryIcon(bulletin.category.slug); return <Icon className="w-3 h-3" />; })()}
                        {bulletin.category.name}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2">
                      {bulletin.title}
                    </h2>
                    {bulletin.excerpt && (
                      <p className="text-white/80 text-sm md:text-base line-clamp-3 mb-4 max-w-xl">
                        {bulletin.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-auto">
                      <span className="text-white/60 text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {format(new Date(bulletin.published_date), 'MMMM d, yyyy')}
                      </span>
                      <button
                        onClick={() => navigate(`/bulletins/${bulletin.slug}`)}
                        className="flex items-center gap-1.5 text-white font-medium text-sm hover:gap-2.5 transition-all"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
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

              {/* Dots */}
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

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bulletins..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-th-text-tertiary" />
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategoryId
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-primary'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredBulletins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBulletins.map((bulletin) => {
            const categorySlug = bulletin.category?.slug;
            const colorClass = getCategoryColor(categorySlug);
            const isUnread = !bulletin.is_read;

            return (
              <article
                key={bulletin.id}
                onClick={() => navigate(`/bulletins/${bulletin.slug}`)}
                className={`bg-surface-primary rounded-xl border overflow-hidden cursor-pointer group transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  isUnread ? 'border-th-accent-300 dark:border-th-accent-700 ring-1 ring-th-accent-200 dark:ring-th-accent-800' : 'border-th-border'
                }`}
              >
                {/* Image */}
                {bulletin.featured_image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={bulletin.featured_image_url}
                      alt={`Featured image for ${bulletin.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-th-accent-500 text-white text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-th-accent-50 to-th-accent-100 dark:from-th-accent-900/20 dark:to-th-accent-800/20 flex items-center justify-center">
                    <Newspaper className="w-12 h-12 text-th-accent-300 dark:text-th-accent-700" />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-th-accent-500 text-white text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Category Badge */}
                  {bulletin.category && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${colorClass}`}>
                      {bulletin.category.name}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-th-text-primary text-lg leading-snug mb-2 line-clamp-2 group-hover:text-th-accent-600 transition-colors">
                    {bulletin.title}
                  </h3>

                  {/* Excerpt */}
                  {bulletin.excerpt && (
                    <p className="text-th-text-secondary text-sm line-clamp-3 mb-4">
                      {bulletin.excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-th-border">
                    <span className="text-xs text-th-text-tertiary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs font-medium text-th-accent-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More
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
          <p className="text-th-text-tertiary">
            {searchQuery || selectedCategoryId ? 'Try adjusting your search or filters' : 'No bulletins at this time. Check back soon!'}
          </p>
        </div>
      )}
    </div>
  );
}
