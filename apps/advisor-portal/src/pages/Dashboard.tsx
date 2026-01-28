import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
} from 'lucide-react';
import { advisorLeadService } from '@mpbhealth/advisor-core';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';
import { usePowerList, usePriorityStats } from '../hooks/usePriority';
import { useUserComplianceStatus, usePendingAcknowledgments } from '../hooks/useCompliance';

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
  const { items: powerListItems, loading: powerListLoading } = usePowerList();
  const { stats: priorityStats } = usePriorityStats();
  const { status: complianceStatus } = useUserComplianceStatus(profile?.id);
  const { pending: pendingAcknowledgments } = usePendingAcknowledgments(profile?.id);

  useEffect(() => {
    if (!profile?.id) return;
    advisorLeadService.getAssignedLeadCount(profile.id).then(setAssignedLeadCount);
  }, [profile?.id]);

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

      {/* Quick Links */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <h2 className="font-semibold text-th-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button
            onClick={() => navigate('/power-list')}
            className="flex flex-col items-center p-4 rounded-lg border border-yellow-200 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100 transition-colors"
          >
            <Zap className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Power List</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <Users className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">My Leads</span>
          </button>
          <button
            onClick={() => navigate('/training')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <GraduationCap className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Training</span>
          </button>
          <button
            onClick={() => navigate('/forms')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Forms</span>
          </button>
          <button
            onClick={() => navigate('/sops')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">SOPs</span>
          </button>
          <button
            onClick={() => navigate('/compliance')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <Shield className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Compliance</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
          >
            <Award className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
