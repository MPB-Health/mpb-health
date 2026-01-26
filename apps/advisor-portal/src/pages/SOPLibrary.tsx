import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Eye,
  Calendar,
  Tag,
  TrendingUp,
} from 'lucide-react';
import {
  contentService,
  type SOPDocument,
  type SOPCategory,
} from '@mpbhealth/advisor-core';

export default function SOPLibrary() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [popularDocs, setPopularDocs] = useState<SOPDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docs, cats, popular] = await Promise.all([
          contentService.getSOPDocuments(),
          contentService.getSOPCategories(),
          contentService.getPopularSOPs(5),
        ]);
        setDocuments(docs);
        setCategories(cats);
        setPopularDocs(popular);
      } catch (err) {
        console.error('Failed to load SOPs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">SOPs & Playbooks</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Standard operating procedures and reference documents
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/sops/${doc.id}`)}
                className="w-full bg-white rounded-xl border border-neutral-200 p-5 text-left hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-2 mt-3">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                          {doc.category}
                        </span>
                        {doc.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{doc.view_count}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-500">No documents found</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span>All Documents</span>
                <span className="text-neutral-400">{documents.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-neutral-400">{cat.document_count || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular documents */}
          {popularDocs.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-neutral-500" />
                <h3 className="font-semibold text-neutral-900">Popular</h3>
              </div>
              <div className="space-y-2">
                {popularDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(`/sops/${doc.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-700 line-clamp-1">
                      {doc.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {doc.view_count} views
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
