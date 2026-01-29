import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Newspaper,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Bell,
  Star,
  Eye,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
} from 'lucide-react';
import { advisorContentService, AdvisorContent } from '../../lib/advisorContentService';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';

export default function AdvisorBulletins() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bulletins, setBulletins] = useState<AdvisorContent[]>([]);
  const [featuredBulletin, setFeaturedBulletin] = useState<AdvisorContent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBulletins();
    loadBookmarks();
  }, []);

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const loadBulletins = async () => {
    try {
      setLoading(true);
      const data = await advisorContentService.getContent({ contentType: 'bulletin' });
      setBulletins(data);
      // Set the most recent as featured
      if (data.length > 0) {
        setFeaturedBulletin(data[0]);
      }
    } catch (error) {
      console.error('Error loading bulletins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const bookmarks = await advisorContentService.getBookmarks(user.id);
      setBookmarkedIds(new Set(bookmarks.map(b => b.id)));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const handleToggleBookmark = async (bulletinId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    try {
      const isNowBookmarked = await advisorContentService.toggleBookmark(bulletinId, user.id);
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (isNowBookmarked) {
          newSet.add(bulletinId);
        } else {
          newSet.delete(bulletinId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const filteredBulletins = bulletins.filter(bulletin =>
    bulletin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bulletin.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherBulletins = featuredBulletin
    ? filteredBulletins.filter(b => b.id !== featuredBulletin.id)
    : filteredBulletins;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bulletins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/advisor"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Newspaper className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advisor Bulletins</h1>
              <p className="text-gray-600">Stay updated with the latest news and announcements</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
              <Newspaper className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{bulletins.length} Bulletins</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
              <Bell className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {bulletins.filter(b => {
                  const diffDays = Math.floor((Date.now() - new Date(b.published_date).getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length} New this week
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
              <Bookmark className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">{bookmarkedIds.size} Bookmarked</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bulletins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 bg-white border-gray-200 shadow-sm"
            />
          </div>
        </div>

        {/* Featured Bulletin */}
        {featuredBulletin && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Latest Bulletin</h2>
            </div>
            <Link to={`/advisor/content/${featuredBulletin.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/50">
                <div className="flex flex-col md:flex-row">
                  {featuredBulletin.featured_image_url && (
                    <div className="md:w-1/3 h-48 md:h-auto">
                      <img
                        src={featuredBulletin.featured_image_url}
                        alt={featuredBulletin.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className={`p-8 flex-1 ${featuredBulletin.featured_image_url ? '' : 'w-full'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                            <Bell className="w-3 h-3 mr-1" />
                            New
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(featuredBulletin.published_date)}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                          {featuredBulletin.title}
                        </h3>
                        {featuredBulletin.excerpt && (
                          <p className="text-gray-600 text-lg leading-relaxed line-clamp-3">
                            {featuredBulletin.excerpt.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredBulletin.view_count} views
                          </span>
                          <button
                            onClick={(e) => handleToggleBookmark(featuredBulletin.id, e)}
                            className="text-sm text-gray-500 flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            {bookmarkedIds.has(featuredBulletin.id) ? (
                              <>
                                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-600">Saved</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Bulletins Grid */}
        {otherBulletins.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {searchQuery ? 'Search Results' : 'All Bulletins'}
              </h2>
              <span className="text-sm text-gray-500">{otherBulletins.length} bulletins</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherBulletins.map((bulletin) => (
                <Link
                  key={bulletin.id}
                  to={`/advisor/content/${bulletin.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 bg-white overflow-hidden">
                    {bulletin.featured_image_url && (
                      <div className="h-40 w-full overflow-hidden">
                        <img
                          src={bulletin.featured_image_url}
                          alt={bulletin.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge className="bg-blue-50 text-blue-700 text-xs">
                          Bulletin
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatRelativeDate(bulletin.published_date)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {bulletin.title}
                      </h3>
                      {bulletin.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {bulletin.excerpt.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {bulletin.view_count}
                        </span>
                        <button
                          onClick={(e) => handleToggleBookmark(bulletin.id, e)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {bookmarkedIds.has(bulletin.id) ? (
                            <BookmarkCheck className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Bookmark className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bulletins found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back later for new bulletins'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                Clear Search
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
