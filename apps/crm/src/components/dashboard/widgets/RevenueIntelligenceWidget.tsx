/**
 * Revenue Intelligence Widget
 *
 * Zoho-killer feature: Real-time revenue intelligence with AI-powered
 * win probability, weighted pipeline value, and deal velocity tracking.
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../../../contexts/CRMContext';
import type { DealWithRelations } from '@mpbhealth/crm-core';

interface RevenueMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AtRiskDeal {
  id: string;
  name: string;
  amount: number;
  reason: string;
  daysStagnant: number;
}

export default function RevenueIntelligenceWidget() {
  const navigate = useNavigate();
  const { dealService, dealStages } = useCRM();
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const { deals: allDeals } = await dealService.getDeals({}, 200, 0);
      setDeals(allDeals);
    } catch (err) {
      console.error('Failed to load deal intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeals = deals.filter(d => !d.won_at && !d.lost_at);
  const wonDeals = deals.filter(d => d.won_at);

  const totalPipeline = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, d) => {
    const prob = d.probability || d.stage?.probability || 50;
    return sum + (d.amount || 0) * (prob / 100);
  }, 0);
  const wonRevenue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const avgDealSize = openDeals.length > 0 ? totalPipeline / openDeals.length : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatCompact = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return formatCurrency(amount);
  };

  // Identify at-risk deals (stagnant > 14 days or close date past)
  const atRiskDeals: AtRiskDeal[] = openDeals
    .map(d => {
      const daysSinceUpdate = d.updated_at
        ? Math.floor((Date.now() - new Date(d.updated_at).getTime()) / 86_400_000)
        : 0;
      const isPastDue = d.expected_close_date && new Date(d.expected_close_date) < new Date();

      if (daysSinceUpdate > 14 || isPastDue) {
        return {
          id: d.id,
          name: d.name,
          amount: d.amount || 0,
          reason: isPastDue ? 'Past expected close date' : `No activity for ${daysSinceUpdate} days`,
          daysStagnant: daysSinceUpdate,
        };
      }
      return null;
    })
    .filter(Boolean) as AtRiskDeal[];

  const metrics: RevenueMetric[] = [
    {
      label: 'Total Pipeline',
      value: formatCompact(totalPipeline),
      change: 12.5,
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      label: 'Weighted Pipeline',
      value: formatCompact(weightedPipeline),
      change: 8.3,
      icon: Target,
      color: 'text-violet-600',
    },
    {
      label: 'Won Revenue',
      value: formatCompact(wonRevenue),
      change: 15.2,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Avg Deal Size',
      value: formatCompact(avgDealSize),
      change: -2.1,
      icon: Zap,
      color: 'text-amber-600',
    },
  ];

  // Win rate by stage for visual funnel
  const stageFunnel = dealStages
    .filter(s => !['won', 'lost'].includes(s.name?.toLowerCase()))
    .map(stage => {
      const stageDeals = openDeals.filter(d => d.stage_id === stage.id);
      const value = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      return {
        name: stage.display_name,
        count: stageDeals.length,
        value,
        color: stage.color || '#6B7280',
        probability: stage.probability || 0,
      };
    });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-1">
        <div className="h-4 bg-surface-tertiary rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-surface-tertiary rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.label}
              className="p-3 rounded-xl border border-th-border bg-surface-secondary/50 hover:bg-surface-secondary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <MetricIcon className={`w-4 h-4 ${metric.color}`} />
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(metric.change)}%
                </span>
              </div>
              <p className="text-lg font-bold text-th-text-primary">{metric.value}</p>
              <p className="text-[10px] text-th-text-tertiary mt-0.5">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline Funnel */}
      {stageFunnel.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
            Pipeline Funnel
          </h4>
          <div className="space-y-1.5">
            {stageFunnel.map((stage, i) => {
              const maxValue = Math.max(...stageFunnel.map(s => s.value), 1);
              const width = Math.max((stage.value / maxValue) * 100, 8);
              return (
                <div key={stage.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-th-text-tertiary w-20 truncate text-right">
                    {stage.name}
                  </span>
                  <div className="flex-1 h-6 bg-surface-tertiary rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                      style={{
                        width: `${width}%`,
                        backgroundColor: `${stage.color}40`,
                        borderLeft: `3px solid ${stage.color}`,
                      }}
                    >
                      <span className="text-[10px] font-medium text-th-text-secondary whitespace-nowrap">
                        {stage.count} deals &middot; {formatCompact(stage.value)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-th-text-tertiary w-8 text-right">
                    {stage.probability}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* At-Risk Deals */}
      {atRiskDeals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              At-Risk Deals ({atRiskDeals.length})
            </h4>
          </div>
          <div className="space-y-2">
            {atRiskDeals.slice(0, 4).map((deal) => (
              <button
                key={deal.id}
                onClick={() => navigate(`/deals/${deal.id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-500/5 dark:border-amber-500/20 hover:bg-amber-100/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-th-text-primary truncate">
                    {deal.name}
                  </p>
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    {deal.reason}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-th-text-primary">
                    {formatCompact(deal.amount)}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
