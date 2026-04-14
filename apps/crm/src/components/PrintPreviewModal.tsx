import { useRef } from 'react';
import { Modal } from './Modal';
import { Printer, Download, X } from 'lucide-react';

interface PrintPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function PrintPreviewModal({ open, onClose, title, children }: PrintPreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = contentRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; } th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
      th { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
      h1 { font-size: 20px; margin-bottom: 16px; } @media print { body { padding: 20px; } }</style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Print Preview — ${title}`} size="2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
        <div
          ref={contentRef}
          className="bg-white dark:bg-slate-900 border border-th-border/50 rounded-xl p-6 min-h-[300px] max-h-[500px] overflow-y-auto shadow-inner"
        >
          {children}
        </div>
      </div>
    </Modal>
  );
}
