import { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  BookOpen,
  Tag,
} from 'lucide-react';
import { advisorAuthService, SOPDocument } from '../../lib/advisorAuthService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export default function SOPLibrary() {
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [filteredSops, setFilteredSops] = useState<SOPDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedSop, setSelectedSop] = useState<SOPDocument | null>(null);

  useEffect(() => {
    loadSOPs();
  }, []);

  useEffect(() => {
    filterSOPs();
  }, [sops, selectedCategory, searchTerm]);

  const loadSOPs = async () => {
    try {
      setLoading(true);
      const data = await advisorAuthService.getSOPDocuments();
      setSops(data);
    } catch (error) {
      console.error('Error loading SOPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSOPs = () => {
    let filtered = sops;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.title.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term) ||
          s.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredSops(filtered);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await advisorAuthService.searchSOPs(searchTerm);
      setFilteredSops(results);
    } else {
      filterSOPs();
    }
  };

  const categories = Array.from(new Set(sops.map(s => s.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SOP library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOP Library</h1>
          <p className="text-gray-600">
            Access standard operating procedures and guidelines
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search SOPs by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </Card>

        {filteredSops.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No SOPs found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {filteredSops.map(sop => (
                  <Card
                    key={sop.id}
                    className={`p-6 cursor-pointer hover:shadow-lg transition-all ${
                      selectedSop?.id === sop.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSop(sop)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {sop.title}
                          </h3>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            v{sop.version}
                          </Badge>
                        </div>
                        {sop.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {sop.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {sop.category.replace(/_/g, ' ')}
                          </Badge>
                          {sop.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {sop.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sop.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Updated {new Date(sop.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {selectedSop ? (
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Quick View</h3>
                        <p className="text-sm text-gray-600">Version {selectedSop.version}</p>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{selectedSop.title}</h4>

                    {selectedSop.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedSop.description}</p>
                    )}

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Category</h5>
                      <Badge variant="outline">
                        {selectedSop.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    {selectedSop.tags.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedSop.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      {selectedSop.file_url && (
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => window.open(selectedSop.file_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Document
                        </Button>
                      )}
                      {selectedSop.file_url && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedSop.file_url!;
                            link.download = `${selectedSop.title}.pdf`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                    </div>

                    {selectedSop.content && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Preview</h5>
                        <div className="text-sm text-gray-600 max-h-64 overflow-y-auto prose prose-sm">
                          {selectedSop.content.substring(0, 500)}
                          {selectedSop.content.length > 500 && '...'}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Select an SOP</h3>
                    <p className="text-sm text-gray-600">
                      Click on any SOP to view details and access the document
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
