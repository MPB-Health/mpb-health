import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  Phone,
  Mail,
  Clock,
  MoreVertical,
  CheckCircle,
  Pause,
  ArrowRight,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import type { PriorityItemWithDetails } from '@mpbhealth/champion-core';

interface PriorityItemCardProps {
  item: PriorityItemWithDetails;
  onComplete?: () => void;
  onSnooze?: () => void;
  onMove?: () => void;
  onClick?: () => void;
}

export function PriorityItemCard({
  item,
  onComplete,
  onSnooze,
  onMove,
  onClick,
}: PriorityItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const personName = item.lead
    ? `${item.lead.first_name} ${item.lead.last_name}`
    : item.contact
      ? `${item.contact.first_name} ${item.contact.last_name}`
      : 'Unknown';

  const personEmail = item.lead?.email || item.contact?.email;
  const personPhone = item.lead?.phone || item.contact?.phone;

  const scoreColor =
    item.score >= 80
      ? 'bg-red-500'
      : item.score >= 60
        ? 'bg-orange-500'
        : item.score >= 40
          ? 'bg-yellow-500'
          : 'bg-green-500';

  const isSnoozed = item.snoozed_until && new Date(item.snoozed_until) > new Date();

  return (
    <div
      className={`bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-sm transition-shadow cursor-pointer ${
        isSnoozed ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      {/* Header with name and score */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-neutral-900 text-sm truncate">{personName}</h4>
            {personEmail && (
              <p className="text-xs text-neutral-500 truncate">{personEmail}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Score indicator */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${scoreColor}`} />
            <span className="text-xs font-medium text-neutral-600">{item.score}</span>
          </div>
          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-neutral-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Complete</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSnooze?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4 text-yellow-500" />
                  <span>Snooze</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <span>Move</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source and snoozed badges */}
      <div className="flex items-center space-x-2 mb-2">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            item.source === 'ai'
              ? 'bg-purple-100 text-purple-700'
              : item.source === 'auto'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {item.source === 'ai' ? 'AI' : item.source === 'auto' ? 'Auto' : 'Manual'}
        </span>
        {isSnoozed && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {format(new Date(item.snoozed_until!), 'MMM d')}
          </span>
        )}
        {item.lead?.pipeline_stage && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
            {item.lead.pipeline_stage}
          </span>
        )}
      </div>

      {/* Reason if exists */}
      {item.reason && (
        <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{item.reason}</p>
      )}

      {/* Timestamps and actions */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center space-x-3">
          {item.last_action_at && (
            <span className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(item.last_action_at), { addSuffix: true })}</span>
            </span>
          )}
          {item.next_action_at && (
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(item.next_action_at), 'MMM d')}</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {personEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${personEmail}`;
              }}
              className="p-1 hover:bg-neutral-100 rounded"
              title="Send email"
            >
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
          {personPhone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${personPhone}`;
              }}
              className="p-1 hover:bg-neutral-100 rounded"
              title="Call"
            >
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
