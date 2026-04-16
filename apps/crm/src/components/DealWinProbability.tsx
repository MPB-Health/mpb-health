import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WinProbabilityResult {
  deal_id: string;
  win_probability: number;
  health_score: number;
  confidence: 'low' | 'medium' | 'high';
  risk_signals: RiskSignal[];
  recommended_actions: RecommendedAction[];
  contributing_factors: ContributingFactor[];
  predicted_close_date: string | null;
  close_date_confidence_days: number;
  calculated_at: string;
}

interface RiskSignal {
  id: string;
  severity: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
}

interface RecommendedAction {
  id: string;
  label: string;
  description: string;
  icon_type: 'call' | 'email' | 'meeting' | 'proposal' | 'review' | 'generic';
  link?: string;
}

interface ContributingFactor {
  label: string;
  impact: number;
  direction: 'positive' | 'negative';
}

interface DealPredictionRow {
  deal_id: string;
  deal_name: string;
  win_probability: number;
  health_score: number;
  confidence: string;
  predicted_close_date: string | null;
  calculated_at: string;
}

interface DealWinProbabilityProps {
  dealId: string;
  dealName?: string;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function probColor(p: number): { stroke: string; text: string; bg: string } {
  if (p >= 70) return { stroke: '#10b981', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' };
  if (p >= 40) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
  return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
}

function healthColor(h: number): string {
  if (h >= 70) return 'bg-green-500';
  if (h >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function confidenceBadge(c: string): { label: string; cls: string } {
  switch (c) {
    case 'high':
      return { label: 'High Confidence', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'medium':
      return { label: 'Medium Confidence', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    default:
      return { label: 'Low Confidence', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
}

function actionIcon(type: string) {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'proposal': return Target;
    case 'review': return Shield;
    default: return Zap;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// SVG Gauge
// ---------------------------------------------------------------------------

function ProbabilityGauge({ value, size = 120 }: { value: number; size?: number }) {
  const strokeWidth = size > 80 ? 10 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const colors = probColor(value);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={cn('absolute font-bold tabular-nums', colors.text, size > 80 ? 'text-2xl' : 'text-sm')}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shimmer Skeleton
// ---------------------------------------------------------------------------

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-tertiary rounded', className)} />;
}

function FullSkeleton() {
  return (
    <div className="rounded-xl border border-th-border bg-surface-primary p-6 space-y-6">
      <div className="flex items-center gap-6">
        <Shimmer className="w-[120px] h-[120px] rounded-full" />
        <div className="flex-1 space-y-3">
          <Shimmer className="h-5 w-48" />
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-full" />
        </div>
      </div>
      <Shimmer className="h-24 w-full" />
      <Shimmer className="h-32 w-full" />
    </div>
  );
}

function CompactSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <Shimmer className="w-10 h-10 rounded-full" />
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-3 w-12" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DealWinProbability
// ---------------------------------------------------------------------------

export function DealWinProbability({ dealId, dealName, compact = false }: DealWinProbabilityProps) {
  const [data, setData] = useState<WinProbabilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const [risksOpen, setRisksOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [factorsOpen, setFactorsOpen] = useState(false);

  const fetchPrediction = useCallback(async () => {
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'crm_calculate_deal_win_probability',
        { p_deal_id: dealId },
      );

      if (!rpcErr && rpcData) {
        const result = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as unknown as WinProbabilityResult;
        setData(result);
        setError(null);
        return;
      }

      const { data: fallback, error: fallbackErr } = await supabase
        .from('crm_deal_predictions')
        .select('deal_id, win_probability, health_score, confidence, risk_signals, recommended_actions, contributing_factors, predicted_close_date, close_date_confidence_days, calculated_at')
        .eq('deal_id', dealId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackErr) throw fallbackErr;

      if (fallback) {
        setData({
          deal_id: fallback.deal_id,
          win_probability: fallback.win_probability ?? 50,
          health_score: fallback.health_score ?? 50,
          confidence: (fallback.confidence as WinProbabilityResult['confidence']) ?? 'low',
          risk_signals: (fallback.risk_signals as RiskSignal[]) ?? [],
          recommended_actions: (fallback.recommended_actions as RecommendedAction[]) ?? [],
          contributing_factors: (fallback.contributing_factors as ContributingFactor[]) ?? [],
          predicted_close_date: fallback.predicted_close_date ?? null,
          close_date_confidence_days: fallback.close_date_confidence_days ?? 0,
          calculated_at: fallback.calculated_at ?? new Date().toISOString(),
        });
        setError(null);
      } else {
        setData(null);
        setError('No prediction data available for this deal.');
      }
    } catch (err) {
      console.error('[DealWinProbability] fetch failed:', err);
      setError('Failed to load win probability.');
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  }, [dealId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPrediction();
  }, [fetchPrediction]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    toast.promise(fetchPrediction(), {
      loading: 'Recalculating...',
      success: 'Prediction updated',
      error: 'Recalculation failed',
    });
  };

  // ---- Loading ----
  if (loading) return compact ? <CompactSkeleton /> : <FullSkeleton />;

  // ---- Error ----
  if (error || !data) {
    return (
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 flex items-center gap-3 text-th-text-secondary">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <span className="text-sm">{error ?? 'No prediction available.'}</span>
        <button
          onClick={handleRecalculate}
          className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ---- Compact mode ----
  if (compact) {
    const colors = probColor(data.win_probability);
    const riskCount = data.risk_signals.filter((r) => r.severity === 'high').length;

    return (
      <div className="flex items-center gap-3">
        <ProbabilityGauge value={data.win_probability} size={40} />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', healthColor(data.health_score))} />
            <span className="text-xs text-th-text-secondary tabular-nums">{Math.round(data.health_score)}</span>
          </div>
          {riskCount > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="w-2.5 h-2.5" />
              {riskCount}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ---- Full mode ----
  const conf = confidenceBadge(data.confidence);
  const maxFactorAbs = Math.max(...data.contributing_factors.map((f) => Math.abs(f.impact)), 1);

  return (
    <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="text-sm font-semibold text-th-text-primary">Win Probability</h3>
          {dealName && <span className="text-xs text-th-text-tertiary">· {dealName}</span>}
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-tertiary hover:bg-surface-secondary text-th-text-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', recalculating && 'animate-spin')} />
          Recalculate
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Top section: gauge + health score */}
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <ProbabilityGauge value={data.win_probability} size={120} />
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', conf.cls)}>
              {conf.label}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {/* Health Score */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-th-text-secondary">Deal Health Score</span>
                <span className="text-sm font-bold tabular-nums text-th-text-primary">
                  {Math.round(data.health_score)}/100
                </span>
              </div>
              <div className="h-2.5 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', healthColor(data.health_score))}
                  style={{ width: `${Math.min(data.health_score, 100)}%` }}
                />
              </div>
            </div>

            {/* Predicted close date */}
            {data.predicted_close_date && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-secondary">
                <Calendar className="h-4 w-4 text-th-text-tertiary flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-th-text-primary">
                    Predicted Close: {formatDate(data.predicted_close_date)}
                  </p>
                  {data.close_date_confidence_days > 0 && (
                    <p className="text-[11px] text-th-text-tertiary">
                      ±{data.close_date_confidence_days} day window
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-th-text-tertiary">
              Last calculated {new Date(data.calculated_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Risk Signals */}
        {data.risk_signals.length > 0 && (
          <CollapsibleSection
            title="Risk Signals"
            count={data.risk_signals.length}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            open={risksOpen}
            onToggle={() => setRisksOpen((v) => !v)}
            accentClass="border-red-200 dark:border-red-800/60"
          >
            <div className="space-y-2">
              {data.risk_signals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    signal.severity === 'high'
                      ? 'border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-900/10'
                      : signal.severity === 'medium'
                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-900/10'
                        : 'border-th-border bg-surface-secondary',
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4 flex-shrink-0 mt-0.5',
                      signal.severity === 'high'
                        ? 'text-red-500'
                        : signal.severity === 'medium'
                          ? 'text-amber-500'
                          : 'text-gray-400',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-th-text-primary">{signal.label}</p>
                    <p className="text-xs text-th-text-secondary mt-0.5">{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Recommended Actions */}
        {data.recommended_actions.length > 0 && (
          <CollapsibleSection
            title="Recommended Actions"
            count={data.recommended_actions.length}
            icon={<Target className="h-4 w-4 text-blue-500" />}
            open={actionsOpen}
            onToggle={() => setActionsOpen((v) => !v)}
            accentClass="border-blue-200 dark:border-blue-800/60"
          >
            <div className="space-y-2">
              {data.recommended_actions.map((action) => {
                const Icon = actionIcon(action.icon_type);
                return (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-th-border bg-surface-secondary hover:bg-surface-tertiary transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-th-text-primary">{action.label}</p>
                      <p className="text-xs text-th-text-secondary mt-0.5">{action.description}</p>
                    </div>
                    {action.link ? (
                      <Link
                        to={action.link}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Link>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-th-text-tertiary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Contributing Factors */}
        {data.contributing_factors.length > 0 && (
          <CollapsibleSection
            title="Contributing Factors"
            count={data.contributing_factors.length}
            icon={<TrendingUp className="h-4 w-4 text-violet-500" />}
            open={factorsOpen}
            onToggle={() => setFactorsOpen((v) => !v)}
            accentClass="border-violet-200 dark:border-violet-800/60"
          >
            <div className="space-y-2.5">
              {data.contributing_factors
                .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                .map((factor, idx) => {
                  const pct = (Math.abs(factor.impact) / maxFactorAbs) * 100;
                  const isPositive = factor.direction === 'positive';

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-36 text-xs text-th-text-secondary text-right truncate flex-shrink-0">
                        {factor.label}
                      </span>
                      <div className="flex-1 flex items-center gap-0">
                        {/* Negative side */}
                        <div className="flex-1 flex justify-end">
                          {!isPositive && (
                            <div
                              className="h-3 bg-red-400 dark:bg-red-500 rounded-l transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                        {/* Center line */}
                        <div className="w-px h-5 bg-th-border flex-shrink-0" />
                        {/* Positive side */}
                        <div className="flex-1">
                          {isPositive && (
                            <div
                              className="h-3 bg-green-400 dark:bg-green-500 rounded-r transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'w-12 text-xs font-medium tabular-nums text-right flex-shrink-0',
                          isPositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {isPositive ? '+' : ''}{factor.impact}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  count,
  icon,
  open,
  onToggle,
  accentClass,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border overflow-hidden', accentClass || 'border-th-border')}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-th-text-primary">{title}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-surface-tertiary text-th-text-secondary">
            {count}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-th-text-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-th-text-tertiary" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ============================================================================
// DealWinProbabilityWidget (Dashboard)
// ============================================================================

export function DealWinProbabilityWidget() {
  const { activeOrgId } = useOrg();
  const [deals, setDeals] = useState<DealPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchDeals = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const { data, error } = await supabase
        .from('crm_deal_predictions')
        .select('deal_id, deal_name, win_probability, health_score, confidence, predicted_close_date, calculated_at')
        .eq('org_id', activeOrgId)
        .order('win_probability', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDeals((data as unknown as DealPredictionRow[]) ?? []);
    } catch (err) {
      console.error('[DealWinProbabilityWidget] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    setLoading(true);
    fetchDeals();
    intervalRef.current = setInterval(fetchDeals, 120_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchDeals]);

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="w-8 h-8 rounded-full" />
            <Shimmer className="h-3 flex-1" />
            <Shimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="p-4 text-center">
        <TrendingDown className="h-8 w-8 mx-auto mb-2 text-th-text-tertiary opacity-50" />
        <p className="text-sm text-th-text-secondary">No deal predictions yet</p>
        <p className="text-xs text-th-text-tertiary mt-1">Predictions appear as deals are scored</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-1">
        {deals.map((deal) => {
          const colors = probColor(deal.win_probability);
          const conf = confidenceBadge(deal.confidence);

          return (
            <Link
              key={deal.deal_id}
              to={`/deals/${deal.deal_id}`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-tertiary transition-colors group"
            >
              <ProbabilityGauge value={deal.win_probability} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {deal.deal_name || deal.deal_id.slice(0, 8)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full', healthColor(deal.health_score))} />
                    <span className="text-[10px] text-th-text-tertiary tabular-nums">
                      Health {Math.round(deal.health_score)}
                    </span>
                  </div>
                  {deal.predicted_close_date && (
                    <span className="text-[10px] text-th-text-tertiary">
                      Close {formatDate(deal.predicted_close_date)}
                    </span>
                  )}
                </div>
              </div>
              <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', conf.cls)}>
                {deal.confidence}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-th-border text-center">
        <Link
          to="/deals?view=predictions"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All Predictions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default DealWinProbability;
