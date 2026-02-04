import React from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SyncStatus = 'live' | 'pending' | 'syncing' | 'error';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  className?: string;
  showLabel?: boolean;
}

export function SyncStatusBadge({ status, className, showLabel = true }: SyncStatusBadgeProps) {
  const statusConfig = {
    live: {
      icon: CheckCircle,
      label: 'Live',
      className: 'bg-green-50 text-green-700 border-green-200',
      iconClassName: 'text-green-600',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      iconClassName: 'text-yellow-600',
    },
    syncing: {
      icon: RefreshCw,
      label: 'Syncing',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      iconClassName: 'text-blue-600 animate-spin',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-red-50 text-red-700 border-red-200',
      iconClassName: 'text-red-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-3 h-3', config.iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface SyncStatusBannerProps {
  status?: SyncStatus;
  message?: string;
  lastUpdated?: string;
  portalUrl?: string;
  className?: string;
}

export function SyncStatusBanner({
  status = 'live',
  message,
  lastUpdated,
  portalUrl = 'https://advisor.mpb.health',
  className,
}: SyncStatusBannerProps) {
  const defaultMessages = {
    live: 'All changes are synced and live in the Advisor Portal',
    pending: 'Changes are queued for sync',
    syncing: 'Syncing changes to Advisor Portal...',
    error: 'Sync failed - some changes may not be visible',
  };

  const bannerClasses = {
    live: 'bg-green-50 border-green-200',
    pending: 'bg-yellow-50 border-yellow-200',
    syncing: 'bg-blue-50 border-blue-200',
    error: 'bg-red-50 border-red-200',
  };

  const textClasses = {
    live: 'text-green-800',
    pending: 'text-yellow-800',
    syncing: 'text-blue-800',
    error: 'text-red-800',
  };

  const Icon = status === 'syncing' ? RefreshCw : CheckCircle;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        bannerClasses[status],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SyncStatusBadge status={status} />
        <span className={cn('text-sm', textClasses[status])}>
          {message || defaultMessages[status]}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className={cn('text-xs', textClasses[status])}>
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
        {portalUrl && (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium hover:underline',
              textClasses[status]
            )}
          >
            View Portal
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default SyncStatusBadge;
