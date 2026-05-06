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
          <h1 className="text-2xl font-bold text-th-text-primary">Overviews</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            A quick tour of everything available in the advisor portal
          </p>
        </div>
      </div>

      {/* Cards grid — matches Resource Center sizing (1/2/3/4 cols, 16:9 thumbs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {CARDS.map((card) => (
          <button
            key={card.fileUrl}
            type="button"
            onClick={() => setPreviewCard(card)}
            className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5 text-left flex flex-col"
          >
            <PDFThumbnail
              url={card.fileUrl}
              alt={`${card.title} — first page preview`}
              aspectRatio="16 / 9"
              cover
            />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                  {card.title}
                </h3>
                <FileType className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0 ml-2" />
              </div>
              <p className="text-sm text-th-text-secondary leading-relaxed">
                {card.description}
              </p>
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
