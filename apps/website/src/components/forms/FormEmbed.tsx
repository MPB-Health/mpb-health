import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface FormEmbedProps {
  cognitoEmbed?: string;
  formTitle: string;
}

export function FormEmbed({ cognitoEmbed, formTitle }: FormEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formUrl, setFormUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadForm = useCallback(() => {
    if (!cognitoEmbed || !containerRef.current) return;

    setIsLoading(true);
    setHasError(false);

    const container = containerRef.current;
    
    container.innerHTML = '';
    container.style.width = '100%';
    container.style.minHeight = '680px';

    const scriptMatch = cognitoEmbed.match(
      /data-key=["']([^"']+)["'][^>]*data-form=["']([^"']+)["']|data-form=["']([^"']+)["'][^>]*data-key=["']([^"']+)["']/i
    );
    const iframeMatch = cognitoEmbed.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    const heightMatch = cognitoEmbed.match(/height=["']?(\d+)["']?/i);

    let url = '';
    if (iframeMatch?.[1]) {
      url = iframeMatch[1];
    } else if (scriptMatch) {
      const dataKey = scriptMatch[1] || scriptMatch[4];
      const dataForm = scriptMatch[2] || scriptMatch[3];
      if (dataKey && dataForm) {
        url = `https://www.cognitoforms.com/f/${dataKey}/${dataForm}`;
      }
    }

    if (!url) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = formTitle;
    iframe.allow = 'payment';
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.minWidth = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.display = 'block';
    iframe.style.border = '0';

    const initialHeight = heightMatch?.[1] ? parseInt(heightMatch[1], 10) : 1200;
    iframe.style.minHeight = `${initialHeight}px`;
    iframe.height = `${initialHeight}`;

    iframe.onload = () => {
      setIsLoading(false);
    };
    iframe.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    container.appendChild(iframe);
    setFormUrl(url);

    // Fallback timeout in case onload does not fire
    setTimeout(() => setIsLoading(false), 3000);
  }, [cognitoEmbed]);

  useEffect(() => {
    loadForm();

    const handleResize = (event: MessageEvent) => {
      if (event.data && event.data.height && containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          const height = parseInt(event.data.height, 10);
          if (height > 0) {
            iframe.style.height = `${height}px`;
          }
        }
      }
    };

    window.addEventListener('message', handleResize);

    return () => {
      window.removeEventListener('message', handleResize);
    };
  }, [loadForm]);

  if (!cognitoEmbed) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          Cognito Form Embed Pending
        </h3>
        <p className="text-neutral-600 mb-4 max-w-md mx-auto">
          The form embed code for <span className="font-semibold">{formTitle}</span> will be added soon.
        </p>
        <div className="bg-white rounded-lg p-4 border border-yellow-200 max-w-lg mx-auto">
          <p className="text-sm text-neutral-700 mb-2 font-medium">
            For administrators:
          </p>
          <p className="text-xs text-neutral-600 font-mono">
            Add the Cognito embed code in <span className="bg-yellow-100 px-1 rounded">src/config/forms.config.ts</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Integrated Header */}
      {formUrl && (
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{formTitle}</h3>
          <div className="flex items-center gap-2">
            {hasError && (
              <button
                onClick={loadForm}
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-200 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a4c8f] text-white text-sm font-semibold rounded-lg hover:bg-[#083d73] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in New Window</span>
              <span className="sm:hidden">Open</span>
            </a>
          </div>
        </div>
      )}
      
      {/* Form Container with Padding */}
      <div className="p-4 sm:p-6 lg:p-8 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-neutral-600">Loading form...</p>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="text-center p-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium mb-2">Form failed to load</p>
              <p className="text-sm text-neutral-500 mb-4">Please try refreshing or use the button above to open in a new window.</p>
              <button
                onClick={loadForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className="cognito-form-container w-full"
          style={{ minHeight: '600px' }}
        />
      </div>
      
      {/* Help Footer */}
      {formUrl && (
        <div className="px-6 sm:px-8 py-4 bg-blue-50/50 border-t border-blue-100">
          <p className="text-sm text-gray-600 text-center sm:text-left">
            <strong className="text-gray-700">Having trouble viewing the form?</strong>{' '}
            Click "Open in New Window" above to access it directly.
          </p>
        </div>
      )}
    </div>
  );
}
