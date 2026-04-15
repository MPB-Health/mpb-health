import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../../contexts/CRMContext';
import { PermissionGate } from '../PermissionGate';
import type { SocialPost } from '@mpbhealth/crm-core';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './socialMediaTypes';

export function SocialPostsPanel() {
  const { socialService } = useCRM();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('facebook');
  const [postDate, setPostDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [utmCampaign, setUtmCampaign] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { posts: list, error } = await socialService.getPosts();
    setPosts(list);
    setLoadError(error ?? null);
    setLoading(false);
  }, [socialService]);

  useEffect(() => {
    void load();
  }, [load]);

  const addPost = async () => {
    if (!title.trim()) return;
    const res = await socialService.createPost({
      title: title.trim(),
      platform,
      post_date: postDate,
      status: 'scheduled',
      utm_campaign: utmCampaign.trim() || null,
    });
    if (res.success) {
      toast.success('Post scheduled');
      setTitle('');
      setUtmCampaign('');
      void load();
    } else toast.error(res.error || 'Could not create post');
  };

  const remove = async (id: string) => {
    const res = await socialService.deletePost(id);
    if (res.success) {
      toast.success('Removed');
      void load();
    } else toast.error(res.error || 'Delete failed');
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-th-text-tertiary">Loading posts…</div>;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-th-text-secondary">
        <p className="font-medium text-th-text-primary">Could not load posts from the database</p>
        <p className="mt-2">{loadError}</p>
        <p className="mt-2 text-xs text-th-text-tertiary">
          Apply migration <code className="font-mono">20260415120000_crm_social_posts_and_connections.sql</code>, run
          migrations, then refresh this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-th-text-secondary max-w-2xl">
        Org-scoped post calendar stored in <code className="font-mono text-xs">crm_social_posts</code>. Link each row
        to a UTM campaign for attribution with quote forms and CRM campaigns.
      </p>
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-4">
        <h3 className="text-sm font-semibold text-th-text-primary">Add post</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title / hook"
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={postDate}
            onChange={(e) => setPostDate(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
          />
          <input
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            placeholder="utm_campaign (optional)"
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm sm:col-span-2"
          />
          <PermissionGate permission="campaigns.write">
            <button
              type="button"
              onClick={() => void addPost()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 sm:col-span-2"
            >
              <Plus className="w-4 h-4" />
              Save to calendar
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="rounded-xl border border-th-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-tertiary text-left text-xs uppercase text-th-text-tertiary">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">UTM</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-th-text-tertiary">
                  No posts yet — add your first scheduled piece.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-t border-th-border">
                  <td className="px-4 py-3 font-medium text-th-text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-th-text-secondary capitalize">{p.platform}</td>
                  <td className="px-4 py-3 text-th-text-secondary tabular-nums">{p.post_date}</td>
                  <td className="px-4 py-3 text-th-text-tertiary text-xs font-mono">{p.utm_campaign || '—'}</td>
                  <td className="px-4 py-3">
                    <PermissionGate permission="campaigns.write">
                      <button
                        type="button"
                        onClick={() => void remove(p.id)}
                        className="rounded p-1.5 text-th-text-tertiary hover:bg-red-500/10 hover:text-red-600"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
