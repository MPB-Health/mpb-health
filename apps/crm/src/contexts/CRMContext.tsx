import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  createLeadService,
  createPipelineService,
  createActivityService,
  createTaskService,
  createZohoService,
  createNotificationService,
  createCalendarService,
  createInsightsService,
  createPreferencesService,
  createTemplateService,
  createEmailService,
  createNotificationCenterService,
  createAutomationService,
  createReportingService,
  createScoringService,
  createDealService,
  createAccountService,
  createContactService,
  type Lead,
  type PipelineStage,
  type CRMDashboardStats,
  type LeadTask,
  type LeadActivity,
  type CalendarEvent,
  type LeadService,
  type PipelineService,
  type ActivityService,
  type TaskService,
  type ZohoService,
  type NotificationService,
  type CalendarService,
  type InsightsService,
  type PreferencesService,
  type TemplateService,
  type EmailService,
  type NotificationCenterService,
  type AutomationService,
  type ReportingService,
  type ScoringService,
  type DealService,
  type DealStage,
  type AccountService,
  type ContactService,
} from '@mpbhealth/crm-core';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useOrg } from './OrgContext';

interface CRMContextType {
  // Services
  leadService: LeadService;
  pipelineService: PipelineService;
  activityService: ActivityService;
  taskService: TaskService;
  zohoService: ZohoService;
  notificationService: NotificationService;
  calendarService: CalendarService;
  insightsService: InsightsService;
  preferencesService: PreferencesService;
  templateService: TemplateService;
  emailService: EmailService;
  notificationCenterService: NotificationCenterService;
  automationService: AutomationService;
  reportingService: ReportingService;
  scoringService: ScoringService;
  dealService: DealService;
  accountService: AccountService;
  contactService: ContactService;

  // State
  dashboardStats: CRMDashboardStats | null;
  pipelineStages: PipelineStage[];
  dealStages: DealStage[];
  recentLeads: Lead[];
  tasksDueToday: LeadTask[];
  overdueTasks: LeadTask[];
  recentActivities: LeadActivity[];
  calendarEvents: CalendarEvent[];

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshCalendar: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const { activeOrgId, orgLoading } = useOrg();

  // Initialize services
  const [services] = useState(() => ({
    leadService: createLeadService(supabase),
    pipelineService: createPipelineService(supabase),
    activityService: createActivityService(supabase),
    taskService: createTaskService(supabase),
    zohoService: createZohoService(supabase, supabaseUrl),
    notificationService: createNotificationService(supabase),
    calendarService: createCalendarService(supabase),
    insightsService: createInsightsService(supabase, supabaseUrl),
    preferencesService: createPreferencesService(supabase),
    templateService: createTemplateService(supabase),
    emailService: createEmailService(supabase, supabaseUrl),
    notificationCenterService: createNotificationCenterService(supabase),
    automationService: createAutomationService(supabase, supabaseUrl),
    reportingService: createReportingService(supabase),
    scoringService: createScoringService(supabase),
    dealService: createDealService(supabase),
    accountService: createAccountService(supabase),
    contactService: createContactService(supabase),
  }));

  // State
  const [dashboardStats, setDashboardStats] = useState<CRMDashboardStats | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [dealStages, setDealStages] = useState<DealStage[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<LeadTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LeadTask[]>([]);
  const [recentActivities, setRecentActivities] = useState<LeadActivity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh functions
  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const [stats, stages, dStages, activities] = await Promise.all([
        services.pipelineService.getDashboardStats(),
        services.pipelineService.getPipelineStages(),
        services.dealService.getStages(),
        services.activityService.getRecentActivities(10),
      ]);

      setDashboardStats(stats);
      setPipelineStages(stages);
      setDealStages(dStages);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [services]);

  const refreshLeads = useCallback(async () => {
    try {
      const { leads } = await services.leadService.getLeads({}, 10, 0);
      setRecentLeads(leads);
    } catch (error) {
      console.error('Error refreshing leads:', error);
    }
  }, [services]);

  const refreshTasks = useCallback(async () => {
    try {
      const [today, overdue] = await Promise.all([
        services.taskService.getTasksDueToday(),
        services.taskService.getOverdueTasks(),
      ]);
      setTasksDueToday(today);
      setOverdueTasks(overdue);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  }, [services]);

  const refreshCalendar = useCallback(async () => {
    try {
      const events = await services.calendarService.getUpcomingEvents(30);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error refreshing calendar:', error);
    }
  }, [services]);

  // Reload all data when active org changes (RLS will scope results server-side)
  useEffect(() => {
    if (orgLoading || !activeOrgId) return;

    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        refreshDashboard(),
        refreshLeads(),
        refreshTasks(),
        refreshCalendar(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [activeOrgId, orgLoading, refreshDashboard, refreshLeads, refreshTasks, refreshCalendar]);

  // Set up real-time notifications
  useEffect(() => {
    const handleNewLead = () => {
      refreshLeads();
      refreshDashboard();
    };

    services.notificationService.subscribeToLeadSubmissions(handleNewLead);

    return () => {
      services.notificationService.unsubscribeAll();
    };
  }, [services, refreshLeads, refreshDashboard]);

  return (
    <CRMContext.Provider
      value={{
        ...services,
        dashboardStats,
        pipelineStages,
        dealStages,
        recentLeads,
        tasksDueToday,
        overdueTasks,
        recentActivities,
        calendarEvents,
        loading,
        refreshing,
        refreshDashboard,
        refreshLeads,
        refreshTasks,
        refreshCalendar,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
