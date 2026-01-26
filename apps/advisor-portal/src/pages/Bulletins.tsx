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
    if (priority === 'urgent') return 'bg-red-100 text-red-700 border-red-200';
    if (priority === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';

    switch (category) {
      case 'alert':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'announcement':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'news':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const filteredBulletins = bulletins.filter(
    (b) => !selectedCategory || b.category === selectedCategory
  );

  const categories = ['announcement', 'update', 'alert', 'news'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bulletins</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Important announcements and updates
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-neutral-400" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                className={`bg-white rounded-xl border p-5 transition-all ${
                  isRead ? 'border-neutral-200' : 'border-primary-300 shadow-md'
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
                        <Pin className="w-4 h-4 text-primary-500" />
                      )}
                      <h3 className="font-semibold text-neutral-900">
                        {bulletin.title}
                      </h3>
                      {!isRead && (
                        <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600 mt-2 whitespace-pre-wrap">
                      {bulletin.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-4 text-sm text-neutral-500">
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
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p className="text-neutral-500">No bulletins at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
