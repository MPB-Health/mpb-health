import { Calculator } from 'lucide-react';
import { QuoteResultsReturnedPanel } from '@mpbhealth/admin-core';

export default function QuoteResultsReturned() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-th-accent-600" />
          <h1 className="text-2xl font-bold text-th-text-primary">Quote Results Returned</h1>
        </div>
        <p className="text-sm text-th-text-tertiary mt-1 max-w-2xl">
          Tracks the homepage hero calculator: users who see compared plans, open the contact form, and submit a lead.
          Synced in real time with CRM and website admin.
        </p>
      </div>
      <QuoteResultsReturnedPanel />
    </div>
  );
}
