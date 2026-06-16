import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { isAllowedEnrollmentEmbedUrl, isAllowedEnrollmentMessageOrigin } from '../../lib/planEnrollmentConfig';

interface EnrollmentEmbedProps {
  embedUrl: string;
  title: string;
}

const MAX_IFRAME_HEIGHT = 8000;

export function EnrollmentEmbed({ embedUrl, title }: EnrollmentEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const embedAllowed = isAllowedEnrollmentEmbedUrl(embedUrl);

  const loadEmbed = useCallback(() => {
    if (!containerRef.current || !embedAllowed) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = `${title} enrollment`;
    iframe.allow = 'payment';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'eager';
    iframe.style.width = '100%';
    iframe.style.minWidth = '100%';
    iframe.style.display = 'block';
    iframe.style.border = '0';
    iframe.style.minHeight = '1200px';
    iframe.height = '1200';

    iframe.onload = () => setIsLoading(false);
    iframe.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    container.appendChild(iframe);

    setTimeout(() => setIsLoading(false), 4000);
  }, [embedAllowed, embedUrl, title]);

  useEffect(() => {
    loadEmbed();

    const handleResize = (event: MessageEvent) => {
      if (!isAllowedEnrollmentMessageOrigin(event.origin)) return;
      if (!event.data?.height || !containerRef.current) return;
      const iframe = containerRef.current.querySelector('iframe');
      if (!iframe) return;
      const height = parseInt(String(event.data.height), 10);
      if (height > 0 && height <= MAX_IFRAME_HEIGHT) {
        iframe.style.height = `${height}px`;
      }
    };

    window.addEventListener('message', handleResize);
    return () => window.removeEventListener('message', handleResize);
  }, [loadEmbed]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {hasError && (
            <button
              type="button"
              onClick={loadEmbed}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Retry</span>
            </button>
          )}
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a4c8f] text-white text-sm font-semibold rounded-lg hover:bg-[#083d73] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open in New Window</span>
            <span className="sm:hidden">Open</span>
          </a>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-neutral-600">Loading secure enrollment…</p>
            </div>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="text-center p-6 max-w-md">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium mb-2">Enrollment form could not load</p>
              <p className="text-sm text-neutral-500 mb-4">
                Use &ldquo;Open in New Window&rdquo; above, or try again.
              </p>
              <button
                type="button"
                onClick={loadEmbed}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="enrollment-embed-container w-full" style={{ minHeight: '800px' }} />
      </div>

      <div className="px-6 sm:px-8 py-4 bg-blue-50/50 border-t border-blue-100">
        <p className="text-sm text-gray-600 text-center sm:text-left">
          <strong className="text-gray-700">Secure enrollment.</strong>{' '}
          Your application is processed through MPB Health&apos;s trusted enrollment partner.
          Need help? Call{' '}
          <a href="tel:8558164650" className="text-blue-700 font-semibold hover:underline">
            (855) 816-4650
          </a>
          .
        </p>
      </div>
    </div>
  );
}
