import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, User, Mail, Phone, Clock, ExternalLink, X, Users, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  subscribeToEnhancedLeadSubmissions,
  unsubscribeEnhancedCallback,
  getRecentEnhancedLeads,
  getUnreadLeadCount,
  setLastViewedTimestamp,
  formatTimeAgo,
  type EnhancedLeadSubmission,
} from '../../lib/leadNotificationService';
import {
  getPriorityColor,
  getPriorityLabel,
  shouldPlaySound,
  LeadPriority,
} from '../../lib/leadPriorityService';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('LeadNotificationBell');

export const LeadNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<EnhancedLeadSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewLead, setHasNewLead] = useState(false);
  const [newLeadPriority, setNewLeadPriority] = useState<LeadPriority>('normal');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-lead.mp3');
    audioRef.current.volume = 0.4;
    return () => {
      audioRef.current = null;
    };
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leads, count] = await Promise.all([
        getRecentEnhancedLeads(8),
        getUnreadLeadCount(),
      ]);
      setRecentLeads(leads);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load lead notifications:', error);
    }
    setLoading(false);
  }, []);

  // Handle new lead from real-time subscription
  const handleNewLead = useCallback((lead: EnhancedLeadSubmission) => {
    log.info('New enhanced lead received:', lead);
    
    // Add to recent leads at the top
    setRecentLeads(prev => [lead, ...prev.slice(0, 7)]);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    // Store priority for animation color
    setNewLeadPriority(lead.priority);
    
    // Trigger animation
    setHasNewLead(true);
    setTimeout(() => setHasNewLead(false), 3000);

    // Play notification sound for high/critical priority only
    if (shouldPlaySound(lead.priority) && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    loadData();

    // Subscribe to enhanced real-time updates with priority
    subscribeToEnhancedLeadSubmissions(handleNewLead);

    // Cleanup on unmount
    return () => {
      unsubscribeEnhancedCallback(handleNewLead);
    };
  }, [loadData, handleNewLead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle opening dropdown - mark as viewed
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      // Mark as viewed after a short delay
      setTimeout(() => {
        setLastViewedTimestamp();
        setUnreadCount(0);
      }, 1000);
    }
  };

  // Get badge color based on highest priority unread
  const getBadgeColor = () => {
    const hasHighPriority = recentLeads.some(
      (lead) => lead.priority === 'critical' || lead.priority === 'high'
    );
    if (newLeadPriority === 'critical' || recentLeads[0]?.priority === 'critical') {
      return 'bg-red-500';
    }
    if (hasHighPriority || newLeadPriority === 'high') {
      return 'bg-orange-500';
    }
    return 'bg-blue-500';
  };

  // Get priority icon
  const getPriorityIcon = (priority: LeadPriority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-3 w-3" />;
      case 'high':
        return <Zap className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get avatar gradient based on priority
  const getAvatarGradient = (priority: LeadPriority) => {
    switch (priority) {
      case 'critical':
        return 'from-red-500 to-rose-600';
      case 'high':
        return 'from-orange-500 to-amber-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          hasNewLead && 'animate-bounce'
        )}
        title="Lead Notifications"
      >
        <Bell className={cn(
          'h-5 w-5',
          hasNewLead && newLeadPriority === 'critical' && 'text-red-600'
        )} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center">
            <span className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              hasNewLead ? 'animate-ping' : '',
              newLeadPriority === 'critical' ? 'bg-red-400' :
              newLeadPriority === 'high' ? 'bg-orange-400' : 'bg-blue-400'
            )}></span>
            <span className={cn(
              'relative inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-white text-xs font-bold',
              getBadgeColor()
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-white" />
              <h3 className="text-white font-semibold text-sm">New Leads</h3>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lead List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 mt-2">Loading leads...</p>
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="p-8 text-center">
                <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No recent leads</p>
                <p className="text-xs text-slate-400 mt-1">New leads will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeads.map((lead) => {
                  const colors = getPriorityColor(lead.priority);
                  
                  return (
                    <Link
                      key={lead.id}
                      to={`/admin/quote-submissions?lead=${lead.id}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'block p-4 hover:bg-slate-50 transition-colors',
                        lead.priority === 'critical' && 'bg-red-50/50 hover:bg-red-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={cn(
                          'w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0',
                          getAvatarGradient(lead.priority)
                        )}>
                          {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 text-sm truncate">
                                {lead.first_name} {lead.last_name}
                              </h4>
                              {/* Repeat Lead Indicator */}
                              {lead.isRepeatLead && (
                                <span className="flex items-center gap-0.5 text-xs text-purple-600" title={`${lead.repeatCount} previous submission(s)`}>
                                  <RefreshCw className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(lead.created_at)}
                            </span>
                          </div>
                          
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            {lead.phone && lead.phone !== 'Not provided' && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {/* Household Size */}
                            {lead.household_size && lead.household_size > 1 && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span>Family of {lead.household_size}</span>
                              </div>
                            )}
                          </div>

                          {/* Priority Badge & Source */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {/* Priority Badge */}
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              colors.bg,
                              colors.text
                            )}>
                              {getPriorityIcon(lead.priority)}
                              {getPriorityLabel(lead.priority)}
                            </span>
                            
                            {/* Repeat Badge */}
                            {lead.isRepeatLead && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <RefreshCw className="h-3 w-3" />
                                Repeat ({lead.repeatCount})
                              </span>
                            )}
                            
                            {/* Source Badge */}
                            {lead.source_cta && lead.priority === 'normal' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {lead.source_cta}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-3 bg-slate-50">
            <Link
              to="/admin/quote-submissions"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              View All Lead Submissions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadNotificationBell;
