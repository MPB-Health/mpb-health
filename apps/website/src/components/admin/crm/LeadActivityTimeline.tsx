import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  ArrowRight, 
  UserPlus,
  CheckSquare,
  Plus,
  Clock
} from 'lucide-react';
import type { LeadActivity } from '../../../lib/crmService';
import { crmService } from '../../../lib/crmService';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface LeadActivityTimelineProps {
  leadId: string;
  activities: LeadActivity[];
  onActivityAdded?: () => void;
}

const activityIcons: Record<string, React.ElementType> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  status_change: ArrowRight,
  assignment: UserPlus,
  task_created: CheckSquare,
  task_completed: CheckSquare,
};

const activityColors: Record<string, string> = {
  note: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  email: 'bg-purple-100 text-purple-600',
  meeting: 'bg-amber-100 text-amber-600',
  status_change: 'bg-slate-100 text-slate-600',
  assignment: 'bg-pink-100 text-pink-600',
  task_created: 'bg-cyan-100 text-cyan-600',
  task_completed: 'bg-emerald-100 text-emerald-600',
};

export const LeadActivityTimeline: React.FC<LeadActivityTimelineProps> = ({
  leadId,
  activities,
  onActivityAdded,
}) => {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;

    setIsSubmitting(true);
    const result = await crmService.addNote(leadId, noteTitle, noteDescription);
    setIsSubmitting(false);

    if (result.success) {
      setNoteTitle('');
      setNoteDescription('');
      setShowAddNote(false);
      onActivityAdded?.();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Add Note Button/Form */}
      <div className="mb-6">
        {!showAddNote ? (
          <Button
            onClick={() => setShowAddNote(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        ) : (
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <textarea
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
              placeholder="Add details (optional)..."
              rows={3}
              className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddNote(false);
                  setNoteTitle('');
                  setNoteDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!noteTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">No activity yet</p>
          <p className="text-sm text-neutral-400">Add a note to start tracking interactions</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.activity_type] || MessageSquare;
              const colorClass = activityColors[activity.activity_type] || 'bg-neutral-100 text-neutral-600';

              return (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full',
                    colorClass
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 bg-white rounded-lg border border-neutral-200 p-3',
                    index === 0 && 'ring-1 ring-primary-100'
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-neutral-900">{activity.title}</h4>
                        {activity.description && (
                          <p className="mt-1 text-sm text-neutral-600">{activity.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>

                    {/* Metadata for status changes */}
                    {activity.activity_type === 'status_change' && activity.metadata && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-600">
                          {(activity.metadata as { from?: string }).from || 'Unknown'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-neutral-400" />
                        <span className="px-2 py-0.5 bg-primary-100 rounded text-primary-700 font-medium">
                          {(activity.metadata as { to?: string }).to || 'Unknown'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadActivityTimeline;
