import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Megaphone,
  Pin,
  Filter,
} from 'lucide-react';
import { contentService, type Bulletin, type BulletinCategory } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Bulletins() {
  const { profile } = useAdvisor();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both bulletins and categories in parallel
        const [bulletinsData, categoriesData] = await Promise.all([
          contentService.getBulletins({}, profile?.id),
          contentService.getBulletinCategories(),
        ]);
        setBulletins(bulletinsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load bulletins:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  const markAsRead = async (bulletinId: string) => {
    if (!profile) return;

    try {
      await contentService.markBulletinRead(bulletinId, profile.id);
      setBulletins((prev) =>
        prev.map((b) =>
          b.id === bulletinId
            ? { ...b, is_read: true }
            : b
        )
      );
    } catch (err) {
      console.error('Failed to mark bulletin as read:', err);
    }
  };

  const getCategoryIcon = (categorySlug: string | undefined) => {
    switch (categorySlug) {
      case 'alert':
        return AlertTriangle;
      case 'announcement':
        return Megaphone;
      case 'news':
        return Info;
      default:
        return Bell;
    }
  };

  const getCategoryColor = (categorySlug: string | undefined) => {
    switch (categorySlug) {
      case 'alert':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'announcement':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'news':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'update':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-surface-tertiary text-th-text-secondary border-th-border';
    }
  };

  // Filter bulletins by selected category
  const filteredBulletins = bulletins.filter(
    (b) => !selectedCategoryId || b.category_id === selectedCategoryId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Bulletins</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Important announcements and updates
          </p>
        </div>
      </div>

      {/* Category filters - Dynamic from CMS */}
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-th-text-tertiary" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategoryId
                ? 'bg-th-accent-100 text-th-accent-700'
                : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-tertiary'
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
                  ? 'bg-th-accent-100 text-th-accent-700'
                  : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bulletins list */}
      <div className="space-y-4">
        {filteredBulletins.length > 0 ? (
          filteredBulletins.map((bulletin) => {
            const categorySlug = bulletin.category?.slug;
            const Icon = getCategoryIcon(categorySlug);
            const isRead = bulletin.is_read;
            const colorClass = getCategoryColor(categorySlug);

            return (
              <div
                key={bulletin.id}
                className={`bg-surface-primary rounded-xl border p-5 transition-all cursor-pointer ${
                  isRead ? 'border-th-border' : 'border-th-accent-300 shadow-md'
                }`}
                onClick={() => !isRead && markAsRead(bulletin.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-th-text-primary">
                        {bulletin.title}
                      </h3>
                      {!isRead && (
                        <span className="px-2 py-0.5 bg-th-accent-500 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    {bulletin.excerpt && (
                      <p className="text-th-text-secondary mt-1 text-sm">
                        {bulletin.excerpt}
                      </p>
                    )}
                    <div 
                      className="text-th-text-secondary mt-2 prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: bulletin.content }}
                    />
                    <div className="flex items-center space-x-4 mt-4 text-sm text-th-text-tertiary">
                      {bulletin.category && (
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${colorClass}`}>
                          {bulletin.category.name}
                        </span>
                      )}
                      <span>
                        {format(new Date(bulletin.published_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  {isRead && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No bulletins at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
