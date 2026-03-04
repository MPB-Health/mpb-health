import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Target, DollarSign,
  CheckCircle, Clock, ArrowRight,
} from 'lucide-react';
import { crmBridgeService, type CRMSummary } from '@mpbhealth/admin-core';

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CRMSummary | null>(null);
  const [revenue, setRevenue] = useState<{
    total_invoiced: number;
    total_paid: number;
    outstanding: number;
    this_month: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, rev] = await Promise.all([
          crmBridgeService.getCRMSummary(),
          crmBridgeService.getRevenueMetrics(),
        ]);
        setSummary(sum);
        setRevenue(rev);
      } catch (err) {
        console.error('Failed to load CRM dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-th-text-primary">CRM Dashboard</h1>
        <button
          onClick={() => navigate('/crm/leads')}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          View All Leads <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total Leads" value={summary.total_leads} color="text-blue-600" />
          <MetricCard icon={TrendingUp} label="New Today" value={summary.new_today} color="text-green-600" />
          <MetricCard icon={Target} label="Conversion Rate" value={`${summary.conversion_rate}%`} color="text-purple-600" />
          <MetricCard icon={Clock} label="Pending Tasks" value={summary.pending_tasks} color="text-yellow-600" />
        </div>
      )}

      {/* Revenue metrics */}
      {revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={DollarSign} label="Total Invoiced" value={`$${revenue.total_invoiced.toLocaleString()}`} color="text-blue-600" />
          <MetricCard icon={CheckCircle} label="Total Paid" value={`$${revenue.total_paid.toLocaleString()}`} color="text-green-600" />
          <MetricCard icon={Clock} label="Outstanding" value={`$${revenue.outstanding.toLocaleString()}`} color="text-orange-600" />
          <MetricCard icon={TrendingUp} label="This Month" value={`$${revenue.this_month.toLocaleString()}`} color="text-purple-600" />
        </div>
      )}

      {/* Pipeline stages */}
      {summary && summary.leads_by_stage.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Pipeline Overview</h2>
          <div className="space-y-3">
            {summary.leads_by_stage.map((stage) => {
              const pct = summary.total_leads > 0 ? (stage.count / summary.total_leads) * 100 : 0;
              return (
                <div key={stage.stage} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-th-text-secondary truncate">{stage.stage}</div>
                  <div className="flex-1 bg-surface-tertiary rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-th-text-primary">
                    {stage.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-th-text-tertiary">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
