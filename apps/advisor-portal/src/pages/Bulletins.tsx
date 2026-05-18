import { useState, useEffect, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Clock,
  ArrowRight,
  Newspaper,
  Search,
  X,
  Eye,
  Sparkles,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contentService, type Bulletin } from '@mpbhealth/advisor-core';
import { Button, GradientHeader } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { supabase } from '@mpbhealth/database';
import SafeImage from '../components/SafeImage';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';

export default function Bulletins() {
  useAdvisorPageDebugLog('Bulletins');
  const { profile, unreadBulletinCount } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const advisorScopeKey = profile?.id ?? profile?.user_id ?? '';

  const {
    data: bulletins = [],
    isPending: bulletinsPending,
    isFetching: bulletinsFetching,
  } = useQuery({
    queryKey: ['bulletins', advisorScopeKey],
    queryFn: () => contentService.getBulletins({}, advisorScopeKey, { includeContent: false }),
    enabled: advisorReady && Boolean(advisorScopeKey),
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    retry: 2,
  });

  const loading =
    !advisorReady ||
    !advisorScopeKey ||
    bulletinsPending ||
    (bulletinsFetching && bulletins.length === 0);

  // Second fetch after mount: first request can race Supabase session/RLS and cache an empty list.
  useEffect(() => {
    if (!advisorReady || !advisorScopeKey) return;
    const t = window.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['bulletins', advisorScopeKey] });
    }, 450);
    return () => window.clearTimeout(t);
  }, [advisorReady, advisorScopeKey, queryClient]);

  // Realtime: refresh when admin publishes, edits, or removes bulletins
  useEffect(() => {
    const channel = contentService.subscribeToBulletins(() => {
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
    });
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const latestBulletin = bulletins[0];
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredBulletins = bulletins.filter((b) => {
    if (!normalizedSearchQuery) return true;
    return (
      b.title.toLowerCase().includes(normalizedSearchQuery) ||
      b.excerpt?.toLowerCase().includes(normalizedSearchQuery)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-surface-tertiary rounded-lg" />
        <div className="h-[220px] bg-surface-tertiary rounded-2xl" />
        <div className="h-12 bg-surface-tertiary rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
              <div className="h-44 bg-surface-tertiary" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-20 bg-surface-tertiary rounded" />
                <div className="h-5 w-3/4 bg-surface-tertiary rounded" />
                <div className="h-4 w-full bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Bulletins & Announcements"
        subtitle="Stay informed with the latest updates, policy changes, and important announcements from MPB Health."
        icon={<Newspaper className="w-6 h-6" />}
        actions={
          unreadBulletinCount > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-th-accent-50 dark:bg-th-accent-900/20 backdrop-blur-sm rounded-lg border border-th-border">
              <div className="relative">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-th-text-primary">
                {unreadBulletinCount} unread
              </span>
            </div>
          ) : undefined
        }
      >
        <div className="mt-1 pt-5 border-t border-th-border flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-th-accent-50 dark:bg-th-accent-900/20 backdrop-blur-sm rounded-full text-xs text-th-text-secondary border border-th-border">
            <Newspaper className="w-3.5 h-3.5 text-th-accent-500" />
            <span><strong className="text-th-text-primary">{bulletins.length}</strong> total bulletins</span>
          </div>
          {bulletins.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-th-accent-50 dark:bg-th-accent-900/20 backdrop-blur-sm rounded-full text-xs text-th-text-secondary border border-th-border">
              <CalendarDays className="w-3.5 h-3.5 text-th-accent-500" />
              <span>Latest: <strong className="text-th-text-primary">{format(new Date(bulletins[0].published_date), 'MMM d, yyyy')}</strong></span>
            </div>
          )}
          {unreadBulletinCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 backdrop-blur-sm rounded-full text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Eye className="w-3.5 h-3.5" />
              <span><strong className="text-th-text-primary">{unreadBulletinCount}</strong> to review</span>
            </div>
          )}
        </div>
      </GradientHeader>

      {/* Latest bulletin — editorial hero card */}
      {latestBulletin && (
        <button
          type="button"
          onClick={() => navigate(`/bulletins/${latestBulletin.slug}`)}
          className="w-full text-left relative rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className="relative h-[220px] md:h-[260px]">
            {latestBulletin.featured_image_url ? (
              <>
                <SafeImage
                  src={latestBulletin.featured_image_url}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  fallbackClassName="absolute inset-0 w-full h-full bg-[#071525]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060e1a] via-[#060e1a]/70 to-[#060e1a]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#060e1a]/60 via-transparent to-transparent" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[#071525]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_-20%,_#0A4E8E_0%,_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_10%_100%,_rgba(164,204,67,0.06)_0%,_transparent_50%)]" />
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
              </>
            )}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#A4CC43] text-[#0a1628] uppercase tracking-widest shadow-lg shadow-[#A4CC43]/25">
                  <Sparkles className="w-2.5 h-2.5" />
                  Latest
                </span>
                <span className="flex items-center gap-1.5 text-white/40 text-xs font-medium tracking-wide">
                  <CalendarDays className="w-3 h-3" />
                  {format(new Date(latestBulletin.published_date), 'MMMM d, yyyy')}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl lg:text-[1.7rem] font-bold text-white line-clamp-2 leading-tight max-w-3xl tracking-[-0.01em]">
                {latestBulletin.title}
              </h2>
              {latestBulletin.excerpt && (
                <p className="text-white/45 text-sm line-clamp-1 max-w-2xl mt-2 hidden md:block leading-relaxed">
                  {latestBulletin.excerpt}
                </p>
              )}
              <span className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#A4CC43] group-hover:gap-3 transition-all duration-300">
                Read Bulletin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>

          {/* Accent stripe */}
          <div className="h-[3px] bg-gradient-to-r from-[#A4CC43] via-[#0A4E8E] to-transparent" />
        </button>
      )}

      {/* Search bar */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bulletins by title or summary..."
              className="w-full pl-9 pr-8 py-2.5 bg-surface-tertiary rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/30 text-sm transition-shadow"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-primary"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-th-text-tertiary shrink-0">
            Showing {filteredBulletins.length} of {bulletins.length} bulletins
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Previous bulletins grid — latest is shown in marquee above */}
      {(() => {
        const gridBulletins = latestBulletin
          ? filteredBulletins.filter((b) => b.id !== latestBulletin.id)
          : filteredBulletins;
        return gridBulletins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridBulletins.map((bulletin) => {
            const isUnread = !bulletin.is_read;

            return (
              <article
                key={bulletin.id}
                onClick={() => navigate(`/bulletins/${bulletin.slug}`)}
                className={`bg-surface-primary rounded-xl border overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  isUnread
                    ? 'border-[#0C71C3]/30 ring-1 ring-[#0C71C3]/10'
                    : 'border-th-border'
                } [content-visibility:auto] [contain-intrinsic-size:360px]`}
              >
                {bulletin.featured_image_url ? (
                  <div className="relative h-44 overflow-hidden">
                    <SafeImage
                      src={bulletin.featured_image_url}
                      alt={`Featured image for ${bulletin.title}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A4E8E]/5 to-[#0C71C3]/10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#0C71C3] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                        New
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white/90 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-44 bg-gradient-to-br from-[#0A4E8E]/5 to-[#0C71C3]/10 flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-[#0A4E8E]/20" />
                    {isUnread && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#0C71C3] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#0A4E8E]/10 text-[#0A4E8E]">
                      Bulletin
                    </span>
                    {isUnread ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <Eye className="w-2.5 h-2.5" />
                        Unread
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-th-text-tertiary">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Read
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-th-text-primary leading-snug mb-2 line-clamp-2 group-hover:text-[#0C71C3] transition-colors">
                    {bulletin.title}
                  </h3>

                  {bulletin.excerpt && (
                    <p className="text-th-text-tertiary text-sm line-clamp-2 mb-4 leading-relaxed">
                      {bulletin.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-th-border-subtle">
                    {!bulletin.featured_image_url && (
                      <span className="text-xs text-th-text-tertiary flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    {bulletin.featured_image_url && (
                      <span className="text-xs text-th-text-tertiary">
                        {formatDistanceToNow(new Date(bulletin.published_date), { addSuffix: true })}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[#0A4E8E] flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
                      Read
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border p-16 text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-1">
            {searchQuery ? 'No bulletins found' : latestBulletin ? 'No other bulletins' : 'No bulletins at this time'}
          </h3>
          <p className="text-th-text-tertiary text-sm">
            {searchQuery ? 'Try adjusting your search' : latestBulletin ? 'Your latest bulletin is shown above.' : 'Check back soon!'}
          </p>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-4 text-[#0A4E8E] hover:text-[#0C71C3]"
            >
              Clear search
            </Button>
          )}
        </div>
        );
      })()}
    </div>
  );
}
