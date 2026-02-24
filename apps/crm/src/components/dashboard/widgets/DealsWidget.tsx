// ============================================================================
// Deals Widget
// Shows deal statistics and recent deals
// ============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import { createDealService, type DealWithRelations } from '@mpbhealth/crm-core/deals';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Deals Widget Component
// ============================================================================

const dealService = createDealService(supabase);

export default function DealsWidget({ config, size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [stats, setStats] = useState({ total: 0, totalValue: 0, wonValue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const showClosedDeals = config.showClosedDeals === true;
  const limit = (config.limit as number) || 5;

  useEffect(() => {
    if (activeOrgId) {
      loadDeals();
    }
  }, [activeOrgId, showClosedDeals]);

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      // getDeals returns { deals, total }
      const result = await dealService.getDeals({});
      const allDeals = result.deals || [];

      // Set recent deals (limited)
      setDeals(allDeals.slice(0, limit));

      // Calculate stats
      const total = result.total || allDeals.length;
      const totalValue = allDeals.reduce((sum: number, d: DealWithRelations) => sum + (d.amount || 0), 0);
      const wonValue = allDeals
        .filter((d: DealWithRelations) => d.stage?.is_won_stage === true)
        .reduce((sum: number, d: DealWithRelations) => sum + (d.amount || 0), 0);

      setStats({ total, totalValue, wonValue });
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b dark:border-gray-700">
        <StatCard
          icon={Briefcase}
          label="Total Deals"
          value={stats.total.toString()}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={formatCurrency(stats.totalValue)}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Won Value"
          value={formatCurrency(stats.wonValue)}
          color="green"
        />
      </div>

      {/* Recent Deals */}
      {deals.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No deals yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              to={`/deals/${deal.id}`}
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{deal.name}</p>
                <p className="text-xs text-gray-500">{deal.stage?.display_name || 'No stage'}</p>
              </div>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(deal.amount || 0)}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/deals"
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t dark:border-gray-700 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all deals
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: typeof Briefcase;
  label: string;
  value: string;
  color: 'blue' | 'green';
}

const COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30',
};

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="text-center">
      <div className={cn('inline-flex p-2 rounded-lg mb-2', COLOR_CLASSES[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}
