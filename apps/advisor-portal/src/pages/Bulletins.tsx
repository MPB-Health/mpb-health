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
import { contentService, type Bulletin } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Bulletins() {
  const { profile } = useAdvisor();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBulletins = async () => {
      try {
        const data = await contentService.getBulletins({ includePast: false });
        setBulletins(data);
      } catch (err) {
        console.error('Failed to load bulletins:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBulletins();
  }, []);

  const markAsRead = async (bulletinId: string) => {
    if (!profile) return;

    try {
      await contentService.markBulletinRead(bulletinId, profile.id);
      setBulletins((prev) =>
        prev.map((b) =>
          b.id === bulletinId
            ? { ...b, read_by: [...(b.read_by || []), profile.id] }
            : b
        )
      );
    } catch (err) {
      console.error('Failed to mark bulletin as read:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  const getCategoryColor = (category: string, priority: string) => {
    if (priority === 'urgent') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    if (priority === 'high') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';

    switch (category) {
      case 'alert':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'announcement':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'news':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-surface-tertiary text-th-text-secondary border-th-border';
    }
  };

  const filteredBulletins = bulletins.filter(
    (b) => !selectedCategory || b.category === selectedCategory
  );

  const categories = ['announcement', 'update', 'alert', 'news'];

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

      {/* Category filters */}
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-th-text-tertiary" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-th-accent-100 text-th-accent-700'
                : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-th-accent-100 text-th-accent-700'
                  : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulletins list */}
      <div className="space-y-4">
        {filteredBulletins.length > 0 ? (
          filteredBulletins.map((bulletin) => {
            const Icon = getCategoryIcon(bulletin.category);
            const isRead = bulletin.read_by?.includes(profile?.id || '');
            const colorClass = getCategoryColor(bulletin.category, bulletin.priority);

            return (
              <div
                key={bulletin.id}
                className={`bg-surface-primary rounded-xl border p-5 transition-all ${
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
                      {bulletin.is_pinned && (
                        <Pin className="w-4 h-4 text-th-accent-500" />
                      )}
                      <h3 className="font-semibold text-th-text-primary">
                        {bulletin.title}
                      </h3>
                      {!isRead && (
                        <span className="px-2 py-0.5 bg-th-accent-500 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-th-text-secondary mt-2 whitespace-pre-wrap">
                      {bulletin.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-4 text-sm text-th-text-tertiary">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${colorClass}`}>
                        {bulletin.category}
                      </span>
                      <span>
                        {format(new Date(bulletin.published_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {bulletin.author_name && (
                        <span>By {bulletin.author_name}</span>
                      )}
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
