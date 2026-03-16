import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  Filter,
  GraduationCap,
  Megaphone,
  X,
  Copy,
  CheckCheck,
  ArrowLeft,
  Grid3X3,
  List,
  Loader2,
} from 'lucide-react';
import { Button, GradientHeader } from '@mpbhealth/ui';
import { videoService, type AdvisorVideo } from '@mpbhealth/advisor-core';
import { supabase } from '@mpbhealth/database';

type VideoCategory = 'all' | 'training' | 'marketing';

function getThumbnail(video: AdvisorVideo): string {
  return video.thumbnail_url || `https://vumbnail.com/${video.vimeo_id}.jpg`;
}

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<AdvisorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VideoCategory>('all');
  const [playingVideo, setPlayingVideo] = useState<AdvisorVideo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    videoService.getVideos()
      .then((data) => {
        if (!cancelled) setVideos(data);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Realtime: refresh when admin adds/edits/removes videos
  useEffect(() => {
    const channel = videoService.subscribeToVideoChanges((updated) => {
      setVideos(updated);
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  const categoryOptions: { value: VideoCategory; label: string; icon: typeof GraduationCap; count: number }[] = useMemo(() => [
    { value: 'all', label: 'All Videos', icon: Grid3X3, count: videos.length },
    { value: 'training', label: 'Advisor Training', icon: GraduationCap, count: videos.filter(v => v.category === 'training').length },
    { value: 'marketing', label: 'Share with Members', icon: Megaphone, count: videos.filter(v => v.category === 'marketing').length },
  ], [videos]);

  const filtered = useMemo(() => {
    return videos.filter(v => {
      const matchesCategory = category === 'all' || v.category === category;
      const matchesSearch = !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        (v.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [videos, search, category]);

  const copyVideoLink = (video: AdvisorVideo) => {
    const url = video.vimeo_hash
      ? `https://vimeo.com/${video.vimeo_id}/${video.vimeo_hash}`
      : `https://vimeo.com/${video.vimeo_id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <GradientHeader
            title="Video Library"
            subtitle="Training videos for advisors and marketing content to share with potential members."
            size="sm"
          />
        </div>
      </div>

      {/* Category tabs + search */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {categoryOptions.map(opt => {
              const Icon = opt.icon;
              const isActive = category === opt.value;
              return (
                <Button
                  type="button"
                  key={opt.value}
                  variant={isActive ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCategory(opt.value)}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/20' : 'bg-th-border'}`}>
                    {opt.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Search + view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-tertiary rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary outline-none focus:ring-2 focus:ring-[#0A4E8E]/30 transition-shadow"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-primary" aria-label="Clear search">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex bg-surface-tertiary rounded-lg p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`min-h-[44px] min-w-[44px] rounded-md ${viewMode === 'grid' ? 'bg-surface-primary shadow-sm text-th-text-primary' : 'text-th-text-tertiary hover:text-th-text-secondary'}`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid' ? 'true' : 'false'}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`min-h-[44px] min-w-[44px] rounded-md ${viewMode === 'list' ? 'bg-surface-primary shadow-sm text-th-text-primary' : 'text-th-text-tertiary hover:text-th-text-secondary'}`}
                aria-label="List view"
                aria-pressed={viewMode === 'list' ? 'true' : 'false'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="mt-3 text-xs text-th-text-tertiary">
          Showing {filtered.length} of {videos.length} videos
          {category !== 'all' && ` in "${categoryOptions.find(c => c.value === category)?.label}"`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <Loader2 className="w-8 h-8 text-th-text-tertiary mx-auto mb-3 animate-spin" />
          <p className="text-th-text-primary font-medium">Loading videos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <Filter className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
          <p className="text-th-text-primary font-medium">No videos found</p>
          <p className="text-sm text-th-text-tertiary mt-1">Try adjusting your search or category filter.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setCategory('all'); }}
            className="mt-4 text-th-accent-600 hover:text-th-accent-700"
          >
            Clear filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(video => (
            <div key={video.id} className="bg-surface-primary rounded-xl border border-th-border overflow-hidden group hover:shadow-lg hover:border-th-accent-300 transition-all">
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => setPlayingVideo(video)}
                className="relative w-full block"
                style={{ paddingBottom: '56.25%' }}
                aria-label={`Play ${video.title}`}
              >
                <img
                  src={getThumbnail(video)}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 flex items-center justify-center transition-all shadow-lg">
                    <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
                  </div>
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${
                    video.category === 'training'
                      ? 'bg-[#0E2D41]/80 text-white'
                      : 'bg-[#A4CC43]/90 text-[#0E2D41]'
                  }`}>
                    {video.category === 'training' ? <GraduationCap className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                    {video.category === 'training' ? 'Training' : 'Marketing'}
                  </span>
                </div>
                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-3 right-3">
                    <span className="px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-mono">
                      {video.duration}
                    </span>
                  </div>
                )}
              </button>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-th-text-primary text-sm leading-snug line-clamp-2">
                  {video.title}
                </h3>
                <p className="mt-1.5 text-xs text-th-text-tertiary leading-relaxed line-clamp-2">
                  {video.description}
                </p>
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {video.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-surface-tertiary text-th-text-tertiary text-[10px] rounded font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-th-border-subtle">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setPlayingVideo(video)}
                    className="flex-1"
                  >
                    <Play className="w-3 h-3" fill="currentColor" />
                    Watch
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyVideoLink(video)}
                    title="Copy video link"
                  >
                    {copiedId === video.id ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedId === video.id ? 'Copied' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-surface-primary rounded-xl border border-th-border divide-y divide-th-border-subtle">
          {filtered.map(video => (
            <div key={video.id} className="flex gap-4 p-4 hover:bg-surface-secondary/50 transition-colors group">
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => setPlayingVideo(video)}
                className="relative w-48 flex-shrink-0 rounded-lg overflow-hidden"
                style={{ aspectRatio: '16/9' }}
                aria-label={`Play ${video.title}`}
              >
                <img src={getThumbnail(video)} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
                  </div>
                </div>
                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded font-mono">
                    {video.duration}
                  </span>
                )}
              </button>
              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      video.category === 'training'
                        ? 'bg-[#0A4E8E]/10 text-[#0A4E8E]'
                        : 'bg-[#A4CC43]/20 text-[#0E2D41]'
                    }`}>
                      {video.category === 'training' ? <GraduationCap className="w-2.5 h-2.5" /> : <Megaphone className="w-2.5 h-2.5" />}
                      {video.category === 'training' ? 'Advisor Training' : 'Share with Members'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-th-text-primary text-sm">{video.title}</h3>
                  <p className="mt-1 text-xs text-th-text-tertiary leading-relaxed">{video.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setPlayingVideo(video)}
                  >
                    <Play className="w-3 h-3" fill="currentColor" />
                    Watch
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyVideoLink(video)}
                  >
                    {copiedId === video.id ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedId === video.id ? 'Copied' : 'Copy Link'}
                  </Button>
                  {video.tags.map(tag => (
                    <span key={tag} className="hidden md:inline px-1.5 py-0.5 bg-surface-tertiary text-th-text-tertiary text-[10px] rounded font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video player modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold text-lg">{playingVideo.title}</h3>
                <p className="text-white/50 text-sm mt-0.5">{playingVideo.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPlayingVideo(null)}
                className="min-h-[44px] min-w-[44px] text-white/60 hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://player.vimeo.com/video/${playingVideo.vimeo_id}${playingVideo.vimeo_hash ? '?h=' + playingVideo.vimeo_hash + '&' : '?'}autoplay=1&dnt=1`}
                title={playingVideo.title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                playingVideo.category === 'training'
                  ? 'bg-white/10 text-white'
                  : 'bg-[#A4CC43]/20 text-[#A4CC43]'
              }`}>
                {playingVideo.category === 'training' ? <GraduationCap className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                {playingVideo.category === 'training' ? 'Advisor Training' : 'Share with Members'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVideoLink(playingVideo)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20"
              >
                {copiedId === playingVideo.id ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedId === playingVideo.id ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
