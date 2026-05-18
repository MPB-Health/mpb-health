import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Presentation,
  BarChart2,
  FileSearch,
  FileImage,
  File,
  Heart,
  Mountain,
  Shield,
  Pill,
  DollarSign,
  Briefcase,
  Library,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  contentService,
  type SOPDocument,
  type SOPCategory,
} from '@mpbhealth/advisor-core';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import DocumentCard from '../components/DocumentCard';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';

interface SOPLibraryProps {
  section?: string;
}

// Map icon name strings from CMS to Lucide icon components
const iconMap: Record<string, React.ElementType> = {
  Presentation,
  BookOpen,
  BarChart2,
  FileSearch,
  FileImage,
  File,
  Heart,
  Mountain,
  Shield,
  Pill,
  DollarSign,
  Search,
  Briefcase,
};

type SectionEntry = { title: string; description: string; icon: React.ElementType };

// Fallback section configuration used when CMS categories haven't loaded or return empty
const fallbackSectionConfig: Record<string, SectionEntry> = {
  'advisor-toolkit': {
    title: 'Advisor Toolkit',
    description: 'Presentations, advisor handbooks, and commission structure',
    icon: Briefcase,
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
    title: 'Sedera',
    description: 'Sedera product flyers and materials',
    icon: FileImage,
  },
  'sharing-guidelines': {
    title: 'Sharing Guidelines',
    description: 'Health sharing guidelines and documentation',
    icon: BookOpen,
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
  'handbooks': {
    title: 'Handbooks',
    description: 'Interactive flip-book handbooks for MPB Health plans',
    icon: Library,
  },
};

// Hardcoded handbook links (external 3D flip-book URLs, not CMS documents)
const HANDBOOK_LINKS: { title: string; url: string; description: string }[] = [
  {
    title: 'Care+ Handbook',
    url: 'https://mpb.health/3d-flip-book/careplus',
    description: 'Interactive handbook for the Care+ health sharing plan.',
  },
  {
    title: 'Direct Handbook',
    url: 'https://mpb.health/3d-flip-book/direct-handbook',
    description: 'Interactive handbook for the Direct health sharing plan.',
  },
  {
    title: 'Secure HSA Handbook',
    url: 'https://mpb.health/3d-flip-book/secure-hsa',
    description: 'Interactive handbook for the Secure HSA plan.',
  },
  {
    title: 'Essentials Handbook',
    url: 'https://mpb.health/3d-flip-book/essentials',
    description: 'Interactive handbook for the Essentials health sharing plan.',
  },
  {
    title: 'MEC Essentials Handbook',
    url: 'https://mpb.health/3d-flip-book/mecessentials-handbook',
    description: 'Interactive handbook for the MEC Essentials plan.',
  },
];

/** Build section config dynamically from CMS categories, falling back to hardcoded defaults */
function buildSectionConfig(categories: SOPCategory[]): Record<string, SectionEntry> {
  if (categories.length === 0) return fallbackSectionConfig;

  const config: Record<string, SectionEntry> = {};
  for (const cat of categories) {
    config[cat.slug] = {
      title: cat.name,
      description: cat.description || '',
      icon: (cat.icon && iconMap[cat.icon]) || BookOpen,
    };
  }
  return config;
}

export default function SOPLibrary({ section }: SOPLibraryProps) {
  useAdvisorPageDebugLog('SOPLibrary');
  const navigate = useNavigate();
  const { advisorReady } = useAdvisorQueryReady();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<SOPDocument | null>(null);

  const { data: sopData, isLoading: loading } = useQuery({
    queryKey: ['sopLibrary', section],
    queryFn: async () => {
      const [docs, cats, popular] = await Promise.all([
        contentService.getSOPDocuments().catch(() => []),
        contentService.getSOPCategories().catch(() => []),
        contentService.getPopularSOPs(5).catch(() => []),
      ]);
      return { documents: docs, categories: cats, popularDocs: popular };
    },
    enabled: advisorReady,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const documents = sopData?.documents ?? [];
  const categories = sopData?.categories ?? [];
  const popularDocs = sopData?.popularDocs ?? [];

  // Build section config dynamically from CMS categories, with hardcoded fallback
  const sectionConfig = useMemo(() => buildSectionConfig(categories), [categories]);

  // Get section config if section is specified
  const currentSection = section ? sectionConfig[section] : null;

  // Categories grouped under "Advisor Toolkit"
  const TOOLKIT_CATEGORIES = ['presentations', 'advisor handbook', 'commission structure'];

  const filteredDocuments = documents.filter((doc) => {
    // Apply section filter if specified
    if (section) {
      const sectionName = currentSection?.title || section;
      const categoryLower = doc.category?.toLowerCase() || '';
      const sectionLower = section.toLowerCase().replace('-', ' ');
      const sectionNameLower = sectionName.toLowerCase();

      let matchesSection: boolean;

      if (section === 'advisor-toolkit') {
        matchesSection =
          TOOLKIT_CATEGORIES.some(cat => categoryLower === cat || categoryLower.includes(cat)) ||
          doc.tags?.some(tag => TOOLKIT_CATEGORIES.some(cat => tag.toLowerCase().includes(cat))) || false;
      } else {
        matchesSection =
          categoryLower === sectionNameLower ||
          categoryLower === sectionLower ||
          categoryLower.includes(sectionLower) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(sectionLower)) || false;
      }

      if (!matchesSection) return false;
    }
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Render hardcoded handbook links for the /sops/handbooks section
  if (section === 'handbooks') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-th-accent-100 dark:bg-th-accent-900/30">
            <Library className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Handbooks</h1>
            <p className="text-th-text-tertiary text-sm mt-1">
              Interactive flip-book handbooks for MPB Health plans
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {HANDBOOK_LINKS.map((book) => (
            <a
              key={book.url}
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all flex flex-col p-5 gap-3"
            >
              <div className="w-10 h-10 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Library className="w-5 h-5 text-th-accent-600 dark:text-th-accent-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-th-text-tertiary mt-1">{book.description}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-th-accent-600 font-medium mt-auto pt-3 border-t border-th-border-subtle">
                <ExternalLink className="w-3.5 h-3.5" />
                Open Handbook
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-tertiary rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-surface-tertiary rounded" />
            <div className="h-4 w-64 bg-surface-tertiary rounded" />
          </div>
        </div>
        <div className="h-11 bg-surface-tertiary rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
              <div className="aspect-[16/9] bg-surface-tertiary" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-surface-tertiary rounded" />
                <div className="h-3 w-full bg-surface-tertiary rounded" />
                <div className="h-3 w-2/3 bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dynamic title and description based on section
  const pageTitle = currentSection?.title || 'Resources';
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

      {/* Cards grid - matches Resource Center layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => {
            const url = doc.file_url?.toLowerCase() || '';
            const isPPTX = url.match(/\.pptx?$/) !== null;
            const isXLSX = url.match(/\.xlsx?$/) !== null;
            const isDOCX = url.match(/\.docx?$/) !== null;
            const isPDF = url.endsWith('.pdf') === true;
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(doc.file_url || '');
            const isSharePointPresentation =
              (url.includes('sharepoint') || url.includes('onedrive')) &&
              (url.includes('/:p:/') || url.includes('%3ap%3a'));
            const canPreview =
              isPPTX || isXLSX || isDOCX || isPDF || isImage || isSharePointPresentation;
            const isExternalLink = !!doc.file_url;

            const handleClick = () => {
              if (canPreview && doc.file_url) {
                setPreviewDoc(doc);
              } else if (isExternalLink && doc.file_url) {
                window.open(doc.file_url, '_blank', 'noopener,noreferrer');
              } else {
                navigate(`/sops/${doc.id}`);
              }
            };

            return (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onClick={handleClick}
              />
            );
          })
        ) : (
          <div className="col-span-full bg-surface-primary rounded-xl border border-th-border p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No documents found</p>
          </div>
        )}
      </div>

      {/* PPTX Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ''}
        fileUrl={previewDoc?.file_url || ''}
      />
    </div>
  );
}
