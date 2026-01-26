import { useCRM } from '../contexts/CRMContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];

export default function Reports() {
  const { dashboardStats, pipelineStages } = useCRM();

  const pipelineData = pipelineStages.map((stage) => ({
    name: stage.display_name,
    count: dashboardStats?.leads_by_stage?.[stage.name] || 0,
    color: stage.color,
  }));

  const priorityData = [
    { name: 'Low', value: dashboardStats?.leads_by_priority?.low || 0 },
    { name: 'Medium', value: dashboardStats?.leads_by_priority?.medium || 0 },
    { name: 'High', value: dashboardStats?.leads_by_priority?.high || 0 },
    { name: 'Urgent', value: dashboardStats?.leads_by_priority?.urgent || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Analytics and performance metrics
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Total Leads</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            {dashboardStats?.total_leads || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {dashboardStats?.conversion_rate?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Avg Days to Close</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            {dashboardStats?.avg_days_to_close?.toFixed(0) || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">New Today</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {dashboardStats?.new_leads || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">
            Pipeline Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">
            Leads by Priority
          </h2>
          <div className="h-80">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {priorityData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                No priority data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline stages table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          Pipeline Stage Breakdown
        </h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 text-sm font-medium text-neutral-500">
                Stage
              </th>
              <th className="text-right py-3 text-sm font-medium text-neutral-500">
                Count
              </th>
              <th className="text-right py-3 text-sm font-medium text-neutral-500">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody>
            {pipelineStages.map((stage) => {
              const count = dashboardStats?.leads_by_stage?.[stage.name] || 0;
              const total = dashboardStats?.total_leads || 1;
              const percentage = ((count / total) * 100).toFixed(1);

              return (
                <tr key={stage.id} className="border-b border-neutral-100">
                  <td className="py-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-sm font-medium text-neutral-900">
                        {stage.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 text-sm text-neutral-600">
                    {count}
                  </td>
                  <td className="text-right py-3 text-sm text-neutral-600">
                    {percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
