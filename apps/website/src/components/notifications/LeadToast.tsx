import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, MapPin, Users, Clock, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  LeadPriority,
  getPriorityColor,
  getPriorityLabel,
  getToastDismissTime,
} from '../../lib/leadPriorityService';

export interface LeadToastData {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  zipCode?: string | null;
  householdSize?: number | null;
  priority: LeadPriority;
  isRepeatLead: boolean;
  repeatCount: number;
  reasons: string[];
  createdAt: string;
}

interface LeadToastProps {
  toast: LeadToastData;
  onDismiss: (id: string) => void;
  onView: (leadId: string) => void;
}

export const LeadToast: React.FC<LeadToastProps> = ({ toast, onDismiss, onView }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();
  const colors = getPriorityColor(toast.priority);
  const dismissTime = getToastDismissTime(toast.priority);

  // Auto-dismiss timer
  useEffect(() => {
    if (dismissTime === 0) return; // Never auto-dismiss for critical

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / dismissTime) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [dismissTime]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handleClick = () => {
    onView(toast.leadId);
    navigate(`/admin/quote-submissions?lead=${toast.leadId}`);
    handleDismiss();
  };

  const getPriorityIcon = () => {
    switch (toast.priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <Zap className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        'relative w-96 bg-white rounded-xl shadow-2xl border overflow-hidden cursor-pointer',
        'transform transition-all duration-300 ease-out',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        'animate-in slide-in-from-right-full fade-in duration-300',
        colors.border,
        toast.priority === 'critical' && 'ring-2 ring-red-500 ring-offset-2'
      )}
      onClick={handleClick}
    >
      {/* Priority Header */}
      <div
        className={cn(
          'px-4 py-2 flex items-center justify-between',
          toast.priority === 'critical'
            ? 'bg-gradient-to-r from-red-600 to-rose-600'
            : toast.priority === 'high'
            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600'
        )}
      >
        <div className="flex items-center gap-2 text-white">
          {getPriorityIcon()}
          <span className="font-semibold text-sm">
            {toast.priority === 'critical'
              ? '🔥 Critical Lead'
              : toast.priority === 'high'
              ? '⚡ High Priority Lead'
              : '💰 New Lead'}
          </span>
          {toast.isRepeatLead && (
            <span className="flex items-center gap-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3" />
              Repeat
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0',
              toast.priority === 'critical'
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : toast.priority === 'high'
                ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            )}
          >
            {toast.firstName.charAt(0)}
            {toast.lastName.charAt(0)}
          </div>

          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-base truncate">
              {toast.firstName} {toast.lastName}
            </h4>

            <div className="mt-1.5 space-y-1">
              {/* Location */}
              {toast.zipCode && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>ZIP: {toast.zipCode}</span>
                </div>
              )}

              {/* Household Size */}
              {toast.householdSize && toast.householdSize > 1 && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Family of {toast.householdSize}
                    {toast.householdSize >= 5 && ' 👨‍👩‍👧‍👦'}
                  </span>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Just now</span>
              </div>
            </div>

            {/* Priority Badge */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  colors.bg,
                  colors.text
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                {getPriorityLabel(toast.priority)}
              </span>
              {toast.isRepeatLead && toast.repeatCount > 0 && (
                <span className="text-xs text-slate-500">
                  ({toast.repeatCount} previous)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            Click to view lead details →
          </p>
        </div>
      </div>

      {/* Progress Bar (for auto-dismiss) */}
      {dismissTime > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className={cn(
              'h-full transition-all duration-100 ease-linear',
              toast.priority === 'critical'
                ? 'bg-red-500'
                : toast.priority === 'high'
                ? 'bg-orange-500'
                : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: LeadToastData[];
  onDismiss: (id: string) => void;
  onView: (leadId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onView,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <LeadToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default LeadToast;

