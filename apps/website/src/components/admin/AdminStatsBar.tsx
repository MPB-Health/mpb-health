import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  Globe,
  BookOpen,
  Activity,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminStatsBarProps {
  stats: {
    activeNow: number;
    pageViewsToday: number;
    topTrafficSource: { name: string; sessions: number };
    blogViews: number;
  };
  loading?: boolean;
  onRefresh?: () => void;
}

export const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  stats,
  loading = false,
  onRefresh
}) => {
  const statItems = [
    {
      label: 'Active Now',
      value: stats.activeNow,
      subValue: 'visitors in last 5 min',
      icon: Users,
      color: 'emerald',
      href: '/admin?view=live',
      isLive: true
    },
    {
      label: 'Page Views',
      value: stats.pageViewsToday.toLocaleString(),
      subValue: 'today',
      icon: Eye,
      color: 'blue',
      href: '/admin?view=analytics',
      trend: 'up' as const
    },
    {
      label: 'Top Source',
      value: stats.topTrafficSource.name,
      subValue: `${stats.topTrafficSource.sessions.toLocaleString()} sessions`,
      icon: Globe,
      color: 'purple',
      href: '/admin?view=traffic'
    },
    {
      label: 'Blog Views',
      value: stats.blogViews.toLocaleString(),
      subValue: 'today',
      icon: BookOpen,
      color: 'amber',
      href: '/admin/blog',
      trend: 'up' as const
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string; border: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-500/20' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-500/20' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-500/20' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-500/20' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {statItems.map((item) => {
              const Icon = item.icon;
              const colors = getColorClasses(item.color);
              
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                    colors.border,
                    colors.bg,
                    "hover:shadow-md hover:scale-[1.02]"
                  )}
                >
                  {/* Live Pulse Indicator for Active Now */}
                  {item.isLive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg",
                    colors.bg
                  )}>
                    {item.isLive ? (
                      <Activity className={cn("h-5 w-5", colors.icon)} />
                    ) : (
                      <Icon className={cn("h-5 w-5", colors.icon)} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                      {item.label}
                    </p>
                    <p className={cn(
                      "text-lg font-bold truncate",
                      loading ? "animate-pulse bg-slate-200 rounded w-12 h-6" : colors.text
                    )}>
                      {loading ? '' : item.value}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                      {item.isLive && <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />}
                      {item.subValue}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Lead Notifications */}
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className={cn(
                "hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors",
                loading && "animate-spin"
              )}
              title="Refresh stats"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsBar;
