import { Calculator } from 'lucide-react';
import { QuoteResultsReturnedPanel } from '@mpbhealth/admin-core';
import { GradientHeader } from '@mpbhealth/ui';

export default function QuoteResultsReturnedPage() {
  return (
    <div className="space-y-6 px-4 pb-8 max-w-7xl mx-auto">
      <GradientHeader
        title="Quote Results Returned"
        subtitle="Homepage hero calculator — results shown, contact form opens, and leads (live from Supabase)"
      />
      <div className="flex items-center gap-2 text-sm text-th-text-tertiary">
        <Calculator className="h-4 w-4" />
        Same metrics as Admin Portal & website admin; data is shared in real time.
      </div>
      <QuoteResultsReturnedPanel />
    </div>
  );
}
