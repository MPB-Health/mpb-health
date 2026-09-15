import { AlertCircle } from 'lucide-react';
import { isMembershipAnalyticsConfigured } from '@/lib/membershipAnalyticsClient';
import { MembershipSalesAnalyticsBody } from './MembershipSalesAnalyticsBody';

export default function MembershipSalesAnalyticsPanel() {
  if (!isMembershipAnalyticsConfigured) {
    return (
      <div className="card-premium p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-th-text-primary font-medium">Membership &amp; sales analytics is not configured</p>
        <p className="text-sm text-th-text-tertiary mt-1">
          Set <code className="text-xs font-mono">VITE_SUPABASE_URL</code>, then deploy
          membership-analytics-proxy with these secrets on the primary project:
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {['MOBILE_APP_SUPABASE_URL', 'MOBILE_APP_SERVICE_ROLE_KEY'].map((name) => (
            <code
              key={name}
              className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-th-text-secondary"
            >
              {name}
            </code>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-th-border bg-surface-secondary/50 px-4 py-3 text-sm text-th-text-secondary">
        Read-only data from the membership / sales Supabase project, proxied server-side, not the main admin database.
      </div>
      <MembershipSalesAnalyticsBody />
    </div>
  );
}
