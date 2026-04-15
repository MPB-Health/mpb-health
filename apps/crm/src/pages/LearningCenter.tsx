import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Rocket,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Package,
  Megaphone,
  Share2,
  Mail,
  CalendarDays,
  BarChart3,
  Handshake,
  LifeBuoy,
  FileText,
  Zap,
  Settings2,
  Settings,
  FileInput,
  X,
  GraduationCap,
  Clock,
  Star,
} from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { MODULE_META } from '../help/types';
import type { HelpModule, Difficulty } from '../help/types';
import {
  getAllArticles,
  getArticleById,
  getArticlesByModule,
  searchArticles,
} from '../help/registry';

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Package,
  Megaphone,
  Share2,
  Mail,
  CalendarDays,
  BarChart3,
  Handshake,
  LifeBuoy,
  FileText,
  Zap,
  Settings2,
  Settings,
  FileInput,
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const RECENTLY_VIEWED_KEY = 'mpb-help-recently-viewed';
const MAX_RECENT = 5;

function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentlyViewed(articleId: string) {
  const recent = getRecentlyViewed().filter((id) => id !== articleId);
  recent.unshift(articleId);
  localStorage.setItem(
    RECENTLY_VIEWED_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  );
}

export default function LearningCenter() {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();

  if (articleId) {
    return <ArticleView articleId={articleId} />;
  }

  return <ModuleGrid />;
}

function ModuleGrid() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<HelpModule | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null);

  const allArticles = useMemo(() => getAllArticles(), []);
  const recentIds = useMemo(() => getRecentlyViewed(), []);
  const recentArticles = useMemo(
    () => recentIds.map((id) => getArticleById(id)).filter(Boolean),
    [recentIds],
  );

  const filteredArticles = useMemo(() => {
    let results = query ? searchArticles(query) : allArticles;
    if (selectedModule) {
      results = results.filter((a) => a.module === selectedModule);
    }
    if (difficultyFilter) {
      results = results.filter((a) => a.difficulty === difficultyFilter);
    }
    return results;
  }, [query, allArticles, selectedModule, difficultyFilter]);

  const showResults = query || selectedModule || difficultyFilter;

  const goToArticle = (id: string) => {
    addRecentlyViewed(id);
    navigate(`/learning-center/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-th-accent-100 dark:bg-th-accent-500/10 mb-4">
          <GraduationCap className="w-7 h-7 text-th-accent-600 dark:text-th-accent-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-th-text-primary">
          Learning Center
        </h1>
        <p className="mt-2 text-th-text-secondary max-w-xl mx-auto">
          Everything you need to master the CRM. Browse guides by topic or search for specific features.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, tips, and guides..."
          className="w-full pl-12 pr-10 py-3 text-sm bg-surface-secondary border border-th-border rounded-xl text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500/40 focus:border-th-accent-500 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-th-text-tertiary hover:text-th-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6 max-w-2xl mx-auto">
        <span className="text-xs text-th-text-tertiary font-medium">Filter:</span>
        {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
              difficultyFilter === d
                ? DIFFICULTY_COLORS[d] + ' border-current'
                : 'border-th-border text-th-text-tertiary hover:border-th-border-strong',
            )}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        {selectedModule && (
          <button
            type="button"
            onClick={() => setSelectedModule(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-th-accent-100 dark:bg-th-accent-500/10 text-th-accent-600 dark:text-th-accent-400 border border-th-accent-200 dark:border-th-accent-500/20"
          >
            {MODULE_META.find((m) => m.key === selectedModule)?.label}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {showResults ? (
        /* Article list results */
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-th-text-tertiary mb-4">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => goToArticle(article.id)}
                className="w-full flex items-start gap-3 p-4 rounded-lg border border-th-border bg-surface-primary hover:bg-surface-secondary text-left transition-colors"
              >
                <BookOpen className="w-5 h-5 text-th-accent-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-th-text-primary">
                    {article.title}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-0.5 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', DIFFICULTY_COLORS[article.difficulty])}>
                      {article.difficulty}
                    </span>
                    <span className="text-[10px] text-th-text-tertiary">
                      {MODULE_META.find((m) => m.key === article.module)?.label}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-th-text-tertiary shrink-0 mt-0.5" />
              </button>
            ))}
            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-th-text-tertiary/40 mx-auto mb-3" />
                <p className="text-sm text-th-text-tertiary">
                  No articles match your search. Try different keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Recently Viewed */}
          {recentArticles.length > 0 && (
            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-th-text-primary mb-3">
                <Clock className="w-4 h-4 text-th-text-tertiary" />
                Recently Viewed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentArticles.map((article) =>
                  article ? (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => goToArticle(article.id)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-th-border bg-surface-primary hover:bg-surface-secondary text-left transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-th-accent-500 shrink-0" />
                      <span className="text-sm text-th-text-primary truncate">
                        {article.title}
                      </span>
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULE_META.map((mod) => {
              const Icon = ICON_MAP[mod.icon] || BookOpen;
              const articleCount = getArticlesByModule(mod.key).length;
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => setSelectedModule(mod.key)}
                  className="group flex flex-col items-start p-5 rounded-xl border border-th-border bg-surface-primary hover:bg-surface-secondary hover:border-th-accent-300 dark:hover:border-th-accent-500/30 text-left transition-all"
                >
                  <div className="flex items-center gap-3 mb-3 w-full">
                    <div className="w-9 h-9 rounded-lg bg-th-accent-50 dark:bg-th-accent-500/10 flex items-center justify-center group-hover:bg-th-accent-100 dark:group-hover:bg-th-accent-500/20 transition-colors">
                      <Icon className="w-4.5 h-4.5 text-th-accent-600 dark:text-th-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-th-text-primary truncate">
                        {mod.label}
                      </h3>
                    </div>
                    <span className="text-xs text-th-text-tertiary tabular-nums">
                      {articleCount} article{articleCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-th-text-tertiary line-clamp-2">
                    {mod.description}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ArticleView({ articleId }: { articleId: string }) {
  const navigate = useNavigate();
  const article = useMemo(() => getArticleById(articleId), [articleId]);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <BookOpen className="w-12 h-12 text-th-text-tertiary/40 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-th-text-primary mb-2">
          Article Not Found
        </h2>
        <p className="text-sm text-th-text-tertiary mb-4">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <button
          type="button"
          onClick={() => navigate('/learning-center')}
          className="text-sm text-th-accent-600 dark:text-th-accent-400 hover:underline"
        >
          Back to Learning Center
        </button>
      </div>
    );
  }

  const moduleArticles = getArticlesByModule(article.module).filter(
    (a) => a.id !== article.id,
  );
  const moduleMeta = MODULE_META.find((m) => m.key === article.module);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-th-text-tertiary mb-6">
        <button
          type="button"
          onClick={() => navigate('/learning-center')}
          className="flex items-center gap-1 hover:text-th-text-secondary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Learning Center
        </button>
        <span>/</span>
        <span className="text-th-text-secondary">{moduleMeta?.label}</span>
      </div>

      {/* Article header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', DIFFICULTY_COLORS[article.difficulty])}>
            {article.difficulty}
          </span>
          <span className="text-xs text-th-text-tertiary">{moduleMeta?.label}</span>
        </div>
        <h1 className="text-2xl font-bold text-th-text-primary mb-2">
          {article.title}
        </h1>
        <p className="text-sm text-th-text-secondary">{article.summary}</p>
      </div>

      {/* Article content */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
        {article.content.split('\n\n').map((paragraph, idx) => (
          <p
            key={idx}
            className="text-sm text-th-text-secondary leading-relaxed mb-4"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] rounded-full bg-surface-tertiary text-th-text-tertiary border border-th-border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Feedback */}
      <div className="p-4 rounded-lg border border-th-border bg-surface-secondary mb-8">
        <p className="text-sm font-medium text-th-text-primary mb-2">
          Was this article helpful?
        </p>
        {feedback ? (
          <p className="text-xs text-th-text-tertiary">
            Thanks for your feedback!
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedback('helpful')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-th-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-th-text-secondary transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Yes, helpful
            </button>
            <button
              type="button"
              onClick={() => setFeedback('not-helpful')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-th-border hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-th-text-secondary transition-colors"
            >
              Could be better
            </button>
          </div>
        )}
      </div>

      {/* Related articles */}
      {moduleArticles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-th-text-primary mb-3">
            More from {moduleMeta?.label}
          </h3>
          <div className="space-y-2">
            {moduleArticles.map((related) => (
              <button
                key={related.id}
                type="button"
                onClick={() => {
                  addRecentlyViewed(related.id);
                  navigate(`/learning-center/${related.id}`);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-surface-secondary text-left transition-colors"
              >
                <BookOpen className="w-4 h-4 text-th-accent-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-th-text-primary truncate">
                    {related.title}
                  </p>
                  <p className="text-xs text-th-text-tertiary truncate">
                    {related.summary}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-th-text-tertiary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
