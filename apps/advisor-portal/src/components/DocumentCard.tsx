import {
  FileText,
  ExternalLink,
  Presentation,
  FileType,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';
import type { SOPDocument } from '@mpbhealth/advisor-core';
import SafeImage from './SafeImage';

interface DocumentCardProps {
  doc: SOPDocument;
  onClick: () => void;
}

/**
 * DocumentCard - Resource Center–style card for a SOP document.
 * Renders a 16:9 thumbnail (image when available, otherwise a colored
 * file-type icon block) above a title + description.
 */
export default function DocumentCard({ doc, onClick }: DocumentCardProps) {
  const hasImage = !!doc.image_url;
  const url = doc.file_url?.toLowerCase() || '';
  const isPPTX = url.match(/\.pptx?$/) !== null;
  const isXLSX = url.match(/\.xlsx?$/) !== null;
  const isPDF = url.endsWith('.pdf') === true;
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(doc.file_url || '');
  const isSharePointPresentation =
    (url.includes('sharepoint') || url.includes('onedrive')) &&
    (url.includes('/:p:/') || url.includes('%3ap%3a'));
  const isExternalLink = !!doc.file_url;

  // File-type styling for the icon-only thumbnail (no image_url).
  const FallbackIcon = isXLSX
    ? FileSpreadsheet
    : isPPTX || isSharePointPresentation
      ? Presentation
      : isPDF
        ? FileType
        : isImage
          ? ImageIcon
          : FileText;
  const fallbackTint = isXLSX
    ? 'bg-emerald-100 dark:bg-emerald-900/30'
    : 'bg-th-accent-100 dark:bg-th-accent-900/30';
  const fallbackIconColor = isXLSX
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-th-accent-600 dark:text-th-accent-400';

  // Action icon shown next to the title.
  const ActionIcon = isPPTX || isSharePointPresentation
    ? Presentation
    : isPDF
      ? FileType
      : isXLSX
        ? FileSpreadsheet
        : isImage
          ? ImageIcon
          : isExternalLink
            ? ExternalLink
            : null;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5 cursor-pointer text-left flex flex-col"
    >
      {hasImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-surface-tertiary">
          <SafeImage
            src={doc.image_url!}
            alt={doc.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: (doc.metadata?.image_position as string) || 'center top' }}
            fallbackClassName="w-full h-full flex items-center justify-center bg-surface-tertiary text-th-text-tertiary"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      ) : (
        <div
          className={`relative w-full aspect-[16/9] flex items-center justify-center ${fallbackTint}`}
          role="img"
          aria-label={doc.title}
        >
          <FallbackIcon className={`w-12 h-12 ${fallbackIconColor}`} />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
            {doc.title}
          </h3>
          {ActionIcon && (
            <ActionIcon className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0" />
          )}
        </div>
        {doc.description && (
          <p className="text-sm text-th-text-secondary leading-relaxed line-clamp-2">
            {doc.description}
          </p>
        )}
      </div>
    </div>
  );
}
