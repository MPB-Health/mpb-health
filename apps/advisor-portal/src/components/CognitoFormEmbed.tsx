import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import { formsService, type AdvisorForm } from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';

function resolveEmbedUrl(form: AdvisorForm): string | null {
  const raw = form.cognito_embed?.trim() || form.embed_url?.trim() || '';
  if (!raw) return null;

  if (raw.includes('<')) {
    const match = raw.match(/src="(https:\/\/[^"]*cognitoforms\.com[^"]+)"/i);
    if (match?.[1]) return match[1];
  }

  if (raw.startsWith('http')) return raw;
  return null;
}

interface CognitoFormEmbedProps {
  form: AdvisorForm;
  className?: string;
}

export default function CognitoFormEmbed({ form, className = '' }: CognitoFormEmbedProps) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const embedHtml = form.cognito_embed?.trim() ?? '';
  const embedUrl = useMemo(() => resolveEmbedUrl(form) ?? formsService.getEmbedUrl(form), [form]);
  const hasHtmlEmbed = embedHtml.includes('<');

  if (!hasHtmlEmbed && !embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-sm text-th-text-secondary">This form could not be loaded in the portal.</p>
      </div>
    );
  }

  if (iframeFailed || !hasHtmlEmbed) {
    if (!embedUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <p className="text-sm text-th-text-secondary">This form could not be loaded in the portal.</p>
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full min-h-0 ${className}`}>
        {iframeFailed && (
          <div className="flex-shrink-0 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-100">
            The embedded form did not load. Open it in a new tab to continue.
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full flex-1 min-h-0 border-0"
          title={form.label || form.name || 'Form'}
          allow="payment; fullscreen"
          loading="lazy"
          onError={() => setIframeFailed(true)}
        />
        <div className="flex-shrink-0 p-3 border-t border-th-border-subtle flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open form in new tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full min-h-0 ${className} [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0`}
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(embedHtml, {
          ADD_TAGS: ['iframe', 'script'],
          ADD_ATTR: ['src', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'scrolling', 'data-key', 'data-form', 'height', 'style'],
        }),
      }}
    />
  );
}
