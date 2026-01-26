import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, BookmarkIcon, CalendarIcon, EyeIcon } from 'lucide-react';
import { advisorContentService, AdvisorContent } from '../../lib/advisorContentService';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function AdvisorContentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<AdvisorContent | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedContent, setRelatedContent] = useState<AdvisorContent[]>([]);

  useEffect(() => {
    if (slug) {
      loadContent();
    }
  }, [slug]);

  const loadContent = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const data = await advisorContentService.getContentBySlug(slug);

      if (!data) {
        navigate('/advisor/content');
        return;
      }

      setContent(data);

      if (user?.id) {
        await advisorContentService.incrementViewCount(data.id, user.id);
        const bookmarked = await advisorContentService.isBookmarked(data.id, user.id);
        setIsBookmarked(bookmarked);
      }

      if (data.category_id) {
        const related = await advisorContentService.getContent({
          category: data.category?.slug
        });
        setRelatedContent(related.filter(item => item.id !== data.id).slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!content || !user?.id) return;

    try {
      const newBookmarkState = await advisorContentService.toggleBookmark(content.id, user.id);
      setIsBookmarked(newBookmarkState);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bulletin': return 'bg-blue-100 text-blue-800';
      case 'guideline': return 'bg-green-100 text-green-800';
      case 'form': return 'bg-purple-100 text-purple-800';
      case 'resource': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <p className="text-gray-600 mb-4">Content not found.</p>
          <Link to="/advisor/content">
            <Button>Back to Resources</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/advisor/content"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Resources
          </Link>
        </div>

        <Card className="p-8 mb-8">
          {content.featured_image_url && (
            <img
              src={content.featured_image_url}
              alt={content.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getContentTypeBadgeColor(content.content_type)}>
                  {content.content_type}
                </Badge>
                {content.category && (
                  <Badge className="bg-gray-100 text-gray-700">
                    {content.category.name}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(content.published_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  <span>{content.view_count} views</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleToggleBookmark}
              className={isBookmarked ? 'bg-yellow-50 border-yellow-300' : ''}
            >
              <BookmarkIcon
                className={`h-5 w-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`}
              />
            </Button>
          </div>

          {content.excerpt && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-gray-700">{content.excerpt.replace(/<[^>]*>/g, '')}</p>
            </div>
          )}

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        </Card>

        {relatedContent.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Content</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedContent.map((item) => (
                <Link
                  key={item.id}
                  to={`/advisor/content/${item.slug}`}
                  className="group"
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <Badge className={getContentTypeBadgeColor(item.content_type) + ' mb-3'}>
                      {item.content_type}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.published_date)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
