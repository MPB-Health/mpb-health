import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ExternalLink,
  Check
} from 'lucide-react';
import type { Lead } from '../../../lib/crmService';
import { crmService } from '../../../lib/crmService';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface LeadQuickActionsProps {
  lead: Lead;
  onActionComplete?: () => void;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
}

export const LeadQuickActions: React.FC<LeadQuickActionsProps> = ({
  lead,
  onActionComplete,
  variant = 'horizontal',
  size = 'md',
}) => {
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [callOutcome, setCallOutcome] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskType, setTaskType] = useState<'follow_up' | 'call' | 'email' | 'meeting' | 'other'>('follow_up');

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLogCall = async () => {
    if (!callOutcome) return;
    setIsSubmitting(true);
    await crmService.logCall(lead.id, callOutcome, callNotes);
    setIsSubmitting(false);
    setShowCallModal(false);
    setCallOutcome('');
    setCallNotes('');
    onActionComplete?.();
  };

  const handleLogEmail = async () => {
    if (!emailSubject) return;
    setIsSubmitting(true);
    await crmService.logEmail(lead.id, emailSubject, emailNotes);
    setIsSubmitting(false);
    setShowEmailModal(false);
    setEmailSubject('');
    setEmailNotes('');
    onActionComplete?.();
  };

  const handleAddNote = async () => {
    if (!noteTitle) return;
    setIsSubmitting(true);
    await crmService.addNote(lead.id, noteTitle, noteDescription);
    setIsSubmitting(false);
    setShowNoteModal(false);
    setNoteTitle('');
    setNoteDescription('');
    onActionComplete?.();
  };

  const handleCreateTask = async () => {
    if (!taskTitle || !taskDueDate) return;
    setIsSubmitting(true);
    await crmService.createTask({
      lead_id: lead.id,
      title: taskTitle,
      due_date: new Date(taskDueDate).toISOString(),
      task_type: taskType,
      priority: 'medium',
    });
    setIsSubmitting(false);
    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDueDate('');
    onActionComplete?.();
  };

  const buttonSize = size === 'sm' ? 'p-2' : 'p-3';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const containerClass = variant === 'horizontal' 
    ? 'flex items-center gap-2' 
    : 'flex flex-col gap-2';

  const callOutcomes = [
    'Connected - Interested',
    'Connected - Not Interested',
    'Connected - Call Back Later',
    'Voicemail Left',
    'No Answer',
    'Wrong Number',
  ];

  return (
    <>
      <div className={containerClass}>
        {/* Copy Phone */}
        <button
          onClick={() => copyToClipboard(lead.phone, 'phone')}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors',
            buttonSize
          )}
          title="Copy phone number"
        >
          {copiedField === 'phone' ? (
            <Check className={cn(iconSize, 'text-green-500')} />
          ) : (
            <Phone className={cn(iconSize, 'text-neutral-600')} />
          )}
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm text-neutral-600">Call</span>
          )}
        </button>

        {/* Copy Email */}
        <button
          onClick={() => copyToClipboard(lead.email, 'email')}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors',
            buttonSize
          )}
          title="Copy email"
        >
          {copiedField === 'email' ? (
            <Check className={cn(iconSize, 'text-green-500')} />
          ) : (
            <Mail className={cn(iconSize, 'text-neutral-600')} />
          )}
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm text-neutral-600">Email</span>
          )}
        </button>

        {/* Log Call */}
        <button
          onClick={() => setShowCallModal(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors',
            buttonSize
          )}
          title="Log a call"
        >
          <Phone className={iconSize} />
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm">Log Call</span>
          )}
        </button>

        {/* Log Email */}
        <button
          onClick={() => setShowEmailModal(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors',
            buttonSize
          )}
          title="Log an email"
        >
          <Mail className={iconSize} />
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm">Log Email</span>
          )}
        </button>

        {/* Add Note */}
        <button
          onClick={() => setShowNoteModal(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors',
            buttonSize
          )}
          title="Add a note"
        >
          <MessageSquare className={iconSize} />
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm">Add Note</span>
          )}
        </button>

        {/* Create Task */}
        <button
          onClick={() => setShowTaskModal(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors',
            buttonSize
          )}
          title="Create follow-up task"
        >
          <Calendar className={iconSize} />
          {variant === 'vertical' && size === 'md' && (
            <span className="text-sm">Schedule</span>
          )}
        </button>

        {/* Zoho Link (if synced) */}
        {lead.zoho_lead_id && (
          <a
            href={`https://crm.zoho.com/crm/org123/tab/Leads/${lead.zoho_lead_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors',
              buttonSize
            )}
            title="View in Zoho"
          >
            <ExternalLink className={iconSize} />
            {variant === 'vertical' && size === 'md' && (
              <span className="text-sm">Zoho</span>
            )}
          </a>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold">Log Call</h3>
              <p className="text-sm text-neutral-500">with {lead.first_name} {lead.last_name}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Call Outcome *
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select outcome...</option>
                  {callOutcomes.map((outcome) => (
                    <option key={outcome} value={outcome}>{outcome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Add any notes from the call..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCallModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleLogCall} disabled={!callOutcome || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Log Call'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold">Log Email</h3>
              <p className="text-sm text-neutral-500">to {lead.email}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Re: Your quote request"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Summary of the email..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleLogEmail} disabled={!emailSubject || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Log Email'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold">Add Note</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Note title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Add details..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNoteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!noteTitle || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold">Create Follow-up Task</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Follow up on quote..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as typeof taskType)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="follow_up">Follow Up</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowTaskModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!taskTitle || !taskDueDate || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadQuickActions;
