import { ExternalLink, Heart, MessageCircle, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react';
import type { SocialPlatform } from './socialMediaTypes';
import { AD_CTA_LABELS, type AdCtaType } from './socialMediaTypes';

export interface AdPreviewCardProps {
  platform: SocialPlatform;
  headline: string;
  primaryText: string;
  description?: string;
  cta: AdCtaType;
  pageName?: string;
}

export function AdPreviewCard({
  platform,
  headline,
  primaryText,
  description,
  cta,
  pageName = 'ARYX',
}: AdPreviewCardProps) {
  const ctaLabel = AD_CTA_LABELS[cta];
  const imageBlock = (
    <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs text-th-text-tertiary">
      1200×628 recommended
    </div>
  );

  if (platform === 'instagram') {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-th-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-th-border px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-th-text-primary truncate">{pageName}</p>
            <p className="text-[10px] text-th-text-tertiary">Sponsored</p>
          </div>
          <MoreHorizontal className="w-4 h-4 text-th-text-tertiary shrink-0" />
        </div>
        <div className="aspect-square w-full bg-gradient-to-br from-violet-200 to-fuchsia-200 dark:from-violet-900 dark:to-fuchsia-900 flex items-center justify-center text-xs text-th-text-tertiary">
          1080×1080 feed
        </div>
        <div className="space-y-1 p-3">
          <p className="text-xs text-th-text-secondary line-clamp-4 whitespace-pre-wrap">{primaryText || 'Caption'}</p>
          <button
            type="button"
            className="mt-2 w-full rounded-md bg-th-accent-600 py-2 text-xs font-semibold text-white"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    );
  }

  if (platform === 'linkedin') {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-th-border bg-surface-primary shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 p-3 border-b border-th-border">
          <div className="h-12 w-12 rounded bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            MPB
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-th-text-primary">{pageName}</p>
            <p className="text-xs text-th-text-tertiary">Promoted</p>
          </div>
        </div>
        <p className="px-3 pt-2 text-sm text-th-text-secondary line-clamp-3 whitespace-pre-wrap">{primaryText}</p>
        {imageBlock}
        <div className="p-3 border-t border-th-border bg-surface-tertiary">
          <p className="text-xs font-semibold text-th-text-primary line-clamp-1">{headline || 'Headline'}</p>
          {description ? (
            <p className="text-xs text-th-text-tertiary mt-0.5 line-clamp-1">{description}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-th-text-tertiary">mpbhealth.com</span>
            <button
              type="button"
              className="rounded-full border border-th-accent-600 px-4 py-1.5 text-xs font-semibold text-th-accent-600"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'twitter') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-th-border bg-surface-primary p-3 shadow-sm">
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm font-bold text-th-text-primary">{pageName}</span>
              <span className="text-xs text-th-text-tertiary">@mpbhealth · Promoted</span>
            </div>
            <p className="mt-1 text-sm text-th-text-secondary whitespace-pre-wrap">{primaryText}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-th-border">{imageBlock}</div>
            <div className="mt-2 flex items-center justify-between text-th-text-tertiary">
              <MessageCircle className="w-4 h-4" />
              <Share2 className="w-4 h-4" />
              <Heart className="w-4 h-4" />
              <ExternalLink className="w-4 h-4" />
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-th-text-primary py-2 text-sm font-bold text-white dark:bg-white dark:text-black"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className="mx-auto max-w-xs rounded-xl border border-th-border bg-black text-white overflow-hidden shadow-lg">
        <div className="aspect-[9/16] bg-gradient-to-b from-cyan-900 to-purple-900 flex flex-col justify-end p-3">
          <p className="text-xs line-clamp-3 mb-2">{primaryText}</p>
          <button type="button" className="rounded-md bg-white text-black text-xs font-bold py-2">
            {ctaLabel}
          </button>
        </div>
      </div>
    );
  }

  // facebook default
  return (
    <div className="mx-auto max-w-md rounded-lg border border-th-border bg-surface-primary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 p-2 border-b border-th-border">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-th-text-primary">{pageName}</p>
          <p className="text-xs text-th-text-tertiary">Sponsored · 🌎</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-th-text-tertiary shrink-0" />
      </div>
      <p className="px-3 py-2 text-sm text-th-text-secondary whitespace-pre-wrap line-clamp-4">{primaryText}</p>
      {imageBlock}
      <div className="p-3 border-t border-th-border space-y-2">
        <p className="text-xs text-th-text-tertiary uppercase tracking-wide">mpbhealth.com</p>
        <p className="text-sm font-semibold text-th-text-primary">{headline || 'Headline'}</p>
        {description ? <p className="text-xs text-th-text-secondary line-clamp-2">{description}</p> : null}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="flex-1 rounded-md bg-th-border py-2 text-xs font-semibold text-th-text-primary"
          >
            Like
          </button>
          <button
            type="button"
            className="flex-1 rounded-md bg-th-border py-2 text-xs font-semibold text-th-text-primary"
          >
            Comment
          </button>
          <button
            type="button"
            className="flex-1 rounded-md bg-th-border py-2 text-xs font-semibold text-th-text-primary"
          >
            Share
          </button>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-md bg-th-border py-2.5 text-sm font-semibold text-th-text-primary"
        >
          <ThumbsUp className="w-4 h-4" />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
