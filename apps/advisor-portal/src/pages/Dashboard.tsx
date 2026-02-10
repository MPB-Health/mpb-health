import { useEffect, useMemo, useRef, useState } from 'react';
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
  ExternalLink,
  Share2,
  X,
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

// Enroll page options for My Advisor Page card
const ENROLL_OPTIONS = [
  { label: 'Essentials', url: 'https://essentials.enrollmpb.com/?id=768413' },
  { label: 'Care+', url: 'https://careplus.enrollmpb.com/?id=768413' },
  { label: 'Secure HSA', url: 'https://securehsa.enrollmpb.com/?id=768413' },
  { label: 'MEC + Essentials', url: 'https://mec.enrollmpb.com/?id=768413' },
] as const;

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
  const [enrollDropdownOpen, setEnrollDropdownOpen] = useState(false);
  const [shareModal, setShareModal] = useState<{ label: string; url: string } | null>(null);
  const [shareForm, setShareForm] = useState({ name: '', email: '' });
  const enrollDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close enroll dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (enrollDropdownRef.current && !enrollDropdownRef.current.contains(event.target as Node)) {
        setEnrollDropdownOpen(false);
      }
    };
    if (enrollDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [enrollDropdownOpen]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/inbox')} className="text-left">
          <MetricCard
            label="Inbox"
            value="View"
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

        <div className="relative bg-surface-primary border border-th-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden hover:border-th-accent-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 gradient-accent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-th-text-secondary">
                  My Advisor Page
                </p>
                <a
                  href="https://advisorlandingpage.mpb.health/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-th-accent-600 hover:text-th-accent-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Link
                </a>
              </div>
              <div className="mt-3" ref={enrollDropdownRef}>
                <label className="block text-xs font-medium text-th-text-tertiary mb-1.5">
                  Enrollments
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnrollDropdownOpen((open) => !open);
                  }}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary text-left focus:border-th-accent-500 focus:outline-none focus:ring-1 focus:ring-th-accent-500 flex items-center justify-between"
                >
                  <span className="text-th-text-secondary">Select a page</span>
                  <ArrowRight
                    className={`w-4 h-4 text-th-text-tertiary transition-transform ${enrollDropdownOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {enrollDropdownOpen && (
                  <div className="mt-1 rounded-lg border border-th-border bg-surface-primary shadow-lg overflow-hidden z-10">
                    {ENROLL_OPTIONS.map((option) => (
                      <div
                        key={option.url}
                        className="group flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-tertiary border-b border-th-border-subtle last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(option.url, '_blank', 'noopener,noreferrer');
                            setEnrollDropdownOpen(false);
                          }}
                          className="flex-1 text-left text-sm text-th-text-primary font-medium"
                        >
                          {option.label}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareModal({ label: option.label, url: option.url });
                            setShareForm({ name: '', email: '' });
                            setEnrollDropdownOpen(false);
                          }}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-th-accent-600 hover:text-th-accent-700 font-medium transition-opacity"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 ml-4 p-2.5 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/20 text-th-accent-600 dark:text-th-accent-400">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
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

      {/* Share enrollment link modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">
                Share {shareModal.label}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShareModal(null);
                  setShareForm({ name: '', email: '' });
                }}
                className="p-1 text-th-text-muted hover:text-th-text-primary rounded"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={shareForm.name}
                  onChange={(e) => setShareForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Recipient name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={shareForm.email}
                  onChange={(e) => setShareForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-th-border">
              <button
                type="button"
                onClick={() => {
                  setShareModal(null);
                  setShareForm({ name: '', email: '' });
                }}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.url);
                  setShareModal(null);
                  setShareForm({ name: '', email: '' });
                }}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary border border-th-border rounded-lg"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => {
                  // Placeholder: could send email via API later
                  setShareModal(null);
                  setShareForm({ name: '', email: '' });
                }}
                className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
