import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarIcon, TagIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { advisorContentService, AdvisorContent, AdvisorContentCategory, ContentFilters } from '../../lib/advisorContentService';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';

export default function AdvisorContentHub() {
  const { user: _user } = useAuth();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<AdvisorContent[]>([]);
  const [categories, setCategories] = useState<AdvisorContentCategory[]>([]);
  const [filters, setFilters] = useState<ContentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL query params
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const searchParam = searchParams.get('search');
    
    const initialFilters: ContentFilters = {};
    if (typeParam) {
      initialFilters.contentType = typeParam;
    }
    if (searchParam) {
      initialFilters.search = searchParam;
      setSearchQuery(searchParam);
    }
    
    if (typeParam || searchParam) {
      setFilters(initialFilters);
      setShowFilters(true); // Show filters panel if URL has params
    }
  }, [searchParams]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadContent();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await advisorContentService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await advisorContentService.getContent(filters);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery });
  };

  const handleCategoryFilter = (categorySlug: string) => {
    setFilters({
      ...filters,
      category: filters.category === categorySlug ? undefined : categorySlug
    });
  };

  const handleTypeFilter = (type: string) => {
    setFilters({
      ...filters,
      contentType: filters.contentType === type ? undefined : type
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Advisor Resources</h1>
          <p className="text-lg text-gray-600">
            Access bulletins, guidelines, forms, and training resources
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Search</Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        className={`cursor-pointer ${
                          filters.category === category.slug
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleCategoryFilter(category.slug)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Content Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {['bulletin', 'guideline', 'form', 'resource'].map((type) => (
                      <Badge
                        key={type}
                        className={`cursor-pointer ${
                          filters.contentType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleTypeFilter(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {(filters.category || filters.contentType || filters.search) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        ) : content.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No content found matching your filters.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <Link
                key={item.id}
                to={`/advisor/content/${item.slug}`}
                className="group"
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  {item.featured_image_url && (
                    <img
                      src={item.featured_image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <Badge className={getContentTypeBadgeColor(item.content_type)}>
                        {item.content_type}
                      </Badge>
                    </div>

                    {item.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {item.excerpt.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(item.published_date)}</span>
                      </div>
                      {item.category && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="h-4 w-4" />
                          <span>{item.category.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
