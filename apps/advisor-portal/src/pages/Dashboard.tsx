import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import {
  GraduationCap,
  Video,
  FileText,
  Award,
  ArrowRight,
  Clock,
  Calendar,
  Link,
} from 'lucide-react';
import { navigationService, type QuickLink } from '@mpbhealth/advisor-core';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';

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
  { label: 'Inbox', url: '/inbox', icon: 'Inbox', highlight: true },
  { label: 'Training', url: '/training', icon: 'GraduationCap' },
  { label: 'Forms', url: '/forms', icon: 'FileText' },
  { label: 'SOPs', url: '/sops', icon: 'FileText' },
  { label: 'Meetings', url: '/meetings', icon: 'Video' },
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

  const [cmsQuickActions, setCmsQuickActions] = useState<QuickLink[]>([]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => navigate('/inbox')} className="text-left">
          <MetricCard
            label="Inbox"
            icon={<FileText className="w-5 h-5" />}
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
