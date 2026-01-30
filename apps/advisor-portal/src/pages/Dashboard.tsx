import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import {
  GraduationCap,
  Video,
  FileText,
  Award,
  Users,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Zap,
  User,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  Link,
} from 'lucide-react';
import { advisorLeadService, navigationService, type QuickLink } from '@mpbhealth/advisor-core';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';
import { usePowerList, usePriorityStats } from '../hooks/usePriority';
import { useUserComplianceStatus, usePendingAcknowledgments } from '../hooks/useCompliance';

// Map icon name strings to Lucide icon components
function getIconComponent(iconName: string): LucideIcons.LucideIcon {
  // Try to get from LucideIcons dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lucideModule = LucideIcons as any;
  if (lucideModule[iconName] && typeof lucideModule[iconName] === 'function') {
    return lucideModule[iconName] as LucideIcons.LucideIcon;
  }
  // Fallback to Link icon
  return Link;
}

// Type for quick action items
interface QuickActionItem {
  label: string;
  url: string;
  icon: string;
  highlight?: boolean;
  description?: string;
  is_external?: boolean;
}

// Fallback quick actions (used when CMS data isn't available)
const fallbackQuickActions: QuickActionItem[] = [
  { label: 'Power List', url: '/power-list', icon: 'Zap', highlight: true },
  { label: 'My Leads', url: '/leads', icon: 'Users' },
  { label: 'Training', url: '/training', icon: 'GraduationCap' },
  { label: 'Forms', url: '/forms', icon: 'FileText' },
  { label: 'SOPs', url: '/sops', icon: 'FileText' },
  { label: 'Compliance', url: '/compliance', icon: 'Shield' },
  { label: 'Profile', url: '/profile', icon: 'Award' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    profile,
    trainingStats,
    trainingModules,
    trainingProgress,
    upcomingMeetings,
  } = useAdvisor();

  const [assignedLeadCount, setAssignedLeadCount] = useState(0);
  const [cmsQuickActions, setCmsQuickActions] = useState<QuickLink[]>([]);
  const { items: powerListItems, loading: powerListLoading } = usePowerList();
  const { stats: priorityStats } = usePriorityStats();
  const { status: complianceStatus } = useUserComplianceStatus(profile?.id);
  const { pending: pendingAcknowledgments } = usePendingAcknowledgments(profile?.id);

  useEffect(() => {
    if (!profile?.id) return;
    advisorLeadService.getAssignedLeadCount(profile.id).then(setAssignedLeadCount);
  }, [profile?.id]);

  // Fetch quick actions from CMS
  useEffect(() => {
    const loadQuickActions = async () => {
      try {
        const actions = await navigationService.getDashboardQuickActions();
        setCmsQuickActions(actions);
      } catch (error) {
        console.error('Failed to load quick actions from CMS:', error);
        // Will use fallback actions
      }
    };

    loadQuickActions();
  }, []);

  // Use CMS quick actions or fallback
  const quickActions = useMemo((): QuickActionItem[] => {
    if (cmsQuickActions.length > 0) {
      return cmsQuickActions.map(action => ({
        label: action.label,
        url: action.url,
        icon: action.icon,
        highlight: action.icon === 'Zap' || action.label.toLowerCase().includes('power'),
        description: action.description || undefined,
        is_external: action.is_external,
      }));
    }
    return fallbackQuickActions;
  }, [cmsQuickActions]);

  // Get in-progress training modules
  const inProgressModules = trainingModules.filter((module) => {
    const progress = trainingProgress.find((p) => p.module_id === module.id);
    return progress?.status === 'in_progress';
  });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <GradientHeader
        title={`Welcome back, ${profile?.first_name}!`}
        subtitle="Here's what needs your attention today."
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <button onClick={() => navigate('/power-list')} className="text-left">
          <MetricCard
            label="Priority Items"
            value={priorityStats?.totalItems ?? '-'}
            icon={<Zap className="w-5 h-5" />}
            className="hover:border-th-accent-300 cursor-pointer"
          />
        </button>

        <MetricCard
          label="Completed Today"
          value={priorityStats?.completedToday ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />

        <button onClick={() => navigate('/leads')} className="text-left">
          <MetricCard
            label="Assigned Leads"
            value={assignedLeadCount}
            icon={<Users className="w-5 h-5" />}
            className="hover:border-th-accent-300 cursor-pointer"
          />
        </button>

        <MetricCard
          label="Upcoming Meetings"
          value={upcomingMeetings.length}
          icon={<Video className="w-5 h-5" />}
        />

        <MetricCard
          label="Training Progress"
          value={`${trainingStats.completionPercentage.toFixed(0)}%`}
          icon={<GraduationCap className="w-5 h-5" />}
        />
      </div>

      {/* Today's Focus - Power List Preview */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-th-text-primary">Today's Focus</h2>
          </div>
          <button
            onClick={() => navigate('/power-list')}
            className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center space-x-1"
          >
            <span>View Power List</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          {powerListLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : powerListItems.length > 0 ? (
            <div className="space-y-3">
              {powerListItems.slice(0, 5).map((item, index) => {
                const scoreColor =
                  item.score >= 80
                    ? 'bg-red-500'
                    : item.score >= 60
                      ? 'bg-orange-500'
                      : item.score >= 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500';

                return (
                  <button
                    key={item.item_id}
                    onClick={() => item.lead_id && navigate(`/leads/${item.lead_id}`)}
                    className="w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-surface-tertiary transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-th-text-primary truncate">
                          {item.person_name}
                        </p>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: item.lane_color }}
                        >
                          {item.lane_name}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-sm text-th-text-tertiary truncate mt-0.5">
                          {item.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${scoreColor}`} />
                        <span className="text-xs font-medium text-neutral-600">{item.score}</span>
                      </div>
                      {item.person_email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${item.person_email}`;
                          }}
                          className="p-1.5 hover:bg-neutral-200 rounded"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4 text-neutral-400" />
                        </button>
                      )}
                      <ArrowRight className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-th-text-tertiary">
              <Zap className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
              <p>No priority items yet</p>
              <button
                onClick={() => navigate('/leads')}
                className="mt-3 text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Add leads to Power List
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Training */}
        <div className="bg-surface-primary rounded-xl border border-th-border">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Continue Training</h2>
            <button
              onClick={() => navigate('/training')}
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            {inProgressModules.length > 0 ? (
              <div className="space-y-4">
                {inProgressModules.slice(0, 3).map((module) => {
                  const progress = trainingProgress.find(
                    (p) => p.module_id === module.id
                  );
                  return (
                    <button
                      key={module.id}
                      onClick={() => navigate(`/training/${module.id}`)}
                      className="w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-surface-tertiary transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-th-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-th-accent-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-th-text-primary truncate">
                          {module.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-th-text-tertiary" />
                          <span className="text-sm text-th-text-tertiary">
                            {progress?.time_spent_minutes || 0} min spent
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-th-text-tertiary" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-th-text-tertiary">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
                <p>No modules in progress</p>
                <button
                  onClick={() => navigate('/training')}
                  className="mt-3 text-th-accent-600 hover:text-th-accent-700 font-medium"
                >
                  Start Training
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-surface-primary rounded-xl border border-th-border">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Upcoming Meetings</h2>
            <button
              onClick={() => navigate('/meetings')}
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 3).map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                    className="w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-surface-tertiary transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary truncate">
                        {meeting.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-th-text-tertiary" />
                        <span className="text-sm text-th-text-tertiary">
                          {format(new Date(meeting.scheduled_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-th-text-tertiary" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-th-text-tertiary">
                <Video className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
                <p>No upcoming meetings</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      {(pendingAcknowledgments.length > 0 || (complianceStatus && complianceStatus.compliance_score < 100)) && (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <div className="flex items-center space-x-2">
              <Shield className={`w-5 h-5 ${
                (complianceStatus?.compliance_score || 0) >= 90 ? 'text-green-500' :
                (complianceStatus?.compliance_score || 0) >= 70 ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <h2 className="font-semibold text-th-text-primary">Compliance Status</h2>
              {pendingAcknowledgments.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                  {pendingAcknowledgments.length} pending
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/compliance')}
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-th-text-tertiary">Compliance Score</p>
                <p className={`text-2xl font-bold ${
                  (complianceStatus?.compliance_score || 0) >= 90 ? 'text-green-600' :
                  (complianceStatus?.compliance_score || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {complianceStatus?.compliance_score || 0}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-th-text-tertiary">Tasks</p>
                <p className="text-lg font-semibold text-th-text-primary">
                  {complianceStatus?.total_completed || 0} / {complianceStatus?.total_required || 0}
                </p>
              </div>
            </div>
            {pendingAcknowledgments.length > 0 && (
              <div className="space-y-2">
                {pendingAcknowledgments.slice(0, 3).map((ack) => (
                  <button
                    key={ack.id}
                    onClick={() => navigate(`/compliance/acknowledge/${ack.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          {ack.document?.title || 'Pending Acknowledgment'}
                        </p>
                        {ack.due_date && (
                          <p className="text-xs text-yellow-600">
                            Due {format(new Date(ack.due_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-yellow-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links - Dynamic from CMS */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <h2 className="font-semibold text-th-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = getIconComponent(action.icon);
            const isHighlight = action.highlight;
            
            const handleClick = () => {
              if (action.is_external) {
                window.open(action.url, '_blank');
              } else {
                navigate(action.url);
              }
            };

            return (
              <button
                key={`${action.url}-${index}`}
                onClick={handleClick}
                title={action.description || action.label}
                className={`flex flex-col items-center p-4 rounded-lg border transition-colors ${
                  isHighlight
                    ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100'
                    : 'border-th-border hover:border-th-accent-300 hover:bg-th-accent-50'
                }`}
              >
                <IconComponent 
                  className={`w-8 h-8 mb-2 ${
                    isHighlight ? 'text-yellow-600' : 'text-th-accent-600'
                  }`} 
                />
                <span 
                  className={`text-sm font-medium text-center ${
                    isHighlight ? 'text-yellow-700' : 'text-th-text-secondary'
                  }`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
