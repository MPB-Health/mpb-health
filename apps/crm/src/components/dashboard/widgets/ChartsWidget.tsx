// ============================================================================
// Charts Widget
// Customizable data visualizations using recharts
// ============================================================================

import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

// ============================================================================
// Chart Colors
// ============================================================================

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

// ============================================================================
// Charts Widget Component
// ============================================================================

export default function ChartsWidget({ config, size }: BaseWidgetProps) {
  const { dashboardStats, pipelineStages } = useCRM();

  const chartType = (config.chartType as string) || 'bar';
  const dataSource = (config.dataSource as string) || 'leads_by_stage';

  const chartData = useMemo(() => {
    const stats = (dashboardStats as unknown) as Record<string, unknown>;

    switch (dataSource) {
      case 'leads_by_stage': {
        const byStage = (stats.leads_by_stage as Record<string, number>) || {};
        return pipelineStages.map((stage, index) => ({
          name: stage.display_name,
          value: byStage[stage.name] || 0,
          color: stage.color || COLORS[index % COLORS.length],
        }));
      }

      case 'leads_by_priority': {
        const byPriority = (stats.leads_by_priority as Record<string, number>) || {};
        const priorities = ['urgent', 'high', 'medium', 'low'];
        const priorityColors: Record<string, string> = {
          urgent: '#EF4444',
          high: '#F59E0B',
          medium: '#10B981',
          low: '#6B7280',
        };
        return priorities.map((priority) => ({
          name: priority.charAt(0).toUpperCase() + priority.slice(1),
          value: byPriority[priority] || 0,
          color: priorityColors[priority],
        }));
      }

      case 'conversion_funnel': {
        return [
          { name: 'New', value: 100, color: COLORS[0] },
          { name: 'Contacted', value: 75, color: COLORS[1] },
          { name: 'Qualified', value: 50, color: COLORS[2] },
          { name: 'Proposal', value: 30, color: COLORS[3] },
          { name: 'Won', value: 15, color: COLORS[4] },
        ];
      }

      case 'leads_over_time': {
        // Mock time series data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day) => ({
          name: day,
          value: Math.floor(Math.random() * 20) + 5,
          color: COLORS[0],
        }));
      }

      default:
        return [];
    }
  }, [dashboardStats, pipelineStages, dataSource]);

  const height = size === 'lg' || size === 'full' ? 300 : 200;

  return (
    <div className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={size === 'md' ? 60 : 80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : chartType === 'line' ? (
          <LineChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ fill: COLORS[0] }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
