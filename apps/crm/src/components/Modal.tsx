import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (variant === 'slideOver') {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
      >
        <div
          ref={panelRef}
          className={`fixed inset-y-0 right-0 w-full ${slideOverSizes[size]} bg-white shadow-xl flex flex-col animate-slide-in-right`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
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
