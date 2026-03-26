import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Shield,
  Star,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  UserCircle,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { useCRMService } from '../contexts/CRMServiceContext';
import { supabase } from '../lib/supabase';
import { createFamilyService, createActivityService } from '@mpbhealth/crm-core';
import type { FamilyMember, LeadActivity } from '@mpbhealth/crm-core';

const familyService = createFamilyService(supabase);
const activityService = createActivityService(supabase);

interface RelationshipSidebarProps {
  entityType: 'lead' | 'contact';
  entityId: string;
  entityName: string;
  advisorId?: string | null;
  advisorName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  planType?: string | null;
  leadScore?: number | null;
}

interface ScoreBreakdown {
  overall_score: number;
  factors: { name: string; score: number; weight: number }[];
}

export function RelationshipSidebar({
  entityType,
  entityId,
  entityName,
  advisorId,
  advisorName,
  accountId,
  accountName,
  planType,
  leadScore,
}: RelationshipSidebarProps) {
  const { scoringService } = useCRMService();

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [recentActivities, setRecentActivities] = useState<LeadActivity[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['family', 'activity', 'score']),
  );

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);

    const loads: Promise<void>[] = [
      familyService
        .getFamilyMembers(entityType, entityId)
        .then((data) => setFamilyMembers(data))
        .catch(() => setFamilyMembers([])),
    ];

    if (entityType === 'lead') {
      loads.push(
        activityService
          .getRecentActivities(5)
          .then((data: LeadActivity[]) => setRecentActivities(data))
          .catch(() => setRecentActivities([])),
      );
      loads.push(
        scoringService
          .getScoreBreakdown(entityId)
          .then((data) => {
            if (data) {
              setScoreBreakdown({
                overall_score: data.total_score ?? 0,
                factors: (data.factors ?? []).map((f) => ({
                  name: f.factor,
                  score: f.points,
                  weight: f.weight_applied,
                })),
              });
            }
          })
          .catch(() => setScoreBreakdown(null)),
      );
    }

    Promise.all(loads).finally(() => setLoading(false));
  }, [entityId, entityType, familyService, activityService, scoringService]);

  const scoreColor = useMemo(() => {
    const s = scoreBreakdown?.overall_score ?? leadScore ?? 0;
    if (s >= 80) return 'text-emerald-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-red-500';
  }, [scoreBreakdown, leadScore]);

  if (loading) {
    return (
      <div className="w-80 border-l border-th-border bg-surface-primary p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-th-text-tertiary" />
      </div>
    );
  }

  return (
    <aside className="w-80 border-l border-th-border bg-surface-primary overflow-y-auto shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-th-border">
        <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
          Relationship Context
        </h3>
      </div>

      {/* Advisor card */}
      {advisorId && (
        <div className="p-4 border-b border-th-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-th-accent-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-th-accent-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-th-text-tertiary">Advisor</p>
              <p className="text-sm font-semibold text-th-text-primary truncate">
                {advisorName || 'Assigned'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account link */}
      {accountId && (
        <div className="p-4 border-b border-th-border">
          <Link
            to={`/accounts/${accountId}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-th-text-tertiary">Account</p>
              <p className="text-sm font-semibold text-th-text-primary truncate group-hover:text-th-accent-600 transition-colors">
                {accountName || 'View Account'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      )}

      {/* Plan type badge */}
      {planType && (
        <div className="px-4 py-3 border-b border-th-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-th-text-tertiary" />
            <span className="text-xs text-th-text-tertiary">Plan Type</span>
            <span
              className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                planType === 'healthshare'
                  ? 'bg-emerald-100 text-emerald-700'
                  : planType === 'traditional_insurance'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {planType === 'healthshare' ? 'HealthShare' : planType === 'traditional_insurance' ? 'Traditional' : planType}
            </span>
          </div>
        </div>
      )}

      {/* Lead score */}
      {entityType === 'lead' && (scoreBreakdown || leadScore !== null) && (
        <CollapsibleSection
          title="Lead Score"
          icon={Target}
          expanded={expandedSections.has('score')}
          onToggle={() => toggleSection('score')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-surface-tertiary"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className={scoreColor}
                  strokeDasharray={`${((scoreBreakdown?.overall_score ?? leadScore ?? 0) / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>
                {scoreBreakdown?.overall_score ?? leadScore ?? 0}
              </span>
            </div>
            <div className="text-xs text-th-text-tertiary">
              {(scoreBreakdown?.overall_score ?? leadScore ?? 0) >= 80
                ? 'Hot lead — prioritize outreach'
                : (scoreBreakdown?.overall_score ?? leadScore ?? 0) >= 50
                  ? 'Warm — nurture with follow-ups'
                  : 'Cold — needs engagement'}
            </div>
          </div>
          {scoreBreakdown?.factors && scoreBreakdown.factors.length > 0 && (
            <div className="space-y-2">
              {scoreBreakdown.factors.slice(0, 5).map((f) => (
                <div key={f.name} className="flex items-center justify-between text-xs">
                  <span className="text-th-text-secondary truncate">{f.name}</span>
                  <span className="font-medium text-th-text-primary">{f.score}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Family members */}
      <CollapsibleSection
        title="Family"
        icon={Users}
        count={familyMembers.length}
        expanded={expandedSections.has('family')}
        onToggle={() => toggleSection('family')}
      >
        {familyMembers.length > 0 ? (
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-surface-secondary/50"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-th-text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-th-text-primary truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-xs text-th-text-tertiary capitalize">{member.relationship}</p>
                </div>
                {member.is_covered && (
                  <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-th-text-tertiary">No family members on file</p>
        )}
      </CollapsibleSection>

      {/* Recent activity */}
      {entityType === 'lead' && (
        <CollapsibleSection
          title="Recent Activity"
          icon={Clock}
          count={recentActivities.length}
          expanded={expandedSections.has('activity')}
          onToggle={() => toggleSection('activity')}
        >
          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2">
                  <ActivityIcon type={activity.activity_type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-th-text-primary truncate">
                      {activity.title || activity.description || activity.activity_type}
                    </p>
                    <p className="text-[10px] text-th-text-tertiary">
                      {new Date(activity.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-th-text-tertiary">No recent activity</p>
          )}
        </CollapsibleSection>
      )}
    </aside>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof Users;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-th-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-secondary/50 transition-colors"
      >
        <Icon className="w-4 h-4 text-th-text-tertiary" />
        <span className="text-xs font-semibold text-th-text-primary flex-1 text-left">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-surface-tertiary text-[10px] font-medium text-th-text-secondary">
            {count}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-th-text-tertiary" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: typeof Mail; color: string }> = {
    email: { icon: Mail, color: 'text-blue-500' },
    call: { icon: Phone, color: 'text-green-500' },
    meeting: { icon: Calendar, color: 'text-violet-500' },
    note: { icon: Star, color: 'text-amber-500' },
    stage_change: { icon: TrendingUp, color: 'text-cyan-500' },
  };
  const config = iconMap[type] || { icon: Clock, color: 'text-gray-400' };
  const IconComponent = config.icon;
  return <IconComponent className={`w-3.5 h-3.5 ${config.color} mt-0.5 flex-shrink-0`} />;
}

export default RelationshipSidebar;
