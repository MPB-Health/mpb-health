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
  Users,
  Heart,
  Send,
  Sparkles,
  Phone,
  FileText as FileTextIcon,
  Bell,
  ChevronLeft,
  ChevronRight,
  Play,
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

// Teams meeting link for recurring advisor meetings
const TEAMS_MEETING_URL = ''; // TODO: Add Teams meeting link

// Video slider data - matching the advisor playbook video slider
const ADVISOR_VIDEOS = [
  {
    id: 'v0',
    title: 'Zion Healthshare Contest',
    vimeoId: '1121281554',
    thumbnail: 'https://vumbnail.com/1121281554.jpg',
  },
  {
    id: 'v1',
    title: 'What is Medical Cost Sharing?',
    vimeoId: '867328836',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation1.jpg',
  },
  {
    id: 'v2',
    title: 'MPB Health - Accessible, Flexible y Eficaz',
    vimeoId: '999576729',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation3-1.jpg',
  },
  {
    id: 'v3',
    title: 'MPB.Health Membership Overview',
    vimeoId: '560882524',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation6.jpg',
  },
  {
    id: 'v4',
    title: 'Premium Care',
    vimeoId: '951207884',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation2.jpg',
  },
  {
    id: 'v5',
    title: 'Premium HSA',
    vimeoId: '952446997',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation5.jpg',
  },
  {
    id: 'v6',
    title: 'App Video',
    vimeoId: '889549950',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation4.jpg',
  },
  {
    id: 'v7',
    title: 'Advisor Landing Page Training',
    vimeoId: '1098270274',
    vimeoHash: '8a7898b305',
    thumbnail: 'https://advisor.mpb.health/wp-content/uploads/2025/07/videos-overlay.jpg',
  },
];

// Get the next N upcoming 2nd and 4th Tuesdays
function getUpcomingRecurringMeetings(count = 4): Date[] {
  const meetings: Date[] = [];
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  while (meetings.length < count) {
    // Find all Tuesdays in the month
    const firstDay = new Date(year, month, 1);
    const tuesdays: Date[] = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 2) tuesdays.push(date); // Tuesday = 2
    }
    // 2nd Tuesday (index 1) and 4th Tuesday (index 3)
    const targets = [tuesdays[1], tuesdays[3]].filter(Boolean);
    for (const t of targets) {
      if (t && t >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && meetings.length < count) {
        // Set meeting time to 12:00 PM ET
        t.setHours(12, 0, 0, 0);
        meetings.push(t);
      }
    }
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return meetings;
}

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
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [scheduleCallOpen, setScheduleCallOpen] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => setAffiliateModalOpen(true)} className="text-left h-full w-full">
          <div className="relative bg-surface-primary border border-th-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden hover:border-th-accent-300 h-full">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-secondary">Affiliates</p>
                <p className="text-base font-semibold text-th-text-primary mt-1.5 leading-snug">
                  Know someone who would be a perfect fit for MPB Health?
                </p>
              </div>
              <div className="flex-shrink-0 ml-4 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </button>

        <div className="relative bg-surface-primary border border-th-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden hover:border-th-accent-300 h-full">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-th-text-secondary">Notifications</p>
              <p className="text-base font-semibold text-th-text-primary mt-1.5 leading-snug">
                You don't have any new notifications
              </p>
            </div>
            <div className="flex-shrink-0 ml-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-surface-primary border border-th-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden hover:border-th-accent-300 h-full">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareModal({ label: 'My Advisor Page', url: 'https://advisorlandingpage.mpb.health/' });
                    setShareForm({ name: '', email: '' });
                  }}
                  className="text-sm font-medium text-th-accent-600 hover:text-th-accent-700 hover:underline"
                >
                  Share
                </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Slider - 2/3 width matching first 2 top cards */}
        <div className="lg:col-span-2 bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary flex items-center gap-2">
              <Video className="w-5 h-5 text-th-text-tertiary" />
              Videos
            </h2>
            <span className="text-xs text-th-text-tertiary font-medium">
              {activeVideoIndex + 1} / {ADVISOR_VIDEOS.length}
            </span>
          </div>

          {/* Main Video Area */}
          <div className="relative bg-black">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {videoPlaying ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://player.vimeo.com/video/${ADVISOR_VIDEOS[activeVideoIndex].vimeoId}${ADVISOR_VIDEOS[activeVideoIndex].vimeoHash ? '?h=' + ADVISOR_VIDEOS[activeVideoIndex].vimeoHash + '&' : '?'}autoplay=1&dnt=1&app_id=122963`}
                  title={ADVISOR_VIDEOS[activeVideoIndex].title}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => setVideoPlaying(true)}
                  className="absolute inset-0 w-full h-full group cursor-pointer"
                >
                  <img
                    src={ADVISOR_VIDEOS[activeVideoIndex].thumbnail}
                    alt={ADVISOR_VIDEOS[activeVideoIndex].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 flex items-center justify-center transition-all shadow-lg">
                      <Play className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white font-bold text-xl md:text-2xl">
                      {ADVISOR_VIDEOS[activeVideoIndex].title}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => {
                setActiveVideoIndex((prev) => (prev === 0 ? ADVISOR_VIDEOS.length - 1 : prev - 1));
                setVideoPlaying(false);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveVideoIndex((prev) => (prev === ADVISOR_VIDEOS.length - 1 ? 0 : prev + 1));
                setVideoPlaying(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="relative border-t border-th-border-subtle">
            <div
              ref={thumbnailScrollRef}
              className="flex gap-1 p-2 overflow-x-auto scrollbar-thin"
              style={{ scrollbarWidth: 'thin' }}
            >
              {ADVISOR_VIDEOS.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => {
                    setActiveVideoIndex(index);
                    setVideoPlaying(false);
                  }}
                  className={`relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden transition-all ${
                    index === activeVideoIndex
                      ? 'ring-2 ring-th-accent-500 opacity-100'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {index === activeVideoIndex && (
                    <div className="absolute inset-0 border-2 border-th-accent-500 rounded-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings - matching 3rd top card width */}
        <div className="lg:col-span-1 bg-surface-primary rounded-xl border border-th-border">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Upcoming Meetings</h2>
            <span className="text-xs text-th-text-tertiary font-medium">
              Every 2nd & 4th Tuesday
            </span>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {getUpcomingRecurringMeetings(4).map((date, index) => {
                const isNext = index === 0;
                return (
                  <div
                    key={date.toISOString()}
                    className={`flex items-center space-x-4 p-3 rounded-lg ${isNext ? 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-purple-600' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                      <Video className={`w-6 h-6 ${isNext ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary">
                        Advisor Meeting
                        {isNext && <span className="ml-2 text-xs font-semibold text-purple-600 dark:text-purple-400">Next</span>}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-th-text-tertiary" />
                        <span className="text-sm text-th-text-tertiary">
                          {format(date, 'EEEE, MMM d · h:mm a')}
                        </span>
                      </div>
                    </div>
                    {TEAMS_MEETING_URL ? (
                      <a
                        href={TEAMS_MEETING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join
                      </a>
                    ) : (
                      <ArrowRight className="w-5 h-5 text-th-text-tertiary flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
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

      {/* Affiliate modal */}
      {affiliateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-2xl w-full max-w-lg mx-4 shadow-xl overflow-hidden">
            {/* Header gradient */}
            <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-8 text-white">
              <button
                type="button"
                onClick={() => setAffiliateModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-white/15">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Affiliates</h2>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Know someone who would be a perfect fit for MPB Health?
              </p>
            </div>
            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex-shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-th-text-secondary leading-relaxed">
                  If you know someone who thrives in a dynamic environment and is dedicated to making a real impact in healthcare, we'd love to meet them!
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-sm text-th-text-secondary leading-relaxed">
                  Refer a friend or colleague and help us grow the MPB Health advisor community. Together, we can make healthcare more accessible and affordable.
                </p>
              </div>
            </div>
            {/* Footer actions */}
            <div className="px-6 pb-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAffiliateModalOpen(false);
                    setScheduleCallOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule a Call
                </button>
                <a
                  href="tel:8558164650"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  (855) 816-4650
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAffiliateModalOpen(false);
                  setApplicationFormOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-800 dark:hover:bg-purple-900/30"
              >
                <FileTextIcon className="w-4 h-4" />
                Application Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Form modal */}
      {applicationFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setApplicationFormOpen(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary">
                  Application Form
                </h2>
                <button
                  onClick={() => setApplicationFormOpen(false)}
                  className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448"
                  className="w-full h-full border-0"
                  title="Application Form"
                  allow="payment"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule a Call modal */}
      {scheduleCallOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setScheduleCallOpen(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary">
                  Schedule a Call
                </h2>
                <button
                  onClick={() => setScheduleCallOpen(false)}
                  className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src="https://calendly.com/rebalarney-mympb/time-with-reba"
                  className="w-full h-full border-0"
                  title="Schedule a Call"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
