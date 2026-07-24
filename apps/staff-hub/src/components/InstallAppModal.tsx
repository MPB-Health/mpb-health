import { useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { HrPrimaryButton, HrSecondaryButton } from './hr/HrChrome';

export function InstallAppModal({
  open,
  canNativeInstall,
  needsManualInstall,
  manualSteps,
  busy = false,
  onInstall,
  onDismiss,
  onClose,
}: {
  open: boolean;
  canNativeInstall: boolean;
  needsManualInstall: boolean;
  manualSteps: string[];
  busy?: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="install-app-title">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--hr-ink)]/35 backdrop-blur-[2px]"
        aria-label="Close install dialog"
        onClick={onClose}
      />

      <div className="hub-install-modal relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-[color:var(--hr-elevated)] shadow-2xl ring-1 ring-[color:var(--hr-line)]">
        <div className="hub-install-modal-mesh" aria-hidden />

        <div className="relative z-[1] p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="hub-mark !h-11 !w-11 !rounded-xl !text-[0.7rem]" aria-hidden>
                MPB
              </div>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hr-muted)]">
                  Download app
                </p>
                <h2
                  id="install-app-title"
                  className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--hr-ink)]"
                >
                  Install Staff Hub
                </h2>
              </div>
            </div>
            <button type="button" className="hub-icon-btn" aria-label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[color:var(--hr-muted)]">
            Add Staff Hub to your desktop or home screen for faster clock-in, portals, and time off.
          </p>

          {needsManualInstall && !canNativeInstall ? (
            <ol className="mt-4 space-y-2.5 rounded-2xl bg-[color:var(--hr-mist)]/80 p-4">
              {manualSteps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-[color:var(--hr-ink)]">
                  <span className="font-mono text-[11px] font-semibold text-[color:var(--hr-accent)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[color:var(--hr-mist)]/80 px-4 py-3 text-sm text-[color:var(--hr-ink)]">
              <Share className="h-4 w-4 shrink-0 text-[color:var(--hr-accent)]" strokeWidth={1.75} />
              Opens as its own window, separate from your browser tabs.
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <HrSecondaryButton type="button" disabled={busy} onClick={onDismiss}>
              Not now
            </HrSecondaryButton>
            {canNativeInstall ? (
              <HrPrimaryButton
                type="button"
                disabled={busy}
                onClick={onInstall}
                className="inline-flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Install Staff Hub
              </HrPrimaryButton>
            ) : (
              <HrPrimaryButton type="button" disabled={busy} onClick={onClose}>
                Got it
              </HrPrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
