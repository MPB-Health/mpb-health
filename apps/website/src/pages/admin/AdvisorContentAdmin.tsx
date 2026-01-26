import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { advisorContentService, AdvisorContent, AdvisorContentCategory } from '../../lib/advisorContentService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';

export default function AdvisorContentAdmin() {
  const [content, setContent] = useState<AdvisorContent[]>([]);
  const [_categories, setCategories] = useState<AdvisorContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contentData, categoriesData] = await Promise.all([
        advisorContentService.getContent(),
        advisorContentService.getCategories()
      ]);
      setContent(contentData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await advisorContentService.updateContent(id, {
        is_published: !currentStatus
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update publish status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await advisorContentService.deleteContent(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.content_type.toLowerCase().includes(filter.toLowerCase())
  );

  const getContentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bulletin': return 'bg-blue-100 text-blue-800';
      case 'guideline': return 'bg-green-100 text-green-800';
      case 'form': return 'bg-purple-100 text-purple-800';
      case 'resource': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminBreadcrumb currentPage="Advisor Content" />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Advisor Content Management</h1>
            <p className="text-gray-600">
              Manage bulletins, guidelines, forms, and resources for advisors
            </p>
          </div>
          <Button variant="primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Content
          </Button>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search content..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No content found
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getContentTypeBadgeColor(item.content_type)}>
                          {item.content_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(item.id, item.is_published)}
                          className="flex items-center gap-2"
                        >
                          {item.is_published ? (
                            <Badge className="bg-green-100 text-green-800">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <EyeOffIcon className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.view_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.published_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/advisor/content/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.title)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">{content.length}</div>
            <div className="text-sm text-gray-600">Total Content</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {content.filter(c => c.is_published).length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {content.filter(c => c.content_type === 'bulletin').length}
            </div>
            <div className="text-sm text-gray-600">Bulletins</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {content.reduce((sum, c) => sum + c.view_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
