import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Mail,
  Phone,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StageVelocity {
  stage_name: string;
  stage_display_name: string;
  stage_color: string;
  lead_count: number;
  avg_days_in_stage: number;
  median_days_in_stage: number;
  total_value: number;
  conversion_rate: number;
  stuck_count: number;
}

interface StuckLead {
  lead_id: string;
  first_name: string;
  last_name: string;
  primary_email: string;
  pipeline_stage: string;
  stage_display_name: string;
  days_in_stage: number;
  days_since_contact: number;
  premium_amount: number;
  lead_score: number;
  assigned_to_name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function daysColor(days: number): string {
  if (days < 5) return 'text-green-600 dark:text-green-400';
  if (days <= 10) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function daysBg(days: number): string {
  if (days < 5) return 'bg-green-500';
  if (days <= 10) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
}

// ============================================================================
// PipelineVelocityBar
// ============================================================================

export function PipelineVelocityBar() {
  const { activeOrgId } = useOrg();
  const [stages, setStages] = useState<StageVelocity[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchVelocity = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const { data, error } = await supabase.rpc('crm_lead_stage_velocity', {
        p_org_id: activeOrgId,
      });
      if (error) throw error;
      setStages((data as StageVelocity[]) ?? []);
    } catch (err) {
      console.error('[PipelineVelocityBar] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    setLoading(true);
    fetchVelocity();
    intervalRef.current = setInterval(fetchVelocity, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchVelocity]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-48 h-24 rounded-xl bg-surface-secondary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stages.length === 0) return null;

  const maxLeads = Math.max(...stages.map((s) => s.lead_count), 1);

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
      {stages.map((stage) => {
        const barPct = Math.max((stage.lead_count / maxLeads) * 100, 4);
        const avgDays = Number(stage.avg_days_in_stage) || 0;

        return (
          <div
            key={stage.stage_name}
            className="flex-shrink-0 min-w-[10rem] max-w-[14rem] flex-1 rounded-xl border border-th-border bg-surface-primary p-3 relative overflow-hidden group transition-shadow hover:shadow-md"
          >
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundColor: stage.stage_color || '#6366f1' }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-th-text-primary truncate">
                  {stage.stage_display_name}
                </span>
                {stage.stuck_count > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    {stage.stuck_count}
                  </span>
                )}
              </div>

              {/* Metrics row */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-lg font-bold tabular-nums ${daysColor(avgDays)}`}>
                  {avgDays.toFixed(1)}d
                </span>
                <span className="text-[10px] text-th-text-tertiary">avg</span>
                <span className="ml-auto text-xs text-th-text-secondary font-medium tabular-nums">
                  {stage.lead_count} {stage.lead_count === 1 ? 'lead' : 'leads'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${daysBg(avgDays)}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-th-text-tertiary">
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {Number(stage.conversion_rate).toFixed(0)}%
                </span>
                <span className="flex items-center gap-0.5">
                  <DollarSign className="w-2.5 h-2.5" />
                  {formatCurrency(Number(stage.total_value))}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// StuckLeadsAlert
// ============================================================================

interface StuckLeadsAlertProps {
  onNavigateToLead?: (leadId: string) => void;
}

const MAX_VISIBLE = 10;

export function StuckLeadsAlert({ onNavigateToLead }: StuckLeadsAlertProps) {
  const { activeOrgId } = useOrg();
  const [leads, setLeads] = useState<StuckLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchStuck = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const { data, error } = await supabase.rpc('crm_get_stuck_leads', {
        p_org_id: activeOrgId,
      });
      if (error) throw error;
      setLeads((data as StuckLead[]) ?? []);
    } catch (err) {
      console.error('[StuckLeadsAlert] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    setLoading(true);
    setDismissed(false);
    fetchStuck();
  }, [fetchStuck]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchStuck();
    toast.success('Stuck leads refreshed');
  };

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 animate-pulse">
        <div className="h-5 bg-surface-tertiary rounded w-56 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-tertiary rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Healthy pipeline state
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            No stuck leads! Pipeline is healthy.
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
            All leads have been contacted within the last 3 days or moved stages within 7 days.
          </p>
        </div>
      </div>
    );
  }

  const visibleLeads = leads.slice(0, MAX_VISIBLE);
  const hasMore = leads.length > MAX_VISIBLE;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {leads.length} Stuck Lead{leads.length !== 1 ? 's' : ''} Need{leads.length === 1 ? 's' : ''} Attention
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            className="p-1 rounded hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium"
          >
            Dismiss
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-amber-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </button>

      {/* Lead cards */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {visibleLeads.map((lead) => (
            <div
              key={lead.lead_id}
              className="flex items-center gap-3 rounded-lg border border-th-border bg-surface-primary p-3 hover:shadow-sm transition-shadow"
            >
              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/leads/${lead.lead_id}`}
                    onClick={() => onNavigateToLead?.(lead.lead_id)}
                    className="text-sm font-medium text-th-text-primary hover:text-th-accent-600 truncate"
                  >
                    {lead.first_name} {lead.last_name}
                  </Link>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-tertiary text-th-text-secondary"
                  >
                    {lead.stage_display_name || lead.pipeline_stage}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${scoreColor(lead.lead_score)}`}>
                    {lead.lead_score}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {lead.days_in_stage}d in stage
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {lead.days_since_contact === -1
                      ? 'Never contacted'
                      : `${lead.days_since_contact}d since contact`}
                  </span>
                  {lead.premium_amount > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(lead.premium_amount)}
                    </span>
                  )}
                  <span className="text-th-text-tertiary truncate">
                    {lead.assigned_to_name}
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  to={`/leads/${lead.lead_id}?action=call`}
                  className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                  title="Call lead"
                >
                  <Phone className="w-4 h-4" />
                </Link>
                <Link
                  to={`/leads/${lead.lead_id}?action=email`}
                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Email lead"
                >
                  <Mail className="w-4 h-4" />
                </Link>
                <Link
                  to={`/leads/${lead.lead_id}`}
                  onClick={() => onNavigateToLead?.(lead.lead_id)}
                  className="p-1.5 rounded-lg hover:bg-surface-tertiary text-th-text-secondary transition-colors"
                  title="Open lead"
                >
                  <Zap className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {hasMore && (
            <Link
              to="/pipeline?filter=stuck"
              className="block text-center text-xs font-medium text-th-accent-600 hover:text-th-accent-700 py-2"
            >
              View all {leads.length} stuck leads
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
