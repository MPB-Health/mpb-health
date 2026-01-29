import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface Pricing2026NoticeProps {
  pdfUrl?: string;
}

export function Pricing2026Notice({ pdfUrl = 'https://mpb.health/wp-content/uploads/2025/10/Secure-HSA.pdf' }: Pricing2026NoticeProps) {
  const currentDate = new Date();
  const displayDate = new Date('2025-12-01');

  const shouldDisplay = currentDate >= displayDate;

  if (!shouldDisplay) {
    return null;
  }

  return (
    <section className="py-8 bg-amber-50 border-y border-amber-200">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-700" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              IMPORTANT: 2026 Pricing Update
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed mb-4">
              Effective rates for start dates on or after January 1, 2026 will differ from the rates currently displayed in the cart. Please refer to the official price sheet below to confirm the correct rate by locating your Age Band and IUA.
            </p>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center"
              onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            >
              View 2026 Price Sheet (PDF)
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
