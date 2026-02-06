import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  FileText,
  Eye,
  ExternalLink,
  Presentation,
  BarChart2,
  FileSearch,
  FileImage,
  File,
  Heart,
  Mountain,
  Shield,
  Pill,
} from 'lucide-react';
import {
  contentService,
  type SOPDocument,
  type SOPCategory,
} from '@mpbhealth/advisor-core';

interface SOPLibraryProps {
  section?: string;
}

// Section configuration for filtering and display
const sectionConfig: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  'presentations': {
    title: 'Presentations',
    description: 'Sales and training presentations',
    icon: Presentation,
  },
  'pricing-charts': {
    title: 'Pricing Charts',
    description: 'Product pricing and comparison charts',
    icon: BarChart2,
  },
  'reference-materials': {
    title: 'Reference Materials',
    description: 'Detailed reference documentation',
    icon: BookOpen,
  },
  'quick-reference': {
    title: 'Quick Reference Guides',
    description: 'Quick reference guides and cheat sheets',
    icon: FileSearch,
  },
  'flyers-sedera': {
    title: 'Flyers, Sedera',
    description: 'Sedera product flyers and materials',
    icon: FileImage,
  },
  'flyers': {
    title: 'Flyers',
    description: 'General marketing flyers',
    icon: File,
  },
  'healthsharing-zion': {
    title: 'HealthSharing, Zion',
    description: 'Zion HealthShare materials',
    icon: Heart,
  },
  'zion': {
    title: 'Zion',
    description: 'Zion product documentation',
    icon: Mountain,
  },
  'arm': {
    title: 'ARM',
    description: 'ARM program materials',
    icon: Shield,
  },
  'rx': {
    title: 'RX',
    description: 'Prescription and pharmacy resources',
    icon: Pill,
  },
};

export default function SOPLibrary({ section }: SOPLibraryProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [popularDocs, setPopularDocs] = useState<SOPDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Get section config if section is specified
  const currentSection = section ? sectionConfig[section] : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch documents independently to avoid one failure blocking all
        const docs = await contentService.getSOPDocuments().catch(err => {
          console.error('Failed to load SOP documents:', err);
          return [];
        });
        
        const cats = await contentService.getSOPCategories().catch(err => {
          console.error('Failed to load SOP categories:', err);
          return [];
        });
        
        const popular = await contentService.getPopularSOPs(5).catch(err => {
          console.error('Failed to load popular SOPs:', err);
          return [];
        });
        
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
  }, [section]);

  const filteredDocuments = documents.filter((doc) => {
    // Apply section filter if specified
    if (section) {
      const sectionName = currentSection?.title || section;
      const categoryLower = doc.category?.toLowerCase() || '';
      const sectionLower = section.toLowerCase().replace('-', ' ');
      const sectionNameLower = sectionName.toLowerCase();
      
      const matchesSection = 
        categoryLower === sectionNameLower ||
        categoryLower === sectionLower ||
        categoryLower.includes(sectionLower) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(sectionLower));
      
      if (!matchesSection) return false;
    }
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  // Dynamic title and description based on section
  const pageTitle = currentSection?.title || 'SOPs & Playbooks';
  const pageDescription = currentSection?.description || 'Standard operating procedures and reference documents';
  const PageIcon = currentSection?.icon || BookOpen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          section ? 'bg-th-accent-100 dark:bg-th-accent-900/30' : 'bg-surface-tertiary'
        }`}>
          <PageIcon className={`w-6 h-6 ${
            section ? 'text-th-accent-600 dark:text-th-accent-400' : 'text-th-text-tertiary'
          }`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">{pageTitle}</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {pageDescription}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
        <input
          type="text"
          placeholder="Search documents, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => {
            // Check if this is an external document (has file_url)
            const isExternalLink = !!doc.file_url;
            const hasImage = !!doc.image_url;

            const handleClick = () => {
              if (isExternalLink && doc.file_url) {
                window.open(doc.file_url, '_blank', 'noopener,noreferrer');
              } else {
                navigate(`/sops/${doc.id}`);
              }
            };

            return (
              <button
                key={doc.id}
                onClick={handleClick}
                className="bg-surface-primary rounded-xl border border-th-border overflow-hidden text-left hover:border-th-accent-300 hover:shadow-md transition-all"
              >
                {/* Image thumbnail or icon header */}
                {hasImage ? (
                  <div className="w-full h-40 bg-surface-tertiary">
                    <img
                      src={doc.image_url!}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-5 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
                      </div>
                      <div className="text-right text-sm text-th-text-tertiary">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{doc.view_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card content */}
                <div className={hasImage ? 'p-5' : 'p-5 pt-4'}>
                  <h3 className="font-semibold text-th-text-primary">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-th-border-subtle">
                    <span className="text-sm text-th-text-tertiary">{doc.category}</span>
                    <span className="text-sm text-th-accent-600 font-medium flex items-center gap-1">
                      {isExternalLink ? (
                        <>
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        'View →'
                      )}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full bg-surface-primary rounded-xl border border-th-border p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No documents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
