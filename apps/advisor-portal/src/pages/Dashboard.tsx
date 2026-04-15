import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Video,
  ArrowRight,
  Calendar,
  ExternalLink,
  Share2,
  X,
  User,
  Users,
  Heart,
  Sparkles,
  Phone,
  FileText as FileTextIcon,
  Bell,
  ChevronLeft,
  ChevronRight,
  Play,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TreePine,
  Link2,
  LifeBuoy,
  Copy,
  CheckCheck,
  GraduationCap,
  Smartphone,
  Download,
  Search,
  Pill,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, GradientHeader, MetricCard, SkeletonLine, SkeletonAvatar } from '@mpbhealth/ui';
import { meetingService, enrollmentService, portalSettingsService, announcementService, formsService, navigationService, type AdvisorMeeting, type EnrollmentLink, type Announcement, type AdvisorForm, type QuickLink } from '@mpbhealth/advisor-core';
import { supabase, supabaseUrl } from '@mpbhealth/database';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useWidgetVisibility } from '../hooks/useWidgetVisibility';
import SafeImage from '../components/SafeImage';

const JOIN_MPB_BASE = 'https://join.mpb.health';

interface FallbackQuickLink {
  label: string;
  url: string;
  image: string;
  localImage?: string;
  description: string;
  popup?: boolean;
}

const STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public/advisor-documents`;

const APP_STORE_URL = 'https://apps.apple.com/us/app/mpb-health/id6747984750';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.mpb.health&utm_source=na_Med';
const MPB_WEB_APP_URL = 'https://app.mpb.health/';
const WEBSITE_BASE_URL = 'https://mpb.health';
const PHCS_SEARCH_URL = 'https://providersearch.multiplan.com/';
const ZOCDOC_URL = 'https://www.zocdoc.com/?dd_referrer=';
const RX_VALET_URL = 'https://www.rxvalet.com';

const fallbackDashboardQuickLinks: FallbackQuickLink[] = [
  {
    label: 'RX, Labs & Imaging Quote',
    url: 'https://www.cognitoforms.com/MPoweringBenefits1/RXLabsImagingCustomQuoteRequest2026',
    image: `${STORAGE_BASE}/quick-link-rx-labs-imaging.png`,
    localImage: '/images/quick-links/quick-link-rx-labs-imaging.jpg',
    description: 'Request a custom quote for prescriptions, lab work, and imaging services.',
    popup: true,
  },
  {
    label: 'Laboratory Assist',
    url: 'https://laboratoryassist.com/',
    image: `${STORAGE_BASE}/quick-link-lab-assist.png`,
    localImage: '/images/quick-links/quick-link-lab-assist.jpg',
    description: 'Nationwide access to affordable diagnostic lab tests.',
  },
  {
    label: 'Find a Provider',
    url: 'https://providersearch.multiplan.com/',
    image: `${STORAGE_BASE}/quick-link-provider-search.png`,
    localImage: '/images/quick-links/quick-link-provider-search.jpg',
    description: 'Search the MultiPlan network for in-network healthcare providers.',
  },
  {
    label: 'Book a Doctor',
    url: 'https://www.zocdoc.com/?dd_referrer=',
    image: `${STORAGE_BASE}/quick-link-zocdoc.png`,
    localImage: '/images/quick-links/quick-link-zocdoc.jpg',
    description: 'Find and book doctor appointments online through ZocDoc.',
  },
  {
    label: 'Prescription Savings',
    url: 'https://www.goodrx.com/',
    image: `${STORAGE_BASE}/quick-link-goodrx.png`,
    localImage: '/images/quick-links/quick-link-goodrx.jpg',
    description: 'Compare prescription drug prices and find discounts with GoodRx.',
  },
  {
    label: 'HealthyCare Podcast',
    url: 'https://www.youtube.com/@HealthyCarePodcast',
    image: `${STORAGE_BASE}/quick-link-healthy-care-podcast.png`,
    localImage: '/images/quick-links/quick-link-healthy-care-podcast.jpg',
    description: 'Watch the HealthyCare Podcast for health education and tips.',
  },
  {
    label: 'MPB Health Channel',
    url: 'https://www.youtube.com/@MPBHealth_official',
    image: `${STORAGE_BASE}/quick-link-mpb-health-youtube.png`,
    localImage: '/images/quick-links/quick-link-mpb-health-youtube.jpg',
    description: 'Visit the official MPB Health YouTube channel for updates and content.',
  },
  {
    label: 'Preventive Care',
    url: 'https://www.healthcare.gov/coverage/preventive-care-benefits/',
    image: `${STORAGE_BASE}/quick-link-preventive-care.png`,
    localImage: '/images/quick-links/quick-link-preventive-care.jpg',
    description: 'Learn about preventive health services covered at no cost, including screenings and immunizations.',
  },
];


// Fallback enroll page options (used when CMS data is unavailable)
const FALLBACK_ENROLL_OPTIONS: { label: string; url: string }[] = [
  { label: 'Essentials', url: 'https://essentials.enrollmpb.com/?id=768413' },
  { label: 'Care+', url: 'https://careplus.enrollmpb.com/?id=768413' },
  { label: 'Secure HSA', url: 'https://securehsa.enrollmpb.com/?id=768413' },
  { label: 'MEC + Essentials', url: 'https://mec.enrollmpb.com/?id=768413' },
];

// Teams meeting link for recurring advisor meetings
const TEAMS_MEETING_URL = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_ODY1ZGM0NjEtYWIwNi00YzdmLTg1MjEtZWRiODEwZDc3NDVh%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22ad01a7ba-787a-4389-97d2-90b3ec45896c%22%7d';

// Get the next N upcoming 2nd and 4th Tuesdays
function getUpcomingRecurringMeetings(count = 4): Date[] {
  const meetings: Date[] = [];
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  while (meetings.length < count) {
    const tuesdays: Date[] = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 2) tuesdays.push(date);
    }
    const targets = [tuesdays[1], tuesdays[3]].filter(Boolean);
    for (const t of targets) {
      if (t && t >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && meetings.length < count) {
        t.setHours(16, 0, 0, 0);
        meetings.push(t);
      }
    }
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return meetings;
}

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
    thumbnail: 'https://vumbnail.com/867328836.jpg',
  },
  {
    id: 'v2',
    title: 'MPB Health - Accessible, Flexible y Eficaz',
    vimeoId: '999576729',
    thumbnail: 'https://vumbnail.com/999576729.jpg',
  },
  {
    id: 'v3',
    title: 'MPB.Health Membership Overview',
    vimeoId: '560882524',
    thumbnail: 'https://vumbnail.com/560882524.jpg',
  },
  {
    id: 'v4',
    title: 'Premium Care',
    vimeoId: '951207884',
    thumbnail: 'https://vumbnail.com/951207884.jpg',
  },
  {
    id: 'v5',
    title: 'Premium HSA',
    vimeoId: '952446997',
    thumbnail: 'https://vumbnail.com/952446997.jpg',
  },
  {
    id: 'v6',
    title: 'App Video',
    vimeoId: '889549950',
    thumbnail: 'https://vumbnail.com/889549950.jpg',
  },
  {
    id: 'v7',
    title: 'Advisor Landing Page Training',
    vimeoId: '1098270274',
    vimeoHash: '8a7898b305',
    thumbnail: 'https://vumbnail.com/1098270274.jpg',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    profile,
    trainingStats,
    trainingModules,
    trainingProgress,
    unreadBulletinCount,
  } = useAdvisor();

  const { isVisible } = useWidgetVisibility();
  const queryClient = useQueryClient();
  const [enrollDropdownOpen, setEnrollDropdownOpen] = useState(false);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [scheduleCallOpen, setScheduleCallOpen] = useState(false);

  const [quickLinkPopup, setQuickLinkPopup] = useState<{ label: string; url: string } | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const [shareModal, setShareModal] = useState<{ label: string; url: string } | null>(null);
  const [shareForm, setShareForm] = useState({ name: '', email: '' });
  const [shareSending, setShareSending] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const enrollDropdownRef = useRef<HTMLDivElement>(null);

  const [copiedFormSlug, setCopiedFormSlug] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set(announcementService.getDismissedIds()));

  // ── React Query hooks — data survives unmount/re-mount so returning
  //    to Dashboard is instant (no spinners) while fresh data is fetched
  //    in the background thanks to stale-while-revalidate. ──

  const PORTAL_SETTINGS_KEYS = [
    'affiliate_form_url',
    'schedule_call_url',
    'affiliate_phone',
    'advisor_landing_page_url',
  ] as const;

  const { data: announcements = [] } = useQuery({
    queryKey: ['dashboardAnnouncements'],
    queryFn: () => announcementService.getActiveAnnouncements(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: portalSettings = {} } = useQuery({
    queryKey: ['dashboardPortalSettings'],
    queryFn: () => portalSettingsService.getMultipleSettings([...PORTAL_SETTINGS_KEYS]),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cmsEnrollLinks = [] } = useQuery({
    queryKey: ['dashboardEnrollLinks'],
    queryFn: () => enrollmentService.getLinks(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: memberForms = [], isLoading: memberFormsLoading } = useQuery({
    queryKey: ['dashboardMemberForms'],
    queryFn: async () => {
      const forms = await formsService.getForms('member');
      return [...forms].sort((a, b) => (a.name || a.label).localeCompare(b.name || b.label));
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: cmsQuickLinks = [] } = useQuery({
    queryKey: ['dashboardQuickLinks'],
    queryFn: () => navigationService.getResourceCenterQuickLinks(8),
    staleTime: 2 * 60 * 1000,
  });

  const { data: upcomingMeetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['dashboardMeetings', profile?.id],
    queryFn: () => meetingService.getUpcomingMeetings(profile!.id, 4),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: hasAdvisorPageAccess = false } = useQuery({
    queryKey: ['advisorPageAccess', profile?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_access')
        .select('has_advisor_page_access')
        .ilike('email', profile!.email || '')
        .maybeSingle();
      return !error && data?.has_advisor_page_access === true;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });

  const showMyAdvisorPage = profile && hasAdvisorPageAccess;

  // Realtime subscriptions — invalidate query cache so stale-while-revalidate kicks in
  useEffect(() => {
    const annChannel = announcementService.subscribeToAnnouncements(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardAnnouncements'] });
    });
    const enrollChannel = enrollmentService.subscribeToChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardEnrollLinks'] });
    });
    const formsChannel = formsService.subscribeToFormChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardMemberForms'] });
    });
    const settingsChannel = portalSettingsService.subscribeToSettingChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardPortalSettings'] });
    });
    const quickLinksChannel = navigationService.subscribeToQuickLinkChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardQuickLinks'] });
    });
    return () => {
      annChannel.unsubscribe();
      supabase.removeChannel(enrollChannel);
      supabase.removeChannel(formsChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(quickLinksChannel);
    };
  }, [queryClient]);

  const handleDismissAnnouncement = (id: string) => {
    announcementService.dismissAnnouncement(id);
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));

  // Derive URLs from settings with hardcoded fallbacks
  const affiliateFormUrl = portalSettings.affiliate_form_url || 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448';
  const scheduleCallUrl = portalSettings.schedule_call_url || 'https://calendly.com/rebalarney-mympb/time-with-reba';
  const affiliatePhone = portalSettings.affiliate_phone || '(855) 816-4650';
  const advisorLandingPageBase = portalSettings.advisor_landing_page_url || 'https://advisorlandingpage.mpb.health/';
  const advisorSlug = profile?.first_name?.toLowerCase().replace(/\s+/g, '-') || '';
  const advisorLandingPageUrl = advisorSlug
    ? `${advisorLandingPageBase.replace(/\/+$/, '')}/${advisorSlug}`
    : advisorLandingPageBase;

  // Use CMS-backed resource center links when available; fall back to hardcoded cards.
  const displayQuickLinks: FallbackQuickLink[] = cmsQuickLinks.length > 0
    ? cmsQuickLinks.map((l) => ({
        label: l.label,
        url: l.url,
        image: l.image_url
          ? l.image_url.startsWith('http') ? l.image_url : `${supabaseUrl}${l.image_url}`
          : '',
        description: l.description ?? '',
        popup: l.is_popup,
      }))
    : fallbackDashboardQuickLinks;

  // Derive enrollment options: CMS data with fallback
  const enrollOptions = cmsEnrollLinks.length > 0
    ? cmsEnrollLinks.map((link) => ({ label: link.label, url: link.url }))
    : FALLBACK_ENROLL_OPTIONS;

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

  const handleCopyFormLink = (slug: string) => {
    const url = `${WEBSITE_BASE_URL}${slug.startsWith('/') ? slug : '/' + slug}`;
    navigator.clipboard.writeText(url);
    setCopiedFormSlug(slug);
    setTimeout(() => setCopiedFormSlug(null), 2000);
  };

  // Get in-progress training modules
  const inProgressModules = trainingModules.filter((module) => {
    const progress = trainingProgress.find((p) => p.module_id === module.id);
    return progress?.status === 'in_progress';
  });

  return (
    <div className="space-y-6">
      {/* Announcements */}
      {visibleAnnouncements.length > 0 && (
        <div className="space-y-3">
          {visibleAnnouncements.map((announcement) => {
            const typeConfig: Record<Announcement['type'], { bg: string; border: string; icon: string; iconBg: string; textColor: string; IconComponent: typeof Info }> = {
              info: {
                bg: 'bg-blue-50 dark:bg-blue-950/30',
                border: 'border-blue-200 dark:border-blue-800',
                icon: 'text-blue-600 dark:text-blue-400',
                iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                textColor: 'text-blue-800 dark:text-blue-200',
                IconComponent: Info,
              },
              warning: {
                bg: 'bg-amber-50 dark:bg-amber-950/30',
                border: 'border-amber-200 dark:border-amber-800',
                icon: 'text-amber-600 dark:text-amber-400',
                iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                textColor: 'text-amber-800 dark:text-amber-200',
                IconComponent: AlertTriangle,
              },
              success: {
                bg: 'bg-green-50 dark:bg-green-950/30',
                border: 'border-green-200 dark:border-green-800',
                icon: 'text-green-600 dark:text-green-400',
                iconBg: 'bg-green-100 dark:bg-green-900/40',
                textColor: 'text-green-800 dark:text-green-200',
                IconComponent: CheckCircle2,
              },
              error: {
                bg: 'bg-red-50 dark:bg-red-950/30',
                border: 'border-red-200 dark:border-red-800',
                icon: 'text-red-600 dark:text-red-400',
                iconBg: 'bg-red-100 dark:bg-red-900/40',
                textColor: 'text-red-800 dark:text-red-200',
                IconComponent: AlertCircle,
              },
            };

            const config = typeConfig[announcement.type] || typeConfig.info;
            const IconComp = config.IconComponent;

            return (
              <div
                key={announcement.id}
                className={`relative flex items-start gap-3 rounded-xl border px-4 py-3.5 ${config.bg} ${config.border} transition-all duration-200`}
              >
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.iconBg}`}>
                  <IconComp className={`w-4.5 h-4.5 ${config.icon}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-semibold ${config.textColor}`}>{announcement.title}</p>
                  {announcement.content && (
                    <p className={`mt-0.5 text-sm ${config.textColor} opacity-80`}>{announcement.content}</p>
                  )}
                  {announcement.link_url && (
                    <a
                      href={announcement.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 mt-1.5 text-sm font-medium ${config.icon} hover:underline`}
                    >
                      {announcement.link_text || 'Learn more'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {announcement.is_dismissible && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAnnouncement(announcement.id)}
                    className={`flex-shrink-0 min-h-[44px] min-w-[44px] ${config.textColor} opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10`}
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Welcome hero */}
      <div className="relative rounded-2xl bg-surface-primary border border-th-border overflow-hidden">
        {/* Subtle top accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-th-accent-400 via-th-accent-500 to-th-accent-600" />

        <div className="relative p-6 md:p-8">
          {/* Top row: greeting + date */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="space-y-1.5">
              <p className="text-th-text-tertiary text-sm font-medium uppercase tracking-wider">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-th-text-primary">
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return 'Good morning';
                  if (h < 17) return 'Good afternoon';
                  return 'Good evening';
                })()}, {profile?.first_name}
              </h1>
              <p className="text-th-text-tertiary text-sm max-w-md">
                Empowering Healthcare Advisors — Making a Difference Every Day.
              </p>
            </div>

            {/* Quick-access actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/tickets/new"
                className="group flex items-center gap-2.5 px-4 py-2.5 bg-th-accent-600 hover:bg-th-accent-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <LifeBuoy className="w-4 h-4" />
                Support Ticket
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </Link>
              {showMyAdvisorPage && (
                <a
                  href={
                    profile?.first_name
                      ? `${JOIN_MPB_BASE}/${profile.first_name.toLowerCase().replace(/\s+/g, '-')}`
                      : JOIN_MPB_BASE
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-4 py-2.5 bg-th-accent-50 dark:bg-th-accent-900/20 hover:bg-th-accent-100 dark:hover:bg-th-accent-900/30 rounded-lg text-sm font-medium text-th-text-primary transition-all border border-th-accent-200 dark:border-th-accent-800 hover:border-th-accent-300 dark:hover:border-th-accent-700"
                >
                  <User className="w-4 h-4 text-th-accent-600 dark:text-th-accent-400" />
                  My Advisor Page
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all text-th-accent-600 dark:text-th-accent-400" />
                </a>
              )}
              <a
                href="https://app.mpb.health/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-4 py-2.5 bg-surface-tertiary hover:bg-surface-inset rounded-lg text-sm font-medium text-th-text-primary transition-all border border-th-border"
              >
                <Smartphone className="w-4 h-4 text-th-accent-600" />
                MPB Health APP
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all text-th-text-tertiary" />
              </a>
            </div>
          </div>

          {/* Stat pills */}
          <div className="mt-5 pt-5 border-t border-th-border-subtle flex flex-wrap gap-2.5">
            {(() => {
              const nextMeeting = upcomingMeetings.length > 0
                ? new Date(upcomingMeetings[0].scheduled_at)
                : getUpcomingRecurringMeetings(1)[0];
              return nextMeeting ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-tertiary rounded-full text-xs text-th-text-secondary border border-th-border-subtle">
                  <Calendar className="w-3.5 h-3.5 text-th-accent-500" />
                  <span>Next meeting: <strong className="text-th-text-primary">{format(nextMeeting, 'MMM d')}</strong></span>
                </div>
              ) : null;
            })()}
            {unreadBulletinCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/bulletins')}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span><strong>{unreadBulletinCount}</strong> unread bulletin{unreadBulletinCount !== 1 ? 's' : ''}</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-tertiary rounded-full text-xs text-th-text-secondary border border-th-border-subtle">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Advisor since <strong className="text-th-text-primary">{profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'N/A'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Action cards */}
      {isVisible('stats_cards') && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Grow Your Tree - Refer Advisors */}
        <button type="button" onClick={() => setAffiliateModalOpen(true)} className="text-left h-full w-full group">
          <div className="relative bg-surface-primary border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-th-accent-200 h-full p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
            <p className="font-semibold text-th-text-primary mb-0.5">Grow Your Tree</p>
            <p className="text-xs text-th-text-tertiary mb-3">Refer Advisors</p>
            <p className="text-sm text-th-text-secondary leading-relaxed">
              Know a great advisor? Refer them to MPB Health and grow our community together.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-tertiary text-th-text-secondary text-xs font-medium rounded-lg border border-th-border-subtle">
                <Phone className="w-3 h-3" />
                {affiliatePhone}
              </span>
            </div>
          </div>
        </button>

        {/* Notifications */}
        <button type="button" onClick={() => navigate('/bulletins')} className="text-left h-full w-full group">
          <div className="relative bg-surface-primary border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-th-accent-200 h-full p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              {unreadBulletinCount > 0 ? (
                <span className="bg-th-accent-600 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                  {unreadBulletinCount}
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 group-hover:translate-x-0.5 transition-all mt-1" />
              )}
            </div>
            <p className="font-semibold text-th-text-primary mb-0.5">Notifications</p>
            <p className="text-xs text-th-text-tertiary mb-3">Stay up to date</p>
            {unreadBulletinCount > 0 ? (
              <p className="text-sm text-th-text-secondary leading-relaxed">
                You have <strong className="text-th-text-primary">{unreadBulletinCount}</strong> unread bulletin{unreadBulletinCount !== 1 ? 's' : ''} waiting for you.
              </p>
            ) : (
              <p className="text-sm text-th-text-secondary leading-relaxed">
                You&apos;re all caught up — no new notifications.
              </p>
            )}
          </div>
        </button>

        {/* Training */}
        <button type="button" onClick={() => navigate('/training')} className="text-left h-full w-full group">
          <div className="relative bg-surface-primary border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-th-accent-200 h-full p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
            <p className="font-semibold text-th-text-primary mb-0.5">Training</p>
            <p className="text-xs text-th-text-tertiary mb-3">Courses & Certifications</p>
            <p className="text-sm text-th-text-secondary leading-relaxed">
              Access MPB, Sedera, Zion, and Planstin training modules to sharpen your skills and earn certifications.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg">
                <CheckCheck className="w-3 h-3" />
                Start Learning
              </span>
            </div>
          </div>
        </button>
      </div>}

      {/* Member Tools: APP Access, Providers, RX Valet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* APP Access */}
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-4 pb-3 border-b border-th-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-th-accent-600" />
              </div>
              <div>
                <p className="font-semibold text-th-text-primary">MPB Health APP</p>
                <p className="text-th-text-tertiary text-xs">Access & Download</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <a
              href={MPB_WEB_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white gradient-accent rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              Open Web App
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </a>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Sample Login</p>
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <span className="font-mono font-semibold">MPB111</span>
                <span className="text-blue-400">/</span>
                <span className="font-mono font-semibold">01.01.1990</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                App Store
              </a>
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Providers */}
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-4 pb-3 border-b border-th-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="font-semibold text-th-text-primary">Providers</p>
                <p className="text-th-text-tertiary text-xs">Find care for members</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <a
              href={PHCS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 w-full px-4 py-3 text-left bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Search className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-th-text-primary">PHCS Search</p>
                <p className="text-xs text-th-text-tertiary">Search the PHCS Specific Services for in-network healthcare providers</p>
              </div>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
            <a
              href={ZOCDOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 w-full px-4 py-3 text-left bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-th-text-primary">ZocDoc</p>
                <p className="text-xs text-th-text-tertiary">Book doctor appointments</p>
              </div>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary group-hover:text-green-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* RX Valet */}
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-4 pb-3 border-b border-th-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-th-text-primary">RX Valet</p>
                <p className="text-th-text-tertiary text-xs">Prescription savings</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <a
              href={RX_VALET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white gradient-accent rounded-lg hover:opacity-90 transition-opacity"
            >
              <Pill className="w-4 h-4" />
              Open RX Valet
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </a>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Sample Login</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 dark:text-purple-400 text-xs">ID</span>
                  <span className="font-mono font-semibold text-purple-800 dark:text-purple-200">MPB111</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 dark:text-purple-400 text-xs">DOB</span>
                  <span className="font-mono font-semibold text-purple-800 dark:text-purple-200">01.01.1990</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-th-text-tertiary leading-relaxed">
              Access prescription pricing and savings for members through RX Valet.
            </p>
          </div>
        </div>
      </div>

      {/* Membership Forms */}
      {isVisible('certifications') && <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="font-semibold text-th-text-primary">Membership Forms</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/forms/member')}
            className="text-th-accent-600 hover:text-th-accent-700"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="divide-y divide-th-border-subtle">
          {memberFormsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonAvatar size="w-8 h-8" className="rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonLine width="w-1/3" />
                    <SkeletonLine width="w-1/2" className="h-3" />
                  </div>
                  <SkeletonLine width="w-24" className="h-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : memberForms.length > 0 ? (
            memberForms.map((form) => (
              <div
                key={form.id}
                className="px-4 sm:px-5 py-3 hover:bg-surface-tertiary/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <FileTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary truncate">
                      {form.name || form.label}
                    </p>
                    {form.description && (
                      <p className="text-xs text-th-text-tertiary truncate hidden sm:block">{form.description}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyFormLink(form.slug)}
                      title="Copy shareable link"
                      className={copiedFormSlug === form.slug ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200' : ''}
                    >
                      {copiedFormSlug === form.slug ? (
                        <><CheckCheck className="w-3.5 h-3.5" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${WEBSITE_BASE_URL}${form.slug.startsWith('/') ? form.slug : '/' + form.slug}`;
                        if (navigator.share) {
                          navigator.share({ title: form.name || form.label, url }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(url);
                          setCopiedFormSlug(form.slug);
                          setTimeout(() => setCopiedFormSlug(null), 2000);
                        }
                      }}
                      title="Share form"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </Button>
                    <a
                      href={`${WEBSITE_BASE_URL}${form.slug.startsWith('/') ? form.slug : '/' + form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white gradient-accent rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </div>
                </div>
                {/* Mobile action buttons — stacked below the name */}
                <div className="flex sm:hidden items-center gap-2 mt-2 ml-11">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyFormLink(form.slug)}
                    className={`text-xs ${copiedFormSlug === form.slug ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200' : ''}`}
                  >
                    {copiedFormSlug === form.slug ? (
                      <><CheckCheck className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const url = `${WEBSITE_BASE_URL}${form.slug.startsWith('/') ? form.slug : '/' + form.slug}`;
                      if (navigator.share) {
                        navigator.share({ title: form.name || form.label, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url);
                        setCopiedFormSlug(form.slug);
                        setTimeout(() => setCopiedFormSlug(null), 2000);
                      }
                    }}
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                  <a
                    href={`${WEBSITE_BASE_URL}${form.slug.startsWith('/') ? form.slug : '/' + form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white gradient-accent rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <FileTextIcon className="w-10 h-10 mx-auto mb-3 text-th-text-tertiary" />
              <p className="text-sm text-th-text-tertiary">No membership forms available</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/forms/member')}
                className="mt-2 text-th-accent-600 hover:text-th-accent-700"
              >
                Browse all forms &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>}

      {isVisible('training_modules') && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Slider - 2/3 width */}
        <div className="lg:col-span-2 bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary flex items-center gap-2">
              <Video className="w-5 h-5 text-th-text-tertiary" />
              Videos
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-th-text-tertiary font-medium">
                {activeVideoIndex + 1} / {ADVISOR_VIDEOS.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/videos')}
                className="text-xs text-th-accent-600 hover:text-th-accent-700"
              >
                View Library &rarr;
              </Button>
            </div>
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
                  type="button"
                  onClick={() => setVideoPlaying(true)}
                  className="absolute inset-0 w-full h-full group cursor-pointer"
                  aria-label="Play video"
                >
                  <SafeImage
                    src={ADVISOR_VIDEOS[activeVideoIndex].thumbnail}
                    alt={ADVISOR_VIDEOS[activeVideoIndex].title}
                    className="absolute inset-0 w-full h-full object-cover"
                    fallbackClassName="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0E2D41] to-[#0A4E8E] text-white/30"
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Previous video"
              onClick={() => {
                setActiveVideoIndex((prev) => (prev === 0 ? ADVISOR_VIDEOS.length - 1 : prev - 1));
                setVideoPlaying(false);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Next video"
              onClick={() => {
                setActiveVideoIndex((prev) => (prev === ADVISOR_VIDEOS.length - 1 ? 0 : prev + 1));
                setVideoPlaying(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="border-t border-th-border-subtle">
            <div
              ref={thumbnailScrollRef}
              className="flex gap-3 p-4 overflow-x-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {ADVISOR_VIDEOS.map((video, index) => {
                const isActive = index === activeVideoIndex;
                return (
                  <button
                    type="button"
                    key={video.id}
                    onClick={() => {
                      setActiveVideoIndex(index);
                      setVideoPlaying(false);
                    }}
                    aria-label={`Play ${video.title}`}
                    className={`relative flex-shrink-0 w-52 rounded-xl overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'ring-2 ring-th-accent-500 shadow-md scale-[1.02]'
                        : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="relative w-full aspect-video">
                      <SafeImage
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-surface-tertiary text-th-text-tertiary"
                      />
                      {isActive && (
                        <div className="absolute inset-0 border-2 border-th-accent-500 rounded-xl" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="lg:col-span-1 bg-surface-primary rounded-xl border border-th-border">
          <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Upcoming Meetings</h2>
            <span className="text-xs text-th-text-tertiary font-medium">
              {upcomingMeetings.length > 0 ? `${upcomingMeetings.length} upcoming` : 'Every 2nd & 4th Tuesday'}
            </span>
          </div>
          <div className="p-5">
            {meetingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 rounded-lg">
                    <SkeletonAvatar size="w-12 h-12" className="rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <SkeletonLine width="w-2/3" />
                      <SkeletonLine width="w-1/2" className="h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting, index) => {
                  const isNext = index === 0;
                  const meetingDate = new Date(meeting.scheduled_at);
                  const joinUrl = meetingService.getJitsiUrl(meeting);
                  return (
                    <div
                      key={meeting.id}
                      className={`flex items-center space-x-4 p-3 rounded-lg ${isNext ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <Video className={`w-6 h-6 ${isNext ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-th-text-primary">
                          {meeting.title}
                          {isNext && <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Next</span>}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-th-text-tertiary" />
                          <span className="text-sm text-th-text-tertiary">
                            {format(meetingDate, 'EEEE, MMM d · h:mm a')}
                          </span>
                        </div>
                      </div>
                      {joinUrl ? (
                        <a
                          href={joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
            ) : (
              <div className="space-y-4">
                {getUpcomingRecurringMeetings(4).map((date, index) => {
                  const isNext = index === 0;
                  const today = new Date();
                  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
                  return (
                    <div
                      key={date.toISOString()}
                      className={`flex items-center space-x-4 p-3 rounded-lg ${isNext ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <Video className={`w-6 h-6 ${isNext ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-th-text-primary">
                          Advisor Meeting
                          {isNext && <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Next</span>}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-th-text-tertiary" />
                          <span className="text-sm text-th-text-tertiary">
                            {format(date, 'EEEE, MMM d · h:mm a')}
                          </span>
                        </div>
                      </div>
                      {isToday && TEAMS_MEETING_URL ? (
                        <a
                          href={TEAMS_MEETING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
            )}
          </div>
        </div>
      </div>}

      {/* Quick Links */}
      {isVisible('quick_links') && <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-th-text-primary">Resource Center</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quick-links')}
            className="text-th-accent-600 hover:text-th-accent-700"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayQuickLinks.map((link) =>
              link.popup ? (
                <button
                  type="button"
                  key={link.url}
                  onClick={() => setQuickLinkPopup(link)}
                  title={link.description}
                  className="group flex items-center gap-4 rounded-xl border border-th-border p-4 transition-all duration-200 hover:shadow-md hover:border-th-accent-300 hover:-translate-y-0.5 text-left bg-surface-primary"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <SafeImage
                      src={link.image}
                      alt={link.label}
                      fallbackSrc={link.localImage}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackClassName="w-16 h-16 rounded-lg flex items-center justify-center bg-surface-tertiary text-th-text-tertiary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-th-text-primary group-hover:text-th-accent-600 transition-colors leading-tight block truncate">
                      {link.label}
                    </span>
                    {link.description && (
                      <span className="text-xs text-th-text-tertiary mt-0.5 block truncate">
                        {link.description}
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.description}
                  className="group flex items-center gap-4 rounded-xl border border-th-border p-4 transition-all duration-200 hover:shadow-md hover:border-th-accent-300 hover:-translate-y-0.5 bg-surface-primary"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <SafeImage
                      src={link.image}
                      alt={link.label}
                      fallbackSrc={link.localImage}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackClassName="w-16 h-16 rounded-lg flex items-center justify-center bg-surface-tertiary text-th-text-tertiary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-th-text-primary group-hover:text-th-accent-600 transition-colors leading-tight block truncate">
                      {link.label}
                    </span>
                    {link.description && (
                      <span className="text-xs text-th-text-tertiary mt-0.5 block truncate">
                        {link.description}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0" />
                </a>
              )
            )}
          </div>
      </div>}

      {/* Grow Your Tree - Refer Advisors modal */}
      {affiliateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-2xl w-full max-w-lg mx-4 shadow-xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#0A4E8E] to-[#0E2D41] px-6 py-8 text-white">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAffiliateModalOpen(false)}
                className="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-white/15">
                  <TreePine className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Grow Your Tree</h2>
                  <p className="text-white/60 text-xs">Refer an Advisor</p>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Help us build a stronger advisor community. Know someone who would thrive at MPB Health?
              </p>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-th-text-primary leading-relaxed">
                  Refer someone who is dedicated to making a real impact in healthcare. We&apos;d love to meet them!
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-th-text-primary leading-relaxed">
                  Together, we can make healthcare more accessible and affordable for everyone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setAffiliateModalOpen(false);
                    setScheduleCallOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule a Call
                </Button>
                <a
                  href={`tel:${affiliatePhone.replace(/\D/g, '')}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-th-text-primary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Us
                </a>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAffiliateModalOpen(false);
                  setApplicationFormOpen(true);
                }}
                className="w-full"
              >
                <FileTextIcon className="w-4 h-4" />
                Application Form
              </Button>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setApplicationFormOpen(false)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src={affiliateFormUrl}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setScheduleCallOpen(false)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src={scheduleCallUrl}
                  className="w-full h-full border-0"
                  title="Schedule a Call"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Link popup modal */}
      {quickLinkPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setQuickLinkPopup(null)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {quickLinkPopup.label}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickLinkPopup(null)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src={quickLinkPopup.url}
                  className="w-full h-full border-0"
                  title={quickLinkPopup.label}
                  allow="payment"
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShareModal(null);
                  setShareForm({ name: '', email: '' });
                  setShareError(null);
                  setShareSuccess(false);
                }}
                className="min-h-[44px] min-w-[44px]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {shareSuccess ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-th-text-primary font-medium">Email sent successfully!</p>
                <p className="text-sm text-th-text-secondary mt-1">
                  Your advisor page link has been shared with {shareForm.name}.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setShareModal(null);
                    setShareForm({ name: '', email: '' });
                    setShareSuccess(false);
                  }}
                  className="mt-4"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={shareForm.name}
                      onChange={(e) => { setShareForm((f) => ({ ...f, name: e.target.value })); setShareError(null); }}
                      className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="Recipient name"
                      disabled={shareSending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={shareForm.email}
                      onChange={(e) => { setShareForm((f) => ({ ...f, email: e.target.value })); setShareError(null); }}
                      className="w-full px-3 py-2 rounded-lg border border-th-border bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="email@example.com"
                      disabled={shareSending}
                    />
                  </div>
                  {shareError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{shareError}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 p-4 border-t border-th-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShareModal(null);
                      setShareForm({ name: '', email: '' });
                      setShareError(null);
                    }}
                    disabled={shareSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={shareSending || !shareForm.name.trim() || !shareForm.email.trim()}
                    onClick={async () => {
                      setShareError(null);
                      setShareSending(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('share-advisor-page', {
                          body: {
                            recipientName: shareForm.name.trim(),
                            recipientEmail: shareForm.email.trim(),
                            advisorName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
                            advisorUrl: shareModal.url,
                          },
                        });
                        if (error) throw error;
                        if (data && !data.success) throw new Error(data.error || 'Failed to send email');
                        setShareSuccess(true);
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : 'Failed to send email. Please try again.';
                        setShareError(message);
                      } finally {
                        setShareSending(false);
                      }
                    }}
                  >
                    {shareSending && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {shareSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
