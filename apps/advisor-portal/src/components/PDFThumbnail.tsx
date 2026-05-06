import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this import to a hashed URL pointing at the worker file.
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker once per module load.
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface PDFThumbnailProps {
  url: string;
  alt?: string;
  /** Optional Tailwind classes applied to the wrapper. */
  className?: string;
}

/**
 * Renders the first page of a PDF onto a canvas as a thumbnail.
 * Falls back to a file icon if rendering fails.
 */
export default function PDFThumbnail({ url, alt, className }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url, isEvalSupported: false });

    (async () => {
      try {
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = wrapper.clientWidth || 320;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (targetWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (!cancelled) setState('error');
          return;
        }

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setState('ready');
      } catch (err) {
        console.warn('PDFThumbnail render failed:', err);
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      try {
        loadingTask.destroy();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  const showCanvas = state === 'ready';

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-surface-tertiary overflow-hidden ${
        showCanvas ? '' : 'flex items-center justify-center'
      } ${className || ''}`}
      style={!showCanvas ? { aspectRatio: '8.5 / 11' } : undefined}
      role="img"
      aria-label={alt}
    >
      {state === 'loading' && (
        <Loader2 className="w-6 h-6 text-th-text-tertiary animate-spin" />
      )}
      {state === 'error' && (
        <FileText className="w-10 h-10 text-th-text-tertiary" />
      )}
      <canvas
        ref={canvasRef}
        className={showCanvas ? 'block w-full h-auto' : 'hidden'}
      />
    </div>
  );
}
