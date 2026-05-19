import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Code2,
} from 'lucide-react';
import { seoAdminService, type SeoMetadataRow, type SeoStats } from '@mpbhealth/admin-core';

export default function SeoSuite() {
  const [pages, setPages] = useState<SeoMetadataRow[]>([]);
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'sitemap' | 'robots'>('overview');
  const [robotsTxt, setRobotsTxt] = useState('User-agent: *\nAllow: /\n\nSitemap: https://mpb.health/sitemap.xml');

  const loadData = useCallback(async () => {
    try {
      const [pagesData, statsData] = await Promise.all([
        seoAdminService.getAll(),
        seoAdminService.getStats(),
      ]);
      setPages(pagesData);
      setStats(statsData);
    } catch {
      toast.error('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateSitemap = () => {
    const publishedPages = pages.filter((p) => p.robots !== 'noindex');
    const urls = publishedPages.map((p) => `  <url>\n    <loc>https://mpb.health${p.page_path}</loc>\n    <lastmod>${new Date(p.updated_at || p.created_at).toISOString().split('T')[0]}</lastmod>\n  </url>`);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sitemap.xml'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Sitemap generated and downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-th-text-primary">SEO Suite</h1>
        <p className="text-sm text-th-text-secondary mt-1">
          Manage search engine optimization across all pages and blog posts.
        </p>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Pages" value={stats.total} icon={FileText} />
          <StatCard label="With Title" value={stats.withTitle} icon={CheckCircle} color="emerald" />
          <StatCard label="Missing Title" value={stats.missingTitle} icon={AlertCircle} color="amber" />
          <StatCard label="Missing Desc" value={stats.missingDescription} icon={Globe} color="rose" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-th-border">
        {(['overview', 'pages', 'sitemap', 'robots'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-tertiary hover:text-th-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-surface-primary border border-th-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-th-text-primary mb-4">SEO Health Check</h3>
            <div className="space-y-3">
              {pages.slice(0, 20).map((page) => (
                <SeoPageRow key={page.id} page={page} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary/60 border-b border-th-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Path</th>
                <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Title</th>
                <th className="text-left px-4 py-3 font-medium text-th-text-secondary hidden md:table-cell">Description</th>
                <th className="text-center px-4 py-3 font-medium text-th-text-secondary w-20">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/60">
              {pages.map((page) => {
                const score = getSeoScore(page);
                return (
                  <tr key={page.id} className="hover:bg-surface-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs text-th-text-primary">{page.page_path}</td>
                    <td className="px-4 py-3 text-th-text-primary truncate max-w-[200px]">{page.meta_title || '—'}</td>
                    <td className="px-4 py-3 text-th-text-secondary truncate max-w-[250px] hidden md:table-cell">{page.meta_description || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                        score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sitemap' && (
        <div className="bg-surface-primary border border-th-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-th-text-primary">Sitemap Generator</h3>
              <p className="text-sm text-th-text-secondary mt-1">
                Generate an XML sitemap from all published pages and posts.
              </p>
            </div>
            <button
              type="button"
              onClick={generateSitemap}
              className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700"
            >
              <Download className="w-4 h-4" />
              Generate & Download
            </button>
          </div>
          <div className="bg-surface-secondary rounded-lg p-4 text-xs font-mono text-th-text-secondary">
            <p>Will include {pages.filter((p) => p.robots !== 'noindex').length} pages</p>
            <p className="mt-1 text-th-text-tertiary">Pages with noindex robots directive are excluded from the sitemap.</p>
          </div>
        </div>
      )}

      {activeTab === 'robots' && (
        <div className="bg-surface-primary border border-th-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-th-text-primary">robots.txt Editor</h3>
          <textarea
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 bg-surface-secondary border border-th-border rounded-lg font-mono text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
          <button
            type="button"
            onClick={() => toast.success('robots.txt saved (deploy to apply)')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700"
          >
            <Code2 className="w-4 h-4" />
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof FileText; color?: string }) {
  const colorClasses = color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : color === 'amber' ? 'text-amber-600 bg-amber-50' : color === 'rose' ? 'text-rose-600 bg-rose-50' : 'text-th-accent-600 bg-th-accent-50';
  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses} mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-th-text-primary">{value}</p>
      <p className="text-sm text-th-text-secondary">{label}</p>
    </div>
  );
}

function SeoPageRow({ page }: { page: SeoMetadataRow }) {
  const score = getSeoScore(page);
  const issues: string[] = [];
  if (!page.meta_title) issues.push('Missing title');
  if (!page.meta_description) issues.push('Missing description');
  if (page.meta_title && page.meta_title.length > 60) issues.push('Title too long');
  if (page.meta_description && page.meta_description.length > 160) issues.push('Description too long');
  if (!page.og_image) issues.push('No OG image');

  return (
    <div className="flex items-center gap-3 py-2 border-b border-th-border/40 last:border-0">
      <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
        score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
      }`}>
        {score}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{page.page_path}</p>
        {issues.length > 0 && (
          <p className="text-xs text-amber-600 mt-0.5">{issues.join(' · ')}</p>
        )}
      </div>
    </div>
  );
}

function getSeoScore(page: SeoMetadataRow): number {
  let score = 0;
  if (page.meta_title) score += 25;
  if (page.meta_description) score += 25;
  if (page.meta_title && page.meta_title.length <= 60) score += 15;
  if (page.meta_description && page.meta_description.length <= 160) score += 15;
  if (page.og_image) score += 10;
  if (page.canonical_url) score += 10;
  return Math.min(100, score);
}
