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
import type { PowerListItem } from '@mpbhealth/champion-core';

interface PriorityCardProps {
  item: PowerListItem;
  onComplete?: (itemId: string) => void;
  onSnooze?: (itemId: string) => void;
  onMove?: (itemId: string) => void;
  onClick?: (item: PowerListItem) => void;
}

export function PriorityCard({
  item,
  onComplete,
  onSnooze,
  onMove,
  onClick,
}: PriorityCardProps) {
  const [showMenu, setShowMenu] = useState(false);

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
      className={`bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isSnoozed ? 'opacity-60' : ''
      }`}
      onClick={() => onClick?.(item)}
    >
      {/* Header with name and score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <User className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">{item.person_name}</h3>
            {item.person_email && (
              <p className="text-sm text-neutral-500">{item.person_email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete?.(item.item_id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Mark Complete</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSnooze?.(item.item_id);
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
                    onMove?.(item.item_id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <span>Move to Lane</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lane badge */}
      <div className="mb-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: item.lane_color }}
        >
          {item.lane_name}
        </span>
        {isSnoozed && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Snoozed until {format(new Date(item.snoozed_until!), 'MMM d')}
          </span>
        )}
      </div>

      {/* Reason if exists */}
      {item.reason && (
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{item.reason}</p>
      )}

      {/* Action timestamps */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center space-x-3">
          {item.last_action_at && (
            <span className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(item.last_action_at), { addSuffix: true })}
              </span>
            </span>
          )}
          {item.next_action_at && (
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Due {format(new Date(item.next_action_at), 'MMM d')}</span>
            </span>
          )}
        </div>
        {item.rank && (
          <span className="font-medium">#{item.rank}</span>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-neutral-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (item.person_email) {
              window.location.href = `mailto:${item.person_email}`;
            }
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Email</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Would trigger call action
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>Call</span>
        </button>
      </div>
    </div>
  );
}
