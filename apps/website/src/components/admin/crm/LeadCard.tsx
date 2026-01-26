import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  User,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import type { Lead } from '../../../lib/crmService';
import { cn } from '../../../lib/utils';

interface LeadCardProps {
  lead: Lead;
  variant?: 'default' | 'compact' | 'pipeline';
  showActions?: boolean;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  variant = 'default',
  showActions = true,
  onClick,
  isDragging = false,
  className,
}) => {
  const priorityColors = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  const stageColors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    qualified: 'bg-emerald-500',
    proposal: 'bg-amber-500',
    negotiation: 'bg-pink-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };

  const getDaysInStage = () => {
    if (!lead.stage_changed_at) return 0;
    const diff = Date.now() - new Date(lead.stage_changed_at).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysInStage = getDaysInStage();

  if (variant === 'pipeline') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'bg-white rounded-lg border border-neutral-200 p-3 cursor-pointer transition-all',
          'hover:shadow-md hover:border-neutral-300',
          isDragging && 'shadow-lg ring-2 ring-primary-500 ring-opacity-50',
          className
        )}
      >
        {/* Priority indicator bar */}
        <div className={cn('h-1 -mx-3 -mt-3 rounded-t-lg mb-2', stageColors[lead.pipeline_stage] || 'bg-neutral-300')} />
        
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-neutral-900 truncate">
              {lead.first_name} {lead.last_name}
            </h4>
            <p className="text-sm text-neutral-500 truncate">{lead.email}</p>
          </div>
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full border',
            priorityColors[lead.priority || 'medium']
          )}>
            {lead.priority?.toUpperCase() || 'MEDIUM'}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          )}
          {lead.source_cta && (
            <span className="truncate">{lead.source_cta}</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {daysInStage > 0 ? `${daysInStage}d in stage` : 'New today'}
          </span>
          {lead.next_followup_at && (
            <span className={cn(
              'flex items-center gap-1 text-xs',
              new Date(lead.next_followup_at) < new Date() ? 'text-red-500' : 'text-amber-500'
            )}>
              <Clock className="h-3 w-3" />
              Follow-up
            </span>
          )}
        </div>

        {lead.tags && lead.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                {tag}
              </span>
            ))}
            {lead.tags.length > 3 && (
              <span className="text-xs text-neutral-400">+{lead.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200',
          'hover:bg-neutral-50 cursor-pointer transition-colors',
          className
        )}
      >
        <div className={cn('w-2 h-2 rounded-full', stageColors[lead.pipeline_stage] || 'bg-neutral-300')} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 truncate">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-sm text-neutral-500 truncate">{lead.email}</p>
        </div>
        <span className={cn(
          'px-2 py-0.5 text-xs font-medium rounded-full border',
          priorityColors[lead.priority || 'medium']
        )}>
          {lead.priority?.charAt(0).toUpperCase()}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    );
  }

  // Default variant - full card
  return (
    <div className={cn(
      'bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
            {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">
              {lead.first_name} {lead.last_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                stageColors[lead.pipeline_stage] || 'bg-neutral-500',
                'text-white'
              )}>
                {lead.pipeline_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New'}
              </span>
              <span className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full border',
                priorityColors[lead.priority || 'medium']
              )}>
                {lead.priority?.toUpperCase() || 'MEDIUM'}
              </span>
            </div>
          </div>
        </div>

        {lead.lead_score > 0 && (
          <div className="text-right">
            <span className="text-2xl font-bold text-primary-600">{lead.lead_score}</span>
            <p className="text-xs text-neutral-500">Score</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-neutral-600">
          <Mail className="h-4 w-4 text-neutral-400" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          <Phone className="h-4 w-4 text-neutral-400" />
          <span>{lead.phone}</span>
        </div>
        {lead.zip_code && (
          <div className="flex items-center gap-2 text-neutral-600">
            <MapPin className="h-4 w-4 text-neutral-400" />
            <span>{lead.zip_code}</span>
          </div>
        )}
        {lead.source_cta && (
          <div className="flex items-center gap-2 text-neutral-600">
            <User className="h-4 w-4 text-neutral-400" />
            <span className="truncate">{lead.source_cta}</span>
          </div>
        )}
      </div>

      {lead.tags && lead.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {lead.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
          {lead.zoho_sync_status === 'success' ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Synced
            </span>
          ) : lead.zoho_sync_status === 'failed' ? (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" />
              Sync Failed
            </span>
          ) : null}
        </div>

        {showActions && (
          <Link
            to={`/admin/crm/leads/${lead.id}`}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
