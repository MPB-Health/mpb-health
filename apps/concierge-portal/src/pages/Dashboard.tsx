import { useState, useMemo } from 'react';
import {
  TRAINING_RESOURCES,
  QUICK_LINKS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  type TrainingCategory,
  type TrainingResource,
} from '@mpbhealth/concierge-core';
import {
  Search,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  ClipboardCheck,
  ScrollText,
  PhoneCall,
  Heart,
  Stethoscope,
  ClipboardList,
  Headphones,
  Link2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CATEGORY_ICONS: Record<TrainingCategory, React.ReactNode> = {
  'health-sharing': <Heart className="w-5 h-5" />,
  'mpb-plans': <BookOpen className="w-5 h-5" />,
  'welcome-scripts': <PhoneCall className="w-5 h-5" />,
  'telehealth': <Stethoscope className="w-5 h-5" />,
  'internal-sops': <ClipboardList className="w-5 h-5" />,
  'customer-service': <Headphones className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<TrainingCategory, { bg: string; border: string; icon: string; badge: string }> = {
  'health-sharing': { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  'mpb-plans': { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  'welcome-scripts': { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  'telehealth': { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  'internal-sops': { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  'customer-service': { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  checklist: <ClipboardCheck className="w-3.5 h-3.5" />,
  handbook: <BookOpen className="w-3.5 h-3.5" />,
  sop: <ScrollText className="w-3.5 h-3.5" />,
  script: <PhoneCall className="w-3.5 h-3.5" />,
};

const CATEGORIES: TrainingCategory[] = [
  'health-sharing',
  'telehealth',
  'internal-sops',
  'mpb-plans',
  'welcome-scripts',
  'customer-service',
];

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResourceCard({ resource, query }: { resource: TrainingResource; query: string }) {
  const colors = CATEGORY_COLORS[resource.category];

  if (resource.links && resource.links.length > 1) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
            {TYPE_ICONS[resource.type] || <FileText className="w-3 h-3" />}
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2"><HighlightMatch text={resource.title} query={query} /></h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2"><HighlightMatch text={resource.description} query={query} /></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {resource.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              <HighlightMatch text={link.label} query={query} />
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
              {TYPE_ICONS[resource.type] || <FileText className="w-3 h-3" />}
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
            {resource.subcategory && (
              <span className="text-xs text-slate-500">{resource.subcategory}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">
            <HighlightMatch text={resource.title} query={query} />
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2"><HighlightMatch text={resource.description} query={query} /></p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
      </div>
    </a>
  );
}

function CategorySection({ category, resources, defaultOpen, query }: { category: TrainingCategory; resources: TrainingResource[]; defaultOpen: boolean; query: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = CATEGORY_COLORS[category];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden transition-all duration-200`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/30 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center ${colors.icon} shrink-0`}>
          {CATEGORY_ICONS[category]}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800">{CATEGORY_LABELS[category]}</h2>
          <p className="text-sm text-slate-600 mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colors.badge}`}>
            {resources.length}
          </span>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} query={query} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState('');

  const query = search.toLowerCase().trim();

  const filteredByCategory = useMemo(() => {
    const result: Record<TrainingCategory, TrainingResource[]> = {
      'health-sharing': [],
      'mpb-plans': [],
      'welcome-scripts': [],
      'telehealth': [],
      'internal-sops': [],
      'customer-service': [],
    };

    for (const resource of TRAINING_RESOURCES) {
      if (
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query) ||
        (resource.subcategory && resource.subcategory.toLowerCase().includes(query)) ||
        resource.type.toLowerCase().includes(query) ||
        resource.url.toLowerCase().includes(query) ||
        (resource.links && resource.links.some(
          (l) => l.label.toLowerCase().includes(query) || l.url.toLowerCase().includes(query),
        ))
      ) {
        result[resource.category].push(resource);
      }
    }

    return result;
  }, [query]);

  const filteredQuickLinks = useMemo(() => {
    if (!query) return [];
    const results: { name: string; url: string; group: string }[] = [];
    for (const group of QUICK_LINKS) {
      if (group.children) {
        for (const child of group.children) {
          if (
            child.name.toLowerCase().includes(query) ||
            child.url.toLowerCase().includes(query) ||
            group.name.toLowerCase().includes(query)
          ) {
            results.push({ name: child.name, url: child.url, group: group.name });
          }
        }
      } else if (group.url) {
        if (
          group.name.toLowerCase().includes(query) ||
          group.url.toLowerCase().includes(query)
        ) {
          results.push({ name: group.name, url: group.url, group: '' });
        }
      }
    }
    return results;
  }, [query]);

  const resourceCount = useMemo(
    () => Object.values(filteredByCategory).reduce((sum, arr) => sum + arr.length, 0),
    [filteredByCategory],
  );

  const totalResults = resourceCount + filteredQuickLinks.length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Training Resources</h1>
        <p className="mt-1 text-slate-600">
          Access all concierge training materials, SOPs, handbooks, and scripts
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources, links, tools..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all placeholder:text-slate-400"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Quick Links Results */}
      {filteredQuickLinks.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 overflow-hidden">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center text-indigo-600 shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Quick Links</h2>
              <p className="text-xs text-slate-500">{filteredQuickLinks.length} matching tool{filteredQuickLinks.length !== 1 ? 's' : ''} &amp; platform{filteredQuickLinks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredQuickLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md hover:border-indigo-300 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                    <HighlightMatch text={link.name} query={query} />
                  </p>
                  {link.group && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      <HighlightMatch text={link.group} query={query} />
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Category Sections */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const resources = filteredByCategory[cat];
          if (search && resources.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              category={cat}
              resources={resources}
              defaultOpen={!search || resources.length > 0}
              query={query}
            />
          );
        })}
      </div>

      {search && totalResults === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No results found</h3>
          <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
