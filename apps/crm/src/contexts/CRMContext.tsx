/**
 * CRM shell data + actions. Server state for dashboard / leads / tasks / calendar is backed by
 * TanStack Query (dedupe, stale-while-revalidate, targeted invalidation). Service factories live
 * in CRMServiceContext — use `useCRMService()` when you only need API clients and must avoid
 * rerenders from dashboard/leads/etc.
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Lead,
  PipelineStage,
  CRMDashboardStats,
  LeadTask,
  LeadActivity,
  CalendarEvent,
  DealStage,
} from '@mpbhealth/crm-core';
import { crmQueryClient } from '../query/crmQueryClient';
import { attachCRMQueryDiagnostics } from '../query/crmQueryDiagnostics';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { CRMServiceProvider, useCRMService, type CRMServiceContextType } from './CRMServiceContext';
import { useOrg } from './OrgContext';

/** Coalesce realtime-driven invalidations */
const REALTIME_INVALIDATION_DEBOUNCE_MS = 1_200;

export interface CRMContextType extends CRMServiceContextType {
  dashboardStats: CRMDashboardStats | null;
  pipelineStages: PipelineStage[];
  dealStages: DealStage[];
  recentLeads: Lead[];
  tasksDueToday: LeadTask[];
  overdueTasks: LeadTask[];
  recentActivities: LeadActivity[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
  refreshing: boolean;
  refreshDashboard: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshCalendar: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | null>(null);

function CRMQueryDataProvider({ children }: { children: ReactNode }) {
  const svc = useCRMService();
  const queryClient = useQueryClient();
  const { activeOrgId, orgLoading } = useOrg();
  const orgReady = !!activeOrgId && !orgLoading;

  const dashboardQuery = useQuery({
    queryKey: crmQueryKeys.dashboard(activeOrgId),
    queryFn: async () => {
      const [stats, stages, dStages, activities] = await Promise.all([
        svc.pipelineService.getDashboardStats(),
        svc.pipelineService.getPipelineStages(),
        svc.dealService.getStages(),
        svc.activityService.getRecentActivities(10),
      ]);
      return { stats, stages, dStages, activities };
    },
    enabled: orgReady,
    staleTime: 45_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const leadsQuery = useQuery({
    queryKey: crmQueryKeys.recentLeads(activeOrgId),
    queryFn: async () => {
      const { leads } = await svc.leadService.getLeads({}, 10, 0);
      return leads;
    },
    enabled: orgReady,
    staleTime: 45_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const tasksQuery = useQuery({
    queryKey: crmQueryKeys.tasks(activeOrgId),
    queryFn: async () => {
      const [today, overdue] = await Promise.all([
        svc.taskService.getTasksDueToday(),
        svc.taskService.getOverdueTasks(),
      ]);
      return { today, overdue };
    },
    enabled: orgReady,
    staleTime: 45_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const calendarQuery = useQuery({
    queryKey: crmQueryKeys.calendar(activeOrgId),
    queryFn: () => svc.calendarService.getUpcomingEvents(30),
    enabled: orgReady,
    staleTime: 45_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const refreshDashboard = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crmQueryKeys.dashboard(activeOrgId) });
  }, [queryClient, activeOrgId]);

  const refreshLeads = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crmQueryKeys.recentLeads(activeOrgId) });
  }, [queryClient, activeOrgId]);

  const refreshTasks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks(activeOrgId) });
  }, [queryClient, activeOrgId]);

  const refreshCalendar = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crmQueryKeys.calendar(activeOrgId) });
  }, [queryClient, activeOrgId]);

  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orgReady) return;

    const handleNewLead = () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(() => {
        realtimeDebounceRef.current = null;
        void queryClient.invalidateQueries({ queryKey: crmQueryKeys.recentLeads(activeOrgId) });
        void queryClient.invalidateQueries({ queryKey: crmQueryKeys.dashboard(activeOrgId) });
      }, REALTIME_INVALIDATION_DEBOUNCE_MS);
    };

    svc.notificationService.subscribeToLeadSubmissions(handleNewLead);

    return () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      svc.notificationService.unsubscribeAll();
    };
  }, [orgReady, activeOrgId, svc.notificationService, queryClient]);

  const loading =
    !activeOrgId ||
    orgLoading ||
    dashboardQuery.isPending ||
    leadsQuery.isPending;

  const refreshing =
    (dashboardQuery.isFetching && !dashboardQuery.isPending) ||
    (leadsQuery.isFetching && !leadsQuery.isPending) ||
    (tasksQuery.isFetching && !tasksQuery.isPending) ||
    (calendarQuery.isFetching && !calendarQuery.isPending);

  const contextValue = useMemo<CRMContextType>(
    () => ({
      ...svc,
      dashboardStats: dashboardQuery.data?.stats ?? null,
      pipelineStages: dashboardQuery.data?.stages ?? [],
      dealStages: dashboardQuery.data?.dStages ?? [],
      recentActivities: dashboardQuery.data?.activities ?? [],
      recentLeads: leadsQuery.data ?? [],
      tasksDueToday: tasksQuery.data?.today ?? [],
      overdueTasks: tasksQuery.data?.overdue ?? [],
      calendarEvents: calendarQuery.data ?? [],
      loading,
      refreshing,
      refreshDashboard,
      refreshLeads,
      refreshTasks,
      refreshCalendar,
    }),
    [
      svc,
      dashboardQuery.data,
      leadsQuery.data,
      tasksQuery.data,
      calendarQuery.data,
      loading,
      refreshing,
      refreshDashboard,
      refreshLeads,
      refreshTasks,
      refreshCalendar,
    ]
  );

  return <CRMContext.Provider value={contextValue}>{children}</CRMContext.Provider>;
}

function CRMQueryDiagnosticsMount() {
  const queryClient = useQueryClient();
  useEffect(() => {
    attachCRMQueryDiagnostics(queryClient, import.meta.env.DEV);
  }, [queryClient]);
  return null;
}

export function CRMProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={crmQueryClient}>
      <CRMQueryDiagnosticsMount />
      <CRMServiceProvider>
        <CRMQueryDataProvider>{children}</CRMQueryDataProvider>
      </CRMServiceProvider>
    </QueryClientProvider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}

export { useCRMService } from './CRMServiceContext';
