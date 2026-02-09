import { FileText, Eye, ExternalLink, Presentation, FileType } from 'lucide-react';
import type { SOPDocument } from '@mpbhealth/advisor-core';

interface DocumentCardProps {
  doc: SOPDocument;
  onClick: () => void;
}

/**
 * DocumentCard - A clean, responsive card component for displaying documents
 * Uses a simple structure with no complex flexbox/grid that could cause gaps
 */
export default function DocumentCard({ doc, onClick }: DocumentCardProps) {
  const hasImage = !!doc.image_url;
  const isPPTX = doc.file_url?.toLowerCase().match(/\.pptx?$/) !== null;
  const isPDF = doc.file_url?.toLowerCase().endsWith('.pdf') === true;
  const isExternalLink = !!doc.file_url;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
    >{/* No whitespace between elements */}{hasImage ? (
        <div
          className="document-card__thumbnail bg-surface-tertiary"
          style={{
            backgroundImage: `url(${doc.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: (doc.metadata?.image_position as string) || 'center top',
            backgroundRepeat: 'no-repeat',
          }}
          role="img"
          aria-label={doc.title}
        />
      ) : (
        <div className="document-card__content p-5 pb-0">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
            </div>
            <div className="text-right text-sm text-th-text-tertiary">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{doc.view_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}{/* No whitespace */}<div className={`document-card__content flex-1 flex flex-col ${hasImage ? 'p-5' : 'p-5 pt-4'}`}>
        <h3 className="font-semibold text-th-text-primary leading-snug">
          {doc.title}
        </h3>
        {doc.description && (
          <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
            {doc.description}
          </p>
        )}
        <div className="mt-auto" aria-hidden="true"></div>
        <div className="document-card__footer flex items-center justify-between pt-4 mt-4 border-t border-th-border-subtle">
          <span className="text-sm text-th-text-tertiary">{doc.category}</span>
          <span className="text-sm text-th-accent-600 font-medium flex items-center gap-1">
            {isPPTX ? (
              <>
                Preview <Presentation className="w-3.5 h-3.5" />
              </>
            ) : isPDF ? (
              <>
                Preview <FileType className="w-3.5 h-3.5" />
              </>
            ) : isExternalLink ? (
              <>
                Open <ExternalLink className="w-3.5 h-3.5" />
              </>
            ) : (
              'View →'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
