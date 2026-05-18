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

/** Teardown / StrictMode double-mount — not a user-visible failure. */
function isBenignPdfJsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /worker was destroyed|rendering cancelled|transport destroyed|loading task|getDocument.*destroy/i.test(
    msg,
  );
}

interface PDFThumbnailProps {
  url: string;
  alt?: string;
  /** Optional Tailwind classes applied to the wrapper. */
  className?: string;
  /**
   * Aspect ratio of the wrapper while loading (and the visible crop
   * when `cover` is true). Use '8.5 / 11' for full portrait pages or
   * '16 / 9' for compact landscape thumbnails.
   * @default '8.5 / 11'
   */
  aspectRatio?: string;
  /**
   * When true, the rendered PDF page is anchored to the top of the
   * wrapper and clipped by overflow, giving a "cover" / compact look.
   * Useful for tile-style cards.
   * @default false
   */
  cover?: boolean;
}

/**
 * Renders the first page of a PDF onto a canvas as a thumbnail.
 * Falls back to a file icon if rendering fails.
 */
export default function PDFThumbnail({
  url,
  alt,
  className,
  aspectRatio = '8.5 / 11',
  cover = false,
}: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    /** Must cancel before `loadingTask.destroy()` or the worker tears down mid-render (React StrictMode). */
    let activeRender: { cancel(): void } | null = null;
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

        const renderTask = page.render({ canvasContext: ctx, viewport });
        activeRender = renderTask;
        try {
          await renderTask.promise;
        } finally {
          if (activeRender === renderTask) activeRender = null;
        }
        if (!cancelled) setState('ready');
      } catch (err) {
        if (cancelled || isBenignPdfJsError(err)) return;
        console.warn('PDFThumbnail render failed:', err);
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      try {
        activeRender?.cancel();
      } catch {
        /* noop */
      }
      activeRender = null;
      try {
        loadingTask.destroy();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  const showCanvas = state === 'ready';
  // In `cover` mode the wrapper always has a fixed aspect ratio and the
  // canvas overflows below the visible area, mimicking object-fit: cover.
  // Otherwise the wrapper only enforces the aspect ratio while loading and
  // collapses to the canvas height once ready.
  const wrapperStyle: React.CSSProperties | undefined =
    cover || !showCanvas ? { aspectRatio } : undefined;

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-surface-tertiary overflow-hidden ${
        showCanvas && !cover ? '' : 'flex items-center justify-center'
      } ${className || ''}`}
      style={wrapperStyle}
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
        className={
          showCanvas
            ? cover
              ? 'absolute top-0 left-0 block w-full h-auto'
              : 'block w-full h-auto'
            : 'hidden'
        }
      />
    </div>
  );
}
