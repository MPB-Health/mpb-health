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
            content="Reads the external membership Supabase project through the membership-analytics-proxy edge function, which verifies your admin role and runs read-only queries server-side."
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
