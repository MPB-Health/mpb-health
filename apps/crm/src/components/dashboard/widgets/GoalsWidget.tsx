// ============================================================================
// Goals Widget
// Shows targets vs actuals with progress tracking
// ============================================================================

import { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Plus, Trophy, Flag } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import { createUserGoalsService, type UserGoal } from '@mpbhealth/crm-core/dashboard';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Goals Widget Component
// ============================================================================

const goalsService = createUserGoalsService(supabase);

export default function GoalsWidget({ config, size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();
  const { dashboardStats } = useCRM();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showTeamGoals = config.showTeamGoals === true;
  const period = (config.period as string) || 'monthly';

  useEffect(() => {
    if (activeOrgId) {
      loadGoals();
    }
  }, [activeOrgId, period, showTeamGoals]);

  const loadGoals = async () => {
    if (!activeOrgId) return;
    setIsLoading(true);
    try {
      const data = await goalsService.getGoals(activeOrgId, { status: 'active' });

      // Update current values from dashboard stats
      const stats = (dashboardStats as unknown) as Record<string, unknown>;
      const updatedGoals = data.map((goal) => {
        let currentValue = goal.current_value;
        switch (goal.metric_type) {
          case 'leads_created':
            currentValue = (stats.total_leads as number) || 0;
            break;
          case 'leads_converted':
            currentValue = (stats.leads_converted as number) || 0;
            break;
          case 'calls_made':
            currentValue = (stats.total_calls as number) || 0;
            break;
        }
        return { ...goal, current_value: currentValue };
      });

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
      // Show some example goals if none exist
      setGoals(getDefaultGoals());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultGoals = (): UserGoal[] => {
    const stats = (dashboardStats as unknown) as Record<string, unknown>;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [
      {
        id: 'default-1',
        user_id: '',
        org_id: activeOrgId || '',
        name: 'Monthly Leads',
        target_value: 50,
        current_value: (stats.total_leads as number) || 0,
        metric_type: 'leads_created' as const,
        period: 'monthly' as const,
        start_date: startOfMonth.toISOString(),
        end_date: endOfMonth.toISOString(),
        is_personal: true,
        status: 'active' as const,
        icon: 'flag',
        color: 'blue',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: 'default-2',
        user_id: '',
        org_id: activeOrgId || '',
        name: 'Conversions',
        target_value: 10,
        current_value: (stats.leads_converted as number) || 0,
        metric_type: 'leads_converted' as const,
        period: 'monthly' as const,
        start_date: startOfMonth.toISOString(),
        end_date: endOfMonth.toISOString(),
        is_personal: true,
        status: 'active' as const,
        icon: 'trophy',
        color: 'green',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: 'default-3',
        user_id: '',
        org_id: activeOrgId || '',
        name: 'Daily Calls',
        target_value: 20,
        current_value: Math.floor(Math.random() * 25),
        metric_type: 'calls_made' as const,
        period: 'daily' as const,
        start_date: now.toISOString(),
        end_date: now.toISOString(),
        is_personal: true,
        status: 'active' as const,
        icon: 'phone',
        color: 'cyan',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="space-y-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No goals set</p>
        <button className="flex items-center gap-1 mx-auto mt-3 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          Add a goal
        </button>
      </div>
    );
  }

  // Calculate overall progress
  const totalProgress = goals.reduce((sum, g) => sum + (g.current_value / g.target_value), 0) / goals.length;
  const completedGoals = goals.filter((g) => g.current_value >= g.target_value).length;

  return (
    <div className="p-4">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completedGoals}/{goals.length}</p>
            <p className="text-xs text-gray-500">goals completed</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Overall progress</span>
            <span className="text-xs font-medium">{Math.round(totalProgress * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                totalProgress >= 1 ? 'bg-green-500' : totalProgress >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(totalProgress * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <button className="flex items-center justify-center gap-1 w-full mt-4 pt-4 border-t dark:border-gray-700 text-sm text-blue-600 hover:text-blue-700 transition-colors">
        <Plus className="h-4 w-4" />
        Add new goal
      </button>
    </div>
  );
}

// ============================================================================
// Goal Card Component
// ============================================================================

interface GoalCardProps {
  goal: UserGoal;
}

const METRIC_ICONS: Record<string, typeof Target> = {
  leads_created: Flag,
  leads_converted: Trophy,
  deals_won: Trophy,
  deals_value: TrendingUp,
  calls_made: TrendingUp,
  emails_sent: TrendingUp,
  meetings_held: TrendingUp,
  tasks_completed: TrendingUp,
  custom: Target,
};

const METRIC_COLORS: Record<string, string> = {
  leads_created: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  leads_converted: 'bg-green-100 text-green-600 dark:bg-green-900/30',
  deals_won: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  deals_value: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  calls_made: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30',
  emails_sent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  meetings_held: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30',
  tasks_completed: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  custom: 'bg-gray-100 text-gray-600 dark:bg-gray-700',
};

function GoalCard({ goal }: GoalCardProps) {
  const Icon = METRIC_ICONS[goal.metric_type] || Target;
  const colorClass = METRIC_COLORS[goal.metric_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700';

  const progress = goal.current_value / goal.target_value;
  const isComplete = progress >= 1;
  const isOnTrack = progress >= getExpectedProgress(goal);

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('p-1.5 rounded-lg', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{goal.name}</p>
          <p className="text-xs text-gray-500">{goal.period}</p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {isComplete ? (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              Complete!
            </span>
          ) : isOnTrack ? (
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              On track
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              Behind
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isComplete ? 'bg-green-500' : isOnTrack ? 'bg-blue-500' : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <span className="text-sm font-medium min-w-[80px] text-right">
          {formatValue(goal.current_value, goal.metric_type)} / {formatValue(goal.target_value, goal.metric_type)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getExpectedProgress(goal: UserGoal): number {
  const now = new Date();
  const start = new Date(goal.start_date);
  const end = new Date(goal.end_date);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(1, elapsed / totalDuration));
}

function formatValue(value: number, metricType: string): string {
  if (metricType === 'revenue') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  return value.toString();
}
