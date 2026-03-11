import { useEffect, useCallback, useMemo } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@mpbhealth/ui';

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
  // Detect file type to choose the right viewer
  const { viewerUrl, fileType } = useMemo(() => {
    const lowerUrl = fileUrl.toLowerCase();

    if (lowerUrl.endsWith('.pdf')) {
      return { viewerUrl: fileUrl, fileType: 'pdf' as const };
    } else if (
      lowerUrl.endsWith('.png') ||
      lowerUrl.endsWith('.jpg') ||
      lowerUrl.endsWith('.jpeg') ||
      lowerUrl.endsWith('.gif') ||
      lowerUrl.endsWith('.webp')
    ) {
      return { viewerUrl: fileUrl, fileType: 'image' as const };
    } else if (
      (lowerUrl.includes('sharepoint') || lowerUrl.includes('onedrive')) &&
      (lowerUrl.includes('/:p:/') || lowerUrl.includes('%3ap%3a'))
    ) {
      // SharePoint/OneDrive presentation links - use Office Online embed viewer
      return {
        viewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`,
        fileType: 'office' as const,
      };
    } else {
      // Use Microsoft Office Online viewer for Office files (PPTX, DOCX, XLSX)
      return {
        viewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`,
        fileType: 'office' as const,
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Document Container */}
        <div className="flex-1 relative bg-surface-tertiary">
          {fileType === 'image' ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 overflow-auto">
              <img
                src={viewerUrl}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-th-border bg-surface-secondary">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenDocument}
          >
            <span>Open Full Document</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
