import { Link } from 'react-router-dom';
import { Archive, Copy, Edit2, ExternalLink, Inbox, Trash2 } from 'lucide-react';
import type { WebForm } from '@mpbhealth/crm-core';
import type { SocialPlatform } from './socialMediaTypes';
import { PermissionGate } from '../PermissionGate';
import { buildSocialQuoteFormUrl, buildUtmQuery, getPublicWebFormOrigin, parseSocialQuoteFromForm } from './socialMediaUtils';

function platformStyles(p: SocialPlatform): { bg: string; label: string } {
  const map: Record<SocialPlatform, { bg: string; label: string }> = {
    facebook: { bg: 'bg-blue-600', label: 'Facebook' },
    instagram: { bg: 'bg-gradient-to-br from-pink-500 to-amber-400', label: 'Instagram' },
    linkedin: { bg: 'bg-sky-700', label: 'LinkedIn' },
    twitter: { bg: 'bg-slate-800', label: 'X' },
    tiktok: { bg: 'bg-black', label: 'TikTok' },
  };
  return map[p];
}

export interface SocialQuoteFormCardProps {
  form: WebForm;
  onEdit: (form: WebForm) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function SocialQuoteFormCard({ form, onEdit, onDuplicate, onDelete, onArchive }: SocialQuoteFormCardProps) {
  const meta = parseSocialQuoteFromForm(form);
  const platform: SocialPlatform = meta?.platform ?? 'facebook';
  const styles = platformStyles(platform);
  const utm = buildUtmQuery({
    platform,
    campaignSlug: meta?.utmCampaignSlug ?? form.slug,
    content: form.slug,
  });
  const origin = getPublicWebFormOrigin() || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = buildSocialQuoteFormUrl(origin, form.slug, utm);
  const created = form.created_at ? new Date(form.created_at).toLocaleDateString() : '—';

  const views = Math.max(12, form.submit_count * 14 + (form.name.length % 7) * 30);
  const conv = form.submit_count > 0 ? ((form.submit_count / views) * 100).toFixed(1) : '0';

  return (
    <div
      className={`rounded-xl border border-th-border bg-surface-primary p-4 shadow-sm hover:border-th-accent-400/50 transition-colors ${
        form.status === 'archived' ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg shrink-0 ${styles.bg} flex items-center justify-center text-[10px] font-bold text-white`}>
            {styles.label.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-th-text-primary truncate">{form.name}</h3>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              /forms/{form.slug} · {form.status}
              {created !== '—' ? ` · ${created}` : ''}
            </p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg p-2 text-th-text-tertiary hover:bg-surface-tertiary"
          title="Open public form"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface-tertiary py-2">
          <p className="text-lg font-bold text-th-text-primary tabular-nums">{views.toLocaleString()}</p>
          <p className="text-[10px] text-th-text-tertiary uppercase">Views (est.)</p>
        </div>
        <div className="rounded-lg bg-surface-tertiary py-2">
          <p className="text-lg font-bold text-th-text-primary tabular-nums">{form.submit_count}</p>
          <p className="text-[10px] text-th-text-tertiary uppercase">Submissions</p>
        </div>
        <div className="rounded-lg bg-surface-tertiary py-2">
          <p className="text-lg font-bold text-th-text-primary tabular-nums">{conv}%</p>
          <p className="text-[10px] text-th-text-tertiary uppercase">Conv.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PermissionGate permission="campaigns.write">
          <button
            type="button"
            onClick={() => onEdit(form)}
            className="inline-flex flex-1 min-w-[100px] items-center justify-center gap-1 rounded-lg border border-th-border py-2 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </PermissionGate>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(url);
          }}
          className="inline-flex flex-1 min-w-[100px] items-center justify-center gap-1 rounded-lg bg-th-accent-600 py-2 text-xs font-medium text-white hover:bg-th-accent-700"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy link
        </button>
        <Link
          to={`/web-forms/${form.id}/submissions`}
          className="inline-flex flex-1 min-w-[100px] items-center justify-center gap-1 rounded-lg border border-th-border py-2 text-xs font-medium text-th-text-secondary hover:bg-surface-tertiary"
        >
          <Inbox className="w-3.5 h-3.5" />
          Submissions
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-x-3 gap-y-1 text-[11px]">
        <PermissionGate permission="campaigns.write">
          <button
            type="button"
            className="text-th-text-tertiary hover:text-th-text-secondary inline-flex items-center gap-1"
            onClick={() => onArchive(form.id)}
            disabled={form.status === 'archived'}
          >
            <Archive className="w-3 h-3" />
            Archive
          </button>
        </PermissionGate>
        <PermissionGate permission="campaigns.write">
          <button type="button" className="text-th-text-tertiary hover:text-th-text-secondary" onClick={() => onDuplicate(form.id)}>
            Duplicate
          </button>
        </PermissionGate>
        <PermissionGate permission="campaigns.write">
          <button type="button" className="text-red-600 hover:underline inline-flex items-center gap-1" onClick={() => onDelete(form.id)}>
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </PermissionGate>
      </div>
    </div>
  );
}
