import { InfoTip } from '@mpbhealth/ui';
import MembershipSalesAnalyticsPanel from './membership-sales/MembershipSalesAnalyticsPanel';

export default function MembershipSalesAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-th-text-primary">Membership &amp; Sales Analytics</h1>
          <InfoTip
            size="md"
            content="Connects to the external Supabase project set in VITE_MEMBERSHIP_ANALYTICS_SUPABASE_URL. Uses the anon key in the browser; ensure RLS allows reads for views and RPCs you rely on."
          />
        </div>
        <p className="text-sm text-th-text-tertiary mt-1">
          Sales metrics, churn, predictive models, and advisor views from the membership database
        </p>
      </div>
      <MembershipSalesAnalyticsPanel />
    </div>
  );
}
