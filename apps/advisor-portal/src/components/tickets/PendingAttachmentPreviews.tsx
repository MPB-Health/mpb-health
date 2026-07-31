import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileFallback,
  ImageIcon,
  X,
  Paperclip,
} from 'lucide-react';

interface PendingAttachmentPreviewsProps {
  files: File[];
  onRemove?: (index: number) => void;
  className?: string;
  /** Compact strip for reply composers; default is the fuller new-ticket strip. */
  density?: 'comfortable' | 'compact';
  /**
   * `panel` — standalone card (attach zone).
   * `embedded` — flush footer inside the description editor (no nested card).
   */
  variant?: 'panel' | 'embedded';
}

const ACCENT_GRADIENT =
  'linear-gradient(90deg, rgb(var(--accent-600)), rgb(var(--accent-500)), rgb(var(--accent-400)))';
const ACCENT_CTA =
  'linear-gradient(135deg, rgb(var(--accent-600)), rgb(var(--accent-500)))';
const ACCENT_VERTICAL =
  'linear-gradient(180deg, rgb(var(--accent-500)), rgb(var(--accent-700)))';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return 'FILE';
  return name.slice(dot + 1).toUpperCase().slice(0, 5);
}

function NonImageGlyph({ file }: { file: File }) {
  const type = file.type;
  const name = file.name.toLowerCase();
  if (type.includes('sheet') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return <FileSpreadsheet size={20} strokeWidth={1.75} aria-hidden />;
  }
  if (type.includes('zip') || type.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) {
    return <FileArchive size={20} strokeWidth={1.75} aria-hidden />;
  }
  if (
    type.includes('pdf') ||
    type.includes('text') ||
    type.includes('word') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return <FileText size={20} strokeWidth={1.75} aria-hidden />;
  }
  return <FileFallback size={20} strokeWidth={1.75} aria-hidden />;
}

/**
 * Pasted / selected attachment filmstrip — contact-sheet image thumbs + file chips.
 * Ported from ITSTS PendingAttachmentPreviews; accent tokens use advisor blue.
 */
export function PendingAttachmentPreviews({
  files,
  onRemove,
  className = '',
  density = 'comfortable',
  variant = 'panel',
}: PendingAttachmentPreviewsProps) {
  const [urls, setUrls] = useState<string[]>([]);

  const signature = useMemo(
    () => files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join('|'),
    [files],
  );

  useEffect(() => {
    const next = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setUrls(next);
    return () => {
      for (const url of next) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [signature, files]);

  if (files.length === 0) return null;

  const compact = density === 'compact';
  const embedded = variant === 'embedded';
  const imgH = compact ? 'h-[4.25rem]' : 'h-[6.5rem]';
  const imgW = compact ? 'w-[6.75rem] sm:w-[7.5rem]' : 'w-[7.75rem] sm:w-[9rem]';

  return (
    <div
      className={[
        'pending-attach-strip relative',
        embedded
          ? 'border-t border-neutral-200/90 dark:border-neutral-700/80'
          : 'overflow-hidden rounded-xl border border-neutral-200/90 shadow-sm ring-1 ring-black/[0.03] dark:border-neutral-600 dark:ring-white/5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={`${files.length} attachment${files.length === 1 ? '' : 's'} ready to send`}
    >
      {!embedded ? (
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: ACCENT_GRADIENT }} aria-hidden />
      ) : (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: ACCENT_GRADIENT, opacity: 0.85 }}
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background: embedded
            ? 'linear-gradient(180deg, rgb(248 250 252 / 0.98), rgb(248 250 252 / 0.65))'
            : 'radial-gradient(120% 80% at 0% 0%, rgb(var(--accent-500) / 0.08), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgb(var(--accent-400) / 0.07), transparent 50%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background: embedded
            ? 'linear-gradient(180deg, rgb(10 10 12 / 0.55), rgb(10 10 12 / 0.2))'
            : 'radial-gradient(120% 80% at 0% 0%, rgb(var(--accent-500) / 0.14), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgb(var(--accent-400) / 0.1), transparent 50%)',
        }}
        aria-hidden
      />

      <div className={`relative ${compact ? 'px-3 py-2.5' : 'px-3.5 py-3'}`}>
        <div className={`mb-2.5 flex items-end justify-between gap-3 ${compact ? 'mb-2' : ''}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
              style={{ background: ACCENT_CTA }}
            >
              <Paperclip size={14} strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                Attached
              </p>
              <p className="truncate text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-50">
                {files.length} file{files.length === 1 ? '' : 's'} go with this message
              </p>
            </div>
          </div>
          <span className="mb-0.5 shrink-0 rounded-md border border-neutral-200/90 bg-white/80 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-neutral-600 backdrop-blur dark:border-neutral-600 dark:bg-neutral-900/70 dark:text-neutral-300">
            {String(files.length).padStart(2, '0')}
          </span>
        </div>

        <ul
          className={[
            'm-0 flex list-none gap-2.5 p-0',
            compact
              ? '-mx-0.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:thin]'
              : 'flex-wrap',
          ].join(' ')}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {files.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              const previewUrl = urls[index];
              const key = `${file.name}-${file.size}-${file.lastModified}-${index}`;

              return (
                <motion.li
                  key={key}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.035, 0.18),
                    ease: [0.32, 0.72, 0, 1],
                  }}
                  className={`group relative ${compact ? 'shrink-0' : ''}`}
                >
                  {isImage && previewUrl ? (
                    <div
                      className={`relative overflow-hidden rounded-lg border border-neutral-900/10 bg-neutral-950 shadow-sm dark:border-white/10 ${imgH} ${imgW}`}
                    >
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.045]"
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-1.5 pt-9"
                        aria-hidden
                      >
                        <p className="truncate text-[10px] font-medium tracking-wide text-white/95">
                          {file.name}
                        </p>
                        <p className="font-mono text-[9px] tabular-nums text-white/60">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-[2px]">
                        <ImageIcon size={10} aria-hidden />
                        Img
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex ${compact ? 'w-[10rem]' : 'w-[11.25rem]'} items-stretch overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-900`}
                    >
                      <div
                        className="flex w-10 shrink-0 items-center justify-center text-white"
                        style={{ background: ACCENT_VERTICAL }}
                        aria-hidden
                      >
                        <NonImageGlyph file={file} />
                      </div>
                      <div className="min-w-0 flex-1 px-2.5 py-2">
                        <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {file.name}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded bg-neutral-100 px-1 py-px font-mono text-[9px] font-bold tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {fileExt(file.name)}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md opacity-100 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={12} strokeWidth={2.5} aria-hidden />
                    </button>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
