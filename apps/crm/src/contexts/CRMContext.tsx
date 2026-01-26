import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createLeadService,
  createPipelineService,
  createActivityService,
  createTaskService,
  createZohoService,
  createNotificationService,
  type Lead,
  type PipelineStage,
  type CRMDashboardStats,
  type LeadTask,
  type LeadActivity,
  type LeadService,
  type PipelineService,
  type ActivityService,
  type TaskService,
  type ZohoService,
  type NotificationService,
} from '@mpbhealth/crm-core';
import { supabase, supabaseUrl } from '../lib/supabase';

interface CRMContextType {
  // Services
  leadService: LeadService;
  pipelineService: PipelineService;
  activityService: ActivityService;
  taskService: TaskService;
  zohoService: ZohoService;
  notificationService: NotificationService;

  // State
  dashboardStats: CRMDashboardStats | null;
  pipelineStages: PipelineStage[];
  recentLeads: Lead[];
  tasksDueToday: LeadTask[];
  overdueTasks: LeadTask[];
  recentActivities: LeadActivity[];

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  // Initialize services
  const [services] = useState(() => ({
    leadService: createLeadService(supabase),
    pipelineService: createPipelineService(supabase),
    activityService: createActivityService(supabase),
    taskService: createTaskService(supabase),
    zohoService: createZohoService(supabase, supabaseUrl),
    notificationService: createNotificationService(supabase),
  }));

  // State
  const [dashboardStats, setDashboardStats] = useState<CRMDashboardStats | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<LeadTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LeadTask[]>([]);
  const [recentActivities, setRecentActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh functions
  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      const [stats, stages, activities] = await Promise.all([
        services.pipelineService.getDashboardStats(),
        services.pipelineService.getPipelineStages(),
        services.activityService.getRecentActivities(10),
      ]);

      setDashboardStats(stats);
      setPipelineStages(stages);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshLeads = async () => {
    try {
      const { leads } = await services.leadService.getLeads({}, 10, 0);
      setRecentLeads(leads);
    } catch (error) {
      console.error('Error refreshing leads:', error);
    }
  };

  const refreshTasks = async () => {
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
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        refreshDashboard(),
        refreshLeads(),
        refreshTasks(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

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
  }, []);

  return (
    <CRMContext.Provider
      value={{
        ...services,
        dashboardStats,
        pipelineStages,
        recentLeads,
        tasksDueToday,
        overdueTasks,
        recentActivities,
        loading,
        refreshing,
        refreshDashboard,
        refreshLeads,
        refreshTasks,
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
