// ============================================================================
// AI Insights Widget
// Shows AI-powered recommendations and hot leads
// ============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, RefreshCw, Flame, Star } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface AIInsight {
  id: string;
  type: 'hot_lead' | 'recommendation' | 'trend' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionLabel?: string;
  actionLink?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AI Insights Widget Component
// ============================================================================

export default function AIInsightsWidget({ config, size }: BaseWidgetProps) {
  const { recentLeads, dashboardStats, pipelineStages } = useCRM();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const insightType = (config.insightType as string) || 'all';

  useEffect(() => {
    generateInsights();
  }, [recentLeads, dashboardStats, insightType]);

  const generateInsights = async () => {
    setIsLoading(true);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const stats = (dashboardStats as unknown) as Record<string, unknown>;
    const generatedInsights: AIInsight[] = [];

    // Hot leads analysis
    const highPriorityLeads = recentLeads.filter(
      (l) => l.priority === 'urgent' || l.priority === 'high'
    );

    highPriorityLeads.slice(0, 2).forEach((lead) => {
      const score = calculateLeadScore(lead);
      if (score > 70) {
        generatedInsights.push({
          id: `hot-${lead.id}`,
          type: 'hot_lead',
          title: 'Hot Lead Detected',
          description: `${lead.first_name} ${lead.last_name} shows high engagement signals. Recommend immediate follow-up.`,
          confidence: score,
          actionLabel: 'View Lead',
          actionLink: `/leads/${lead.id}`,
          metadata: { leadId: lead.id, score },
        });
      }
    });

    // Conversion trend insights
    const conversionRate = ((stats.leads_converted as number) || 0) / Math.max((stats.total_leads as number) || 1, 1);
    if (conversionRate > 0.15) {
      generatedInsights.push({
        id: 'trend-conversion',
        type: 'trend',
        title: 'Conversion Rate Trending Up',
        description: `Your conversion rate of ${(conversionRate * 100).toFixed(1)}% is above average. Keep up the momentum!`,
        confidence: 85,
      });
    } else if (conversionRate < 0.05 && (stats.total_leads as number) > 10) {
      generatedInsights.push({
        id: 'warning-conversion',
        type: 'warning',
        title: 'Low Conversion Rate',
        description: 'Your conversion rate is below target. Consider reviewing your follow-up process.',
        confidence: 90,
        actionLabel: 'View Pipeline',
        actionLink: '/pipeline',
      });
    }

    // Overdue tasks warning
    const overdueTasks = (stats.overdue_tasks as number) || 0;
    if (overdueTasks > 5) {
      generatedInsights.push({
        id: 'warning-tasks',
        type: 'warning',
        title: 'Multiple Overdue Tasks',
        description: `You have ${overdueTasks} overdue tasks. Prioritizing these could improve your pipeline health.`,
        confidence: 95,
        actionLabel: 'View Tasks',
        actionLink: '/tasks',
      });
    }

    // Recommendations based on pipeline
    const stageWithMostLeads = findStageWithMostLeads(stats.leads_by_stage as Record<string, number>);
    if (stageWithMostLeads) {
      generatedInsights.push({
        id: 'rec-pipeline',
        type: 'recommendation',
        title: 'Pipeline Bottleneck',
        description: `Most leads are in "${stageWithMostLeads}" stage. Consider focusing on moving these forward.`,
        confidence: 80,
        actionLabel: 'View Pipeline',
        actionLink: '/pipeline',
      });
    }

    // Best time to call recommendation
    generatedInsights.push({
      id: 'rec-timing',
      type: 'recommendation',
      title: 'Optimal Call Time',
      description: 'Based on historical data, leads are most responsive between 10-11 AM and 2-3 PM.',
      confidence: 75,
    });

    // Filter by type if specified
    let filtered = generatedInsights;
    if (insightType !== 'all') {
      filtered = generatedInsights.filter((i) => i.type === insightType);
    }

    // Sort by confidence
    filtered.sort((a, b) => b.confidence - a.confidence);

    setInsights(filtered.slice(0, 5));
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateInsights();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
          <span className="text-sm text-gray-500">Analyzing your data...</span>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No insights available</p>
        <p className="text-xs text-gray-400 mt-1">Add more data to generate AI insights</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Insights</p>
            <p className="text-xs text-gray-500">{insights.length} recommendations</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh insights"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Insight Card Component
// ============================================================================

interface InsightCardProps {
  insight: AIInsight;
}

const INSIGHT_ICONS: Record<string, typeof Sparkles> = {
  hot_lead: Flame,
  recommendation: Lightbulb,
  trend: TrendingUp,
  warning: AlertTriangle,
};

const INSIGHT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  hot_lead: {
    bg: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
    border: 'border-l-orange-500',
    icon: 'text-orange-500',
  },
  recommendation: {
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-l-blue-500',
    icon: 'text-blue-500',
  },
  trend: {
    bg: 'bg-gradient-to-r from-green-50 to-green-50 dark:from-green-900/20 dark:to-green-900/20',
    border: 'border-l-green-500',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    border: 'border-l-amber-500',
    icon: 'text-amber-500',
  },
};

function InsightCard({ insight }: InsightCardProps) {
  const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
  const styles = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.recommendation;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border-l-4',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex gap-3">
        <div className={cn('mt-0.5', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{insight.title}</p>
            <ConfidenceBadge confidence={insight.confidence} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {insight.description}
          </p>
          {insight.actionLink && (
            <Link
              to={insight.actionLink}
              className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {insight.actionLabel || 'Take action'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Confidence Badge Component
// ============================================================================

interface ConfidenceBadgeProps {
  confidence: number;
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const getColor = () => {
    if (confidence >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30';
    if (confidence >= 70) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700';
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', getColor())}>
      <Star className="h-3 w-3" />
      {confidence}%
    </span>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateLeadScore(lead: { priority?: string; created_at?: string }): number {
  let score = 50;

  // Priority boost
  if (lead.priority === 'urgent') score += 30;
  else if (lead.priority === 'high') score += 20;
  else if (lead.priority === 'medium') score += 10;

  // Recency boost
  if (lead.created_at) {
    const daysSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / 86400000;
    if (daysSinceCreated < 1) score += 20;
    else if (daysSinceCreated < 3) score += 10;
  }

  return Math.min(score, 100);
}

function findStageWithMostLeads(leadsByStage?: Record<string, number>): string | null {
  if (!leadsByStage) return null;

  let maxStage: string | null = null;
  let maxCount = 0;

  Object.entries(leadsByStage).forEach(([stage, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxStage = stage;
    }
  });

  return maxStage;
}
