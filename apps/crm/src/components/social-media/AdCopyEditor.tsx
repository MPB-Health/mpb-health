import { Sparkles } from 'lucide-react';
import type { SocialPlatform } from './socialMediaTypes';
import { AD_COPY_LIMITS, SOCIAL_PLATFORMS } from './socialMediaTypes';

function charState(current: number, max: number): 'ok' | 'warn' | 'error' {
  if (max <= 0) return 'ok';
  if (current > max) return 'error';
  if (current > max * 0.9) return 'warn';
  return 'ok';
}

function countColor(state: 'ok' | 'warn' | 'error'): string {
  if (state === 'error') return 'text-red-500';
  if (state === 'warn') return 'text-amber-500';
  return 'text-th-text-tertiary';
}

export interface AdCopyEditorProps {
  platforms: SocialPlatform[];
  activePlatform: SocialPlatform;
  onActivePlatformChange: (p: SocialPlatform) => void;
  headline: string;
  primaryText: string;
  description: string;
  onHeadlineChange: (v: string) => void;
  onPrimaryTextChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

export function AdCopyEditor({
  platforms,
  activePlatform,
  onActivePlatformChange,
  headline,
  primaryText,
  description,
  onHeadlineChange,
  onPrimaryTextChange,
  onDescriptionChange,
}: AdCopyEditorProps) {
  const hMax = AD_COPY_LIMITS.headline[activePlatform];
  const pMax = AD_COPY_LIMITS.primary[activePlatform];
  const hState = charState(headline.length, hMax);
  const pState = charState(primaryText.length, pMax);

  const platformLabel = SOCIAL_PLATFORMS.find((x) => x.id === activePlatform)?.label ?? activePlatform;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-th-text-secondary">
          Character limits follow common {platformLabel} ad specs. Switch platform to see limits.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-th-accent-600 hover:text-th-accent-700 disabled:opacity-40"
          disabled
          title="Coming soon"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI copy suggestions
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => {
          const active = p === activePlatform;
          const label = SOCIAL_PLATFORMS.find((x) => x.id === p)?.label ?? p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onActivePlatformChange(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-tertiary text-th-text-secondary hover:bg-th-border'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-2">
          <label className="text-sm font-medium text-th-text-primary">Headline</label>
          {hMax > 0 ? (
            <span className={`text-xs tabular-nums ${countColor(hState)}`}>
              {headline.length} / {hMax}
            </span>
          ) : (
            <span className="text-xs text-th-text-tertiary">Optional on Instagram</span>
          )}
        </div>
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          maxLength={hMax > 0 ? hMax + 50 : undefined}
          className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder-th-text-tertiary focus:border-th-accent-500 focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          placeholder="Clear benefit in one line"
        />
        {hState === 'error' && hMax > 0 && (
          <p className="text-xs text-red-500">Shorten headline to fit {platformLabel}.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-2">
          <label className="text-sm font-medium text-th-text-primary">Primary text</label>
          <span className={`text-xs tabular-nums ${countColor(pState)}`}>
            {primaryText.length} / {pMax}
          </span>
        </div>
        <textarea
          value={primaryText}
          onChange={(e) => onPrimaryTextChange(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder-th-text-tertiary focus:border-th-accent-500 focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          placeholder="Explain the offer, proof points, and urgency."
        />
        {pState === 'error' && (
          <p className="text-xs text-red-500">Primary text exceeds recommended length for {platformLabel}.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Link description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder-th-text-tertiary focus:border-th-accent-500 focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          placeholder="Shown under headline on some placements"
        />
      </div>
    </div>
  );
}
