import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { acquireBodyScrollLock } from '../utils/bodyScrollLock';
import { emitPortalDiagnostic } from '@mpbhealth/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'modal' | 'slideOver';
  children: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const slideOverSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'modal',
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    return acquireBodyScrollLock();
  }, [open]);

  // First-frame timing for modal shell (dev diagnostics + future APM).
  useEffect(() => {
    if (!open) return;
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const id = requestAnimationFrame(() => {
      const durationMs = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
      emitPortalDiagnostic({
        kind: 'modal_open',
        app: 'crm',
        durationMs,
        detail: title.slice(0, 80),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [open, title]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (variant === 'slideOver') {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      >
        <div
          ref={panelRef}
          className={`fixed inset-y-0 right-0 w-full ${slideOverSizes[size]} bg-surface-primary border border-th-border shadow-xl flex flex-col animate-slide-in-right`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-th-text-tertiary">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </div>
      </div>,
      document.body
    );
  }

  // Center modal variant
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`w-full ${sizeClasses[size]} bg-surface-primary border border-th-border rounded-xl shadow-xl animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-th-text-tertiary">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
