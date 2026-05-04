import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calculator } from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { QuoteResultsReturnedPanel } from '@mpbhealth/admin-core';

const QuoteResultsReturned: React.FC = () => (
  <AdminLayout activeView="crm-quote-results" onViewChange={() => {}}>
    <SEOHead title="Quote Results Returned | CRM | MPB Health Admin" description="Hero calculator funnel analytics" />
    <div className="p-6 max-w-7xl mx-auto">
      <AdminBreadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'CRM', href: '/admin/crm' },
          { label: 'Quote Results Returned', href: '/admin/crm/quote-results-returned' },
        ]}
      />
      <div className="flex items-center gap-4 mt-4 mb-6">
        <Link to="/admin/crm" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-neutral-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Quote Results Returned</h1>
            <p className="text-neutral-500 text-sm">
              Visitors who reached instant plan comparison on the homepage hero — vs contact form vs lead capture.
            </p>
          </div>
        </div>
      </div>
      <QuoteResultsReturnedPanel />
    </div>
  </AdminLayout>
);

export default QuoteResultsReturned;
