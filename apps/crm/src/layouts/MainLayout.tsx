import { useCallback, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout, PortalSwitcher } from '@mpbhealth/ui';
import type { NavItem, NavLinkRenderProps, PortalKey } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { buildPortalSSOUrl } from '@mpbhealth/auth';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  CalendarDays,
  Sunset,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  FileText,
  Zap,
  Mail,
  Inbox,
  Send,
  Clock,
  PenTool,
  ListOrdered,
  Activity,
  ShieldCheck,
  Video,
  Building2,
  UserCircle,
  DollarSign,
  GitBranch,
  Package,
  FileCheck,
  Receipt,
  Megaphone,
  Settings2,
  Calculator,
  Command,
  Download,
  Sparkles,
  Handshake,
  UserCheck,
  Heart,
  Share2,
  LayoutGrid,
  BookOpen,
} from 'lucide-react';
import { OrgSwitcher, usePortalAccess } from '@mpbhealth/auth';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useCRM } from '../contexts/CRMContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { NotificationTicker } from '../components/NotificationTicker';
import { FooterCommandBar } from '../components/FooterCommandBar';
import { AIChatWidget } from '../components/ai-chat';
import CommandPalette from '../components/CommandPalette';
import { AICommandBar } from '../components/AICommandBar';
import GlobalSearch from '../components/GlobalSearch';
import { RouteErrorBoundary } from '../components/ErrorBoundary';
import { AddLeadModal } from '../components/AddLeadModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { AddDealModal } from '../components/AddDealModal';
import { AddNoteModal, LogCallModal, LogMeetingModal } from '../components/QuickActionModals';
import { AICommandPaletteModal } from '../components/AICommandPaletteModal';
import { ComplianceChecklistModal } from '../components/ComplianceChecklistModal';
import { CommissionSimulatorModal } from '../components/CommissionSimulatorModal';
import { NeedsAnalysisWizard } from '../components/NeedsAnalysisWizard';
import { PlanComparisonModal } from '../components/PlanComparisonModal';
import { PolicyRenewalModal } from '../components/PolicyRenewalModal';
import { CallCoachingPanel } from '../components/CallCoachingPanel';
import { SmartCadenceModal } from '../components/SmartCadenceModal';
import { ClientPortalModal } from '../components/ClientPortalModal';
import { ReferralAttributionModal } from '../components/ReferralAttributionModal';
import { DocumentGenerateModal } from '../components/DocumentGenerateModal';
import { TerritoryMapModal } from '../components/TerritoryMapModal';
import { RateQuoteCalculator } from '../components/RateQuoteCalculator';
import { Client360Modal } from '../components/Client360Modal';
import { HouseholdManagerModal } from '../components/HouseholdManagerModal';
import { WinLossAnalysisModal } from '../components/WinLossAnalysisModal';
import { EmailTemplateStudio } from '../components/EmailTemplateStudio';
import { BulkSMSCampaignModal } from '../components/BulkSMSCampaignModal';
import { TeamChallengeModal } from '../components/TeamChallengeModal';
import { CarrierRateAlertModal } from '../components/CarrierRateAlertModal';
import { CalendarSyncModal } from '../components/CalendarSyncModal';
import { SLADashboardModal } from '../components/SLADashboardModal';
import { GoalTrackerModal } from '../components/GoalTrackerModal';
import { AIEmailWriterModal } from '../components/AIEmailWriterModal';
import { PageHelpButton, HelpPanel } from '../components/help';
import toast from 'react-hot-toast';

interface ExtendedNavChild {
  name: string;
  href: string;
  permission?: string;
}

interface ExtendedNavItem extends Omit<NavItem, 'children'> {
  permission?: string;
  children?: ExtendedNavChild[];
}

// ============================================================================
// Navigation Configuration with Grouped Sections
// ============================================================================

interface NavSection {
  id: string;
  label?: string; // Optional section label
  items: ExtendedNavItem[];
}

const navigationSections: NavSection[] = [
  {
    id: 'main',
    items: [
      { name: 'Today', href: '/today', icon: Zap },
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'leads',
    label: 'Lead Management',
    items: [
      { name: 'Leads', href: '/leads', icon: Users, permission: 'leads.read' },
      { name: 'Quick Rate Leads', href: '/leads/quick-rate-estimate', icon: Calculator, permission: 'leads.read' },
      { name: 'Reactivation', href: '/reactivation', icon: Clock, permission: 'leads.read' },
      { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline.read' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    items: [
      { name: 'Accounts', href: '/accounts', icon: Building2, permission: 'accounts.read' },
      { name: 'Contacts', href: '/contacts', icon: UserCircle, permission: 'contacts.read' },
      { name: 'Deals', href: '/deals', icon: DollarSign, permission: 'deals.read' },
      { name: 'Deal Pipeline', href: '/deal-pipeline', icon: GitBranch, permission: 'deals.read' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Billing',
    items: [
      { name: 'Products', href: '/products', icon: Package, permission: 'products.read' },
      { name: 'Quotes', href: '/quotes', icon: FileCheck, permission: 'quotes.read' },
      { name: 'Invoices', href: '/invoices', icon: Receipt, permission: 'invoices.read' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns.read' },
      { name: 'Social Media', href: '/social-media', icon: Share2, permission: 'campaigns.read' },
      { name: 'Ad Campaigns', href: '/social-media/ads', icon: LayoutGrid, permission: 'campaigns.read' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    items: [
      { name: 'Referral Partners', href: '/referral-partners', icon: Handshake, permission: 'referrals.read' },
      { name: 'Outside Advisors', href: '/outside-advisors', icon: UserCheck, permission: 'outside_advisors.read' },
      { name: 'Community Events', href: '/community-events', icon: Heart, permission: 'community_events.read' },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    items: [
      { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays, permission: 'tasks.read' },
      { name: 'End of Day', href: '/end-of-day', icon: Sunset, permission: 'leads.write' },
      { name: 'Meetings', href: '/meetings', icon: Video, permission: 'tasks.read' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      {
        name: 'Reports',
        href: '#',
        icon: BarChart3,
        children: [
          { name: 'Overview', href: '/reports', permission: 'reports.read' },
          { name: 'Annual Overview', href: '/reports/annual', permission: 'reports.read' },
          { name: 'Performance', href: '/reports/performance', permission: 'reports.read' },
          { name: 'Lead Sources', href: '/reports/source-breakdown', permission: 'reports.read' },
          { name: 'Revenue', href: '/reports/revenue', permission: 'reports.read' },
          { name: 'Conversion', href: '/reports/conversion', permission: 'reports.read' },
          { name: 'Activity vs Targets', href: '/reports/activity-targets', permission: 'reports.read' },
          { name: 'Advisor Production', href: '/reports/advisor-production', permission: 'reports.read' },
          { name: 'Milestones', href: '/milestones', permission: 'targets.read' },
        ],
      },
      { name: 'Sales Activity', href: '/sales-activity', icon: Activity, permission: 'reports.read' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    items: [
      { name: 'Inbox', href: '/email/inbox', icon: Inbox, permission: 'email.read' },
      {
        name: 'Email',
        href: '#',
        icon: Mail,
        permission: 'email.read',
        children: [
          { name: 'Sent Emails', href: '/email/sent', permission: 'email.read' },
          { name: 'Schedules', href: '/email/schedules', permission: 'email.templates' },
          { name: 'Sequences', href: '/email/sequences', permission: 'email.read' },
          { name: 'Deliverability', href: '/email/deliverability', permission: 'email.read' },
        ],
      },
      { name: 'Signatures', href: '/email/signatures', icon: PenTool, permission: 'email.read' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { name: 'Team', href: '/team', icon: ShieldCheck, permission: 'team.view' },
      { name: 'Templates', href: '/templates', icon: FileText, permission: 'settings.manage' },
      { name: 'Automation', href: '/automation', icon: Zap, permission: 'settings.manage' },
      { name: 'Studio', href: '/studio', icon: Settings2, permission: 'settings.manage' },
      { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { name: 'Learning Center', href: '/learning-center', icon: BookOpen },
    ],
  },
];

// Flatten for backward compatibility
const navigation: ExtendedNavItem[] = navigationSections.flatMap(section => section.items);

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { orgs, activeOrg, orgRole, can, switchOrg } = useOrg();
  const { dashboardStats, tasksDueToday, overdueTasks } = useCRM();
  const { canAccessAdmin, canAccessAdvisor, canAccessCrm, canAccessWebsite, canAccessSupport } = usePortalAccess(user?.id);

  // Footer command bar modal state
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);

  // Phase 1-3 modal state
  const [showAICommandPalette, setShowAICommandPalette] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showCommissionSim, setShowCommissionSim] = useState(false);
  const [showNeedsAnalysis, setShowNeedsAnalysis] = useState(false);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showPolicyRenewal, setShowPolicyRenewal] = useState(false);
  const [showCallCoaching, setShowCallCoaching] = useState(false);
  const [showSmartCadence, setShowSmartCadence] = useState(false);
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [showReferralAttribution, setShowReferralAttribution] = useState(false);
  const [showDocumentGenerate, setShowDocumentGenerate] = useState(false);
  const [showTerritoryMap, setShowTerritoryMap] = useState(false);

  // Wave 2 modal state
  const [showRateQuote, setShowRateQuote] = useState(false);
  const [showClient360, setShowClient360] = useState(false);
  const [showHousehold, setShowHousehold] = useState(false);
  const [showWinLoss, setShowWinLoss] = useState(false);
  const [showEmailStudio, setShowEmailStudio] = useState(false);
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [showTeamChallenge, setShowTeamChallenge] = useState(false);
  const [showCarrierAlerts, setShowCarrierAlerts] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showSLADashboard, setShowSLADashboard] = useState(false);
  const [showGoalTracker, setShowGoalTracker] = useState(false);
  const [showAIEmailWriter, setShowAIEmailWriter] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  // Extract leadId from URL when on a lead detail page
  const leadIdMatch = location.pathname.match(/^\/leads\/([a-f0-9-]+)$/i);
  const currentLeadId = leadIdMatch?.[1] ?? null;

  useEffect(() => {
    const handler = (e: Event) => {
      const actionId = (e as CustomEvent).detail?.action;
      switch (actionId) {
        case 'add-lead':
          setShowAddLead(true);
          break;
        case 'add-task':
          setShowAddTask(true);
          break;
        case 'add-deal':
          setShowAddDeal(true);
          break;
        case 'add-note':
          if (currentLeadId) { setShowAddNote(true); }
          else { toast('Navigate to a lead first to add a note', { icon: '📝' }); }
          break;
        case 'log-call':
          if (currentLeadId) { setShowLogCall(true); }
          else { toast('Navigate to a lead first to log a call', { icon: '📞' }); }
          break;
        case 'add-event':
          if (currentLeadId) { setShowLogMeeting(true); }
          else { toast('Navigate to a lead first to log a meeting', { icon: '📅' }); }
          break;
        case 'send-email':
          navigate('/email/inbox?compose=true');
          break;
        case 'ai-command': setShowAICommandPalette(true); break;
        case 'compliance': setShowCompliance(true); break;
        case 'commission-sim': setShowCommissionSim(true); break;
        case 'needs-analysis': setShowNeedsAnalysis(true); break;
        case 'plan-comparison': setShowPlanComparison(true); break;
        case 'policy-renewal': setShowPolicyRenewal(true); break;
        case 'call-coaching':
          if (currentLeadId) { setShowCallCoaching(true); }
          else { toast('Navigate to a lead first for call coaching', { icon: '🎯' }); }
          break;
        case 'smart-cadence': setShowSmartCadence(true); break;
        case 'client-portal':
          if (currentLeadId) { setShowClientPortal(true); }
          else { toast('Navigate to a lead first to generate a portal', { icon: '🌐' }); }
          break;
        case 'referral-attribution': setShowReferralAttribution(true); break;
        case 'document-generate': setShowDocumentGenerate(true); break;
        case 'territory-map': setShowTerritoryMap(true); break;
        case 'rate-quote': setShowRateQuote(true); break;
        case 'client-360':
          if (currentLeadId) { setShowClient360(true); }
          else { toast('Navigate to a lead first for Client 360', { icon: '👤' }); }
          break;
        case 'household':
          if (currentLeadId) { setShowHousehold(true); }
          else { toast('Navigate to a lead first for Household Manager', { icon: '👨‍👩‍👧‍👦' }); }
          break;
        case 'win-loss': setShowWinLoss(true); break;
        case 'email-studio': setShowEmailStudio(true); break;
        case 'bulk-sms': setShowBulkSMS(true); break;
        case 'team-challenge': setShowTeamChallenge(true); break;
        case 'carrier-alerts': setShowCarrierAlerts(true); break;
        case 'calendar-sync': setShowCalendarSync(true); break;
        case 'sla-dashboard': setShowSLADashboard(true); break;
        case 'goal-tracker': setShowGoalTracker(true); break;
        case 'ai-email-writer': setShowAIEmailWriter(true); break;
      }
    };
    const helpHandler = () => setShowHelpPanel((v) => !v);
    window.addEventListener('crm:quick-action', handler);
    window.addEventListener('crm:toggle-help-panel', helpHandler);
    return () => {
      window.removeEventListener('crm:quick-action', handler);
      window.removeEventListener('crm:toggle-help-panel', helpHandler);
    };
  }, [currentLeadId, navigate]);

  // Global keyboard shortcuts for power features
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === '/') {
        e.preventDefault();
        setShowHelpPanel((prev) => !prev);
        return;
      }
      if (mod && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'a': e.preventDefault(); setShowAICommandPalette(true); break;
          case 'c': e.preventDefault(); setShowCompliance(true); break;
          case 'm': e.preventDefault(); setShowCommissionSim(true); break;
          case 'n': e.preventDefault(); setShowNeedsAnalysis(true); break;
          case 'p': e.preventDefault(); setShowPlanComparison(true); break;
          case 'r': e.preventDefault(); setShowPolicyRenewal(true); break;
          case 'd': e.preventDefault(); setShowDocumentGenerate(true); break;
          case 't': e.preventDefault(); setShowTerritoryMap(true); break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['crmLeadsList'] });
    queryClient.invalidateQueries({ queryKey: ['crmLeadDetail'] });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const totalPendingTasks = tasksDueToday.length + overdueTasks.length;

  // Filter nav items based on permissions and feature flags
  const visibleNav: NavItem[] = navigation
    .filter((item) => {
      if (item.children?.length) {
        const anyChildVisible = item.children.some(
          (child) => !child.permission || can(child.permission),
        );
        if (!anyChildVisible) return false;
        if (item.permission) return can(item.permission);
        return true;
      }
      if (!item.permission) return true;
      return can(item.permission);
    })
    .map((item) => ({
      name: item.name,
      href: item.href,
      icon: item.icon,
      children: item.children
        ?.filter((child) => !child.permission || can(child.permission))
        .map((child) => ({ name: child.name, href: child.href })),
      badge:
        item.name === 'Tasks' && totalPendingTasks > 0 ? (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {totalPendingTasks}
          </span>
        ) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);

  const renderNavLink = (item: NavItem, props: NavLinkRenderProps) => {
    const isActive = location.pathname === item.href ||
      (item.children && item.children.some(c => location.pathname === c.href));
    return (
      <NavLink
        to={item.href}
        className={`${props.className} ${
          isActive
            ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
            : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
        }`}
        onClick={props.onClick}
      >
        {props.children}
      </NavLink>
    );
  };

  const renderChildNavLink = (child: { name: string; href: string }, props: NavLinkRenderProps) => {
    const isActive = location.pathname === child.href;
    return (
      <NavLink
        key={child.name}
        to={child.href}
        onClick={props.onClick}
        className={`${props.className} ${
          isActive
            ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
            : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
        }`}
      >
        {props.children}
      </NavLink>
    );
  };

  const safeGetPortalUrl = useCallback((portal: PortalKey): string => {
    try {
      return getPortalUrl(portal as Parameters<typeof getPortalUrl>[0]);
    } catch {
      return '#';
    }
  }, []);

  const getPortalUrlWithSSO = useCallback(async (portal: PortalKey): Promise<string | null> => {
    const baseUrl = safeGetPortalUrl(portal);
    if (!baseUrl || baseUrl === '#') return null;
    return buildPortalSSOUrl(baseUrl, supabase);
  }, [safeGetPortalUrl]);

  const userSection = (
    <div className="space-y-3">
      {/* Org Switcher */}
      <div className="px-2">
        <OrgSwitcher
          orgs={orgs}
          activeOrg={activeOrg}
          onSwitch={switchOrg}
          className="w-full"
        />
      </div>
      {/* User info */}
      <div className="flex items-center space-x-3 px-3">
        <div className="w-9 h-9 bg-[rgb(var(--sidebar-text)_/_0.12)] rounded-full flex items-center justify-center">
          <span className="text-[rgb(var(--sidebar-text-active))] font-medium text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--sidebar-text-active))] truncate">
            {user?.email?.split('@')[0]}
          </p>
          {orgRole && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[rgb(var(--sidebar-text)_/_0.7)]" />
              <p className="text-xs text-[rgb(var(--sidebar-text)_/_0.7)] capitalize">{orgRole}</p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center px-3 py-2 text-sm text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4 mr-3" />
        Sign out
      </button>
    </div>
  );

  // Breadcrumb from current path
  const breadcrumbSegments = location.pathname.split('/').filter(Boolean);
  const currentSection = navigationSections.find(s =>
    s.items.some(item => location.pathname.startsWith(item.href) && item.href !== '#')
  );

  const topBarActions = (
    <div className="flex items-center gap-2">
      {/* AI Command Bar Trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'j',
            metaKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-violet-500/10 to-blue-500/10 hover:from-violet-500/20 hover:to-blue-500/20 rounded-lg text-xs text-violet-600 dark:text-violet-400 transition-colors border border-violet-200/50 dark:border-violet-500/20"
        title="AI Command Bar (⌘J)"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <kbd className="text-[10px] bg-violet-100/50 dark:bg-violet-500/10 px-1 py-0.5 rounded font-mono">⌘J</kbd>
      </button>

      {/* Command Palette Trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-tertiary hover:bg-surface-secondary rounded-lg text-xs text-th-text-tertiary transition-colors"
        title="Command Palette (⌘K)"
      >
        <Command className="w-3.5 h-3.5" />
        <kbd className="text-[10px] bg-white/10 px-1 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Divider */}
      <div className="hidden lg:block h-6 w-px bg-th-border/60" />

      {/* Stats badges */}
      {dashboardStats && (
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{dashboardStats.new_leads}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">new</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">{dashboardStats.total_leads}</span>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70">total</span>
          </div>
        </div>
      )}

      {/* Help */}
      <PageHelpButton onClick={() => setShowHelpPanel(true)} />

      {/* Notifications */}
      <NotificationCenter />
    </div>
  );

  return (
    <>
      {/* Command Palette (Cmd+K) and AI Command Bar (Cmd+J) */}
      <CommandPalette />
      <AICommandBar />
      <AIChatWidget />

      <AppLayout
        appName="CRM"
        logoSrc="/assets/MPB-Health-No-background.png"
        navigation={visibleNav}
        portalSwitcher={
          <PortalSwitcher
            currentPortal="crm"
            canAccessAdmin={canAccessAdmin}
            canAccessCRM={canAccessCrm}
            canAccessAdvisor={canAccessAdvisor}
            canAccessWebsite={canAccessWebsite}
            canAccessSupport={canAccessSupport}
            getPortalUrl={safeGetPortalUrl}
            getPortalUrlWithSSO={getPortalUrlWithSSO}
          />
        }
        userSection={userSection}
        topBarCenter={
          <div className="flex items-center gap-4 w-full">
            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-th-text-tertiary shrink-0">
              <span className="font-medium text-th-text-secondary">CRM</span>
              {currentSection?.label && (
                <>
                  <span className="text-th-border-strong">/</span>
                  <span>{currentSection.label}</span>
                </>
              )}
              {breadcrumbSegments.length > 0 && (
                <>
                  <span className="text-th-border-strong">/</span>
                  <span className="text-th-text-primary font-medium capitalize">
                    {breadcrumbSegments[breadcrumbSegments.length - 1].replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <GlobalSearch />
            </div>
          </div>
        }
        topBarActions={topBarActions}
        renderNavLink={renderNavLink}
        renderChildNavLink={renderChildNavLink}
        footerBar={<FooterCommandBar />}
      >
        <NotificationTicker />

        <RouteErrorBoundary>
          {children}
        </RouteErrorBoundary>
      </AppLayout>

      {/* Footer command bar modals */}
      <AddLeadModal
        open={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSuccess={(leadId) => {
          setShowAddLead(false);
          handleModalSuccess();
          navigate(`/leads/${leadId}`);
        }}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        leadId={currentLeadId ?? undefined}
        onSuccess={() => {
          setShowAddTask(false);
          handleModalSuccess();
        }}
      />
      <AddDealModal
        open={showAddDeal}
        onClose={() => setShowAddDeal(false)}
        onSuccess={(dealId) => {
          setShowAddDeal(false);
          handleModalSuccess();
          navigate(`/deals/${dealId}`);
        }}
      />
      {currentLeadId && (
        <>
          <AddNoteModal
            open={showAddNote}
            onClose={() => setShowAddNote(false)}
            leadId={currentLeadId}
            onSuccess={() => {
              setShowAddNote(false);
              handleModalSuccess();
            }}
          />
          <LogCallModal
            open={showLogCall}
            onClose={() => setShowLogCall(false)}
            leadId={currentLeadId}
            onSuccess={() => {
              setShowLogCall(false);
              handleModalSuccess();
            }}
          />
          <LogMeetingModal
            open={showLogMeeting}
            onClose={() => setShowLogMeeting(false)}
            leadId={currentLeadId}
            onSuccess={() => {
              setShowLogMeeting(false);
              handleModalSuccess();
            }}
          />
        </>
      )}

      {/* ---- Phase 1-3 Power Feature Modals ---- */}
      <AICommandPaletteModal open={showAICommandPalette} onClose={() => setShowAICommandPalette(false)} />
      <ComplianceChecklistModal
        open={showCompliance}
        onClose={() => setShowCompliance(false)}
        leadName={currentLeadId ? 'Current Lead' : 'Client'}
        leadId={currentLeadId || ''}
        items={[]}
        onMarkComplete={async () => {}}
        onUploadDocument={async () => {}}
      />
      <CommissionSimulatorModal open={showCommissionSim} onClose={() => setShowCommissionSim(false)} />
      <NeedsAnalysisWizard
        open={showNeedsAnalysis}
        onClose={() => setShowNeedsAnalysis(false)}
        leadId={currentLeadId || undefined}
        leadName={currentLeadId ? 'Client' : undefined}
      />
      <PlanComparisonModal open={showPlanComparison} onClose={() => setShowPlanComparison(false)} />
      <PolicyRenewalModal open={showPolicyRenewal} onClose={() => setShowPolicyRenewal(false)} />
      <CallCoachingPanel
        open={showCallCoaching}
        onClose={() => setShowCallCoaching(false)}
        leadName={currentLeadId ? 'Client' : 'Lead'}
        leadId={currentLeadId || undefined}
      />
      <SmartCadenceModal open={showSmartCadence} onClose={() => setShowSmartCadence(false)} />
      <ClientPortalModal
        open={showClientPortal}
        onClose={() => setShowClientPortal(false)}
        clientName={currentLeadId ? 'Client' : 'Client'}
        clientEmail="client@example.com"
        clientId={currentLeadId || ''}
      />
      <ReferralAttributionModal open={showReferralAttribution} onClose={() => setShowReferralAttribution(false)} />
      <DocumentGenerateModal
        open={showDocumentGenerate}
        onClose={() => setShowDocumentGenerate(false)}
        clientName={currentLeadId ? 'Client' : 'Client'}
        clientEmail="client@example.com"
        leadId={currentLeadId || undefined}
      />
      <TerritoryMapModal open={showTerritoryMap} onClose={() => setShowTerritoryMap(false)} />

      {/* ---- Wave 2 Power Feature Modals ---- */}
      <RateQuoteCalculator
        open={showRateQuote}
        onClose={() => setShowRateQuote(false)}
        leadName={currentLeadId ? 'Current Lead' : 'Client'}
        leadId={currentLeadId || undefined}
      />
      <Client360Modal
        open={showClient360}
        onClose={() => setShowClient360(false)}
        leadId={currentLeadId || undefined}
      />
      <HouseholdManagerModal
        open={showHousehold}
        onClose={() => setShowHousehold(false)}
        primaryName={currentLeadId ? 'Current Lead' : 'Client'}
        leadId={currentLeadId || undefined}
      />
      <WinLossAnalysisModal open={showWinLoss} onClose={() => setShowWinLoss(false)} />
      <EmailTemplateStudio open={showEmailStudio} onClose={() => setShowEmailStudio(false)} />
      <BulkSMSCampaignModal open={showBulkSMS} onClose={() => setShowBulkSMS(false)} />
      <TeamChallengeModal open={showTeamChallenge} onClose={() => setShowTeamChallenge(false)} />
      <CarrierRateAlertModal open={showCarrierAlerts} onClose={() => setShowCarrierAlerts(false)} />
      <CalendarSyncModal open={showCalendarSync} onClose={() => setShowCalendarSync(false)} />
      <SLADashboardModal open={showSLADashboard} onClose={() => setShowSLADashboard(false)} />
      <GoalTrackerModal open={showGoalTracker} onClose={() => setShowGoalTracker(false)} />
      <AIEmailWriterModal
        open={showAIEmailWriter}
        onClose={() => setShowAIEmailWriter(false)}
        recipientName={currentLeadId ? 'Client' : undefined}
      />

      {/* Help Panel (Ctrl+/) */}
      <HelpPanel open={showHelpPanel} onClose={() => setShowHelpPanel(false)} />
    </>
  );
}
