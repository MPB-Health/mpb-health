import { useState } from 'react';
import { Compass, FileType } from 'lucide-react';
import PDFThumbnail from '../components/PDFThumbnail';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

interface OverviewCard {
  title: string;
  description: string;
  fileUrl: string;
}

const STORAGE_BASE =
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents';

const CARDS: OverviewCard[] = [
  {
    title: 'Premium HSA Membership Overview',
    description:
      'Highlights of the Premium HSA membership — benefits, sharing details, and what members can expect.',
    fileUrl: `${STORAGE_BASE}/Premium%20HSA%20Membership%20Overview.pdf`,
  },
  {
    title: 'Premium Care Membership Overview',
    description:
      'Highlights of the Premium Care membership — benefits, sharing details, and what members can expect.',
    fileUrl: `${STORAGE_BASE}/Premium%20Care%20Membership%20Overview.pdf`,
  },
];

export default function Overview() {
  const [previewCard, setPreviewCard] = useState<OverviewCard | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-th-accent-100 dark:bg-th-accent-900/30">
          <Compass className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Overview</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            A quick tour of everything available in the advisor portal
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {CARDS.map((card) => (
          <button
            key={card.fileUrl}
            type="button"
            onClick={() => setPreviewCard(card)}
            className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col text-left"
          >
            <PDFThumbnail
              url={card.fileUrl}
              alt={`${card.title} — first page preview`}
            />
            <div className="document-card__content flex-1 flex flex-col p-5">
              <h3 className="font-semibold text-th-text-primary leading-snug">
                {card.title}
              </h3>
              <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                {card.description}
              </p>
              <div className="mt-auto" aria-hidden="true" />
              <div className="document-card__footer flex items-center justify-between pt-3.5 mt-[14px] border-t border-th-border-subtle">
                <span className="text-sm text-th-text-tertiary">PDF</span>
                <span className="text-sm text-th-accent-600 font-medium flex items-center gap-1">
                  Preview <FileType className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <DocumentPreviewModal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        title={previewCard?.title || ''}
        fileUrl={previewCard?.fileUrl || ''}
      />
    </div>
  );
}
