import { useEffect, useCallback, useMemo } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

/**
 * Modal component for previewing documents (PPTX, PDF, etc.).
 * PDFs are embedded directly; Office files use Microsoft Office Online Viewer.
 */
export default function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
}: DocumentPreviewModalProps) {
  // Detect file type. PDFs: embed directly (Google Docs Viewer often blocks third-party URLs).
  const { viewerUrl, isPDF } = useMemo(() => {
    const lowerUrl = fileUrl.toLowerCase();
    const isPDFFile = lowerUrl.endsWith('.pdf');

    if (isPDFFile) {
      return {
        viewerUrl: fileUrl,
        isPDF: true,
      };
    } else {
      // Use Microsoft Office Online viewer for Office files (PPTX, DOCX, XLSX)
      return {
        viewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`,
        isPDF: false,
      };
    }
  }, [fileUrl]);

  // Handle escape key to close modal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOpenDocument = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[90vh] mx-4 bg-surface-primary rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border bg-surface-secondary">
          <h2 className="text-lg font-semibold text-th-text-primary truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-primary transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Container */}
        <div className="flex-1 relative bg-surface-tertiary">
          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-th-accent-500 animate-spin" />
          </div>

          <iframe
            src={viewerUrl}
            title={`Preview: ${title}`}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-th-border bg-surface-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-th-border text-th-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleOpenDocument}
            className="px-4 py-2 rounded-lg bg-th-accent-600 text-white hover:bg-th-accent-700 transition-colors flex items-center gap-2"
          >
            <span>Open Full Document</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
