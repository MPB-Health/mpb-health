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
} from 'lucide-react';
import { advisorLeadService } from '@mpbhealth/advisor-core';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';

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
        subtitle="Here's what's happening with your training and meetings."
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Training Progress"
          value={`${trainingStats.completionPercentage.toFixed(0)}%`}
          icon={<GraduationCap className="w-5 h-5" />}
        />

        <MetricCard
          label="Modules Completed"
          value={`${trainingStats.completedModules}/${trainingStats.totalModules}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />

        <MetricCard
          label="Upcoming Meetings"
          value={upcomingMeetings.length}
          icon={<Video className="w-5 h-5" />}
        />

        <button
          onClick={() => navigate('/leads')}
          className="text-left"
        >
          <MetricCard
            label="Assigned Leads"
            value={assignedLeadCount}
            icon={<Users className="w-5 h-5" />}
            className="hover:border-th-accent-300 cursor-pointer"
          />
        </button>
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

      {/* Quick Links */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <h2 className="font-semibold text-th-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
