import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { SaveIndicator } from './SaveIndicator';
import { useForm } from '../hooks/useForm';
import { useSaveStatus } from '../hooks/useSaveStatus';
import { useDirtyFlag } from '../hooks/useUnsavedChanges';
import { useCRM } from '../contexts/CRMContext';
import { AlertCircle, RotateCcw } from 'lucide-react';

// ============================================================================
// Add Note Modal
// ============================================================================

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

export function AddNoteModal({ open, onClose, leadId, onSuccess }: AddNoteModalProps) {
  const { activityService } = useCRM();
  const { markDirty, confirmClose } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  const { values, errors, loading, submitError, handleChange, handleSubmit, retry } = useForm({
    initialValues: { title: '', description: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.title.trim()) errs.title = 'Title is required';
      if (!vals.description.trim()) errs.description = 'Note content is required';
      return errs;
    },
    onSubmit: async (vals) => {
      markSaving();
      const result = await activityService.addNote(leadId, vals.title as string, vals.description as string);
      if (!result.success) {
        markError(result.error || 'Failed to add note');
        toast.error(result.error || 'Failed to add note');
        throw new Error(result.error || 'Failed to add note');
      }
      markSaved();
      toast.success('Note added');
      onSuccess();
      onClose();
    },
  });

  const wrappedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    markDirty();
    handleChange(e);
  };

  return (
    <Modal open={open} onClose={() => confirmClose(onClose)} title="Add Note" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Title"
          name="title"
          value={values.title as string}
          onChange={wrappedChange}
          error={errors.title}
          required
          placeholder="e.g. Initial consultation notes"
        />
        <TextareaField
          label="Note"
          name="description"
          value={values.description as string}
          onChange={wrappedChange}
          error={errors.description}
          required
          placeholder="Enter your note... Be as detailed as you need."
          rows={6}
          minRows={6}
          autoExpand
          hint="Use this space for detailed observations, action items, or follow-up reminders"
        />

        {/* Error recovery */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{submitError}</p>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Add Note" loadingLabel="Saving note..." />
          <button type="button" onClick={() => confirmClose(onClose)} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
          <SaveIndicator status={status} errorMessage={errorMessage} />
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// Log Call Modal
// ============================================================================

interface LogCallModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

const CALL_OUTCOME_OPTIONS = [
  { value: 'answered', label: 'Answered' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong Number' },
];

const CALL_DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'Outbound' },
  { value: 'inbound', label: 'Inbound' },
];

export function LogCallModal({ open, onClose, leadId, onSuccess }: LogCallModalProps) {
  const { activityService } = useCRM();
  const { markDirty, confirmClose } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  const { values, errors, loading, submitError, handleChange, handleSubmit, retry } = useForm({
    initialValues: { outcome: 'answered', direction: 'outbound', notes: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.outcome) errs.outcome = 'Outcome is required';
      return errs;
    },
    onSubmit: async (vals) => {
      markSaving();
      const result = await activityService.logCall(leadId, vals.outcome as string, vals.notes as string || undefined, vals.direction as 'inbound' | 'outbound');
      if (!result.success) {
        markError(result.error || 'Failed to log call');
        toast.error(result.error || 'Failed to log call');
        throw new Error(result.error || 'Failed to log call');
      }
      markSaved();
      toast.success('Call logged');
      onSuccess();
      onClose();
    },
  });

  const wrappedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    markDirty();
    handleChange(e);
  };

  return (
    <Modal open={open} onClose={() => confirmClose(onClose)} title="Log Call" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Outcome"
            name="outcome"
            value={values.outcome as string}
            onChange={wrappedChange}
            options={CALL_OUTCOME_OPTIONS}
            error={errors.outcome}
            required
          />
          <SelectField
            label="Direction"
            name="direction"
            value={values.direction as string}
            onChange={wrappedChange}
            options={CALL_DIRECTION_OPTIONS}
          />
        </div>
        <TextareaField
          label="Call Notes"
          name="notes"
          value={values.notes as string}
          onChange={wrappedChange}
          placeholder="What was discussed? Any follow-up items?"
          rows={5}
          minRows={4}
          autoExpand
          hint="Include key takeaways, commitments, and next steps"
        />

        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{submitError}</p>
            <button type="button" onClick={retry} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors">
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Log Call" loadingLabel="Saving..." />
          <button type="button" onClick={() => confirmClose(onClose)} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
          <SaveIndicator status={status} errorMessage={errorMessage} />
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// Log Meeting Modal
// ============================================================================

interface LogMeetingModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

export function LogMeetingModal({ open, onClose, leadId, onSuccess }: LogMeetingModalProps) {
  const { activityService } = useCRM();
  const { markDirty, confirmClose } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  const { values, errors, loading, submitError, handleChange, handleSubmit, retry } = useForm({
    initialValues: { title: '', location: '', meeting_url: '', notes: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.title) errs.title = 'Meeting title is required';
      return errs;
    },
    onSubmit: async (vals) => {
      markSaving();
      const result = await activityService.logMeeting(
        leadId,
        vals.title as string,
        vals.notes as string || undefined,
        {
          location: vals.location || undefined,
          meeting_url: vals.meeting_url || undefined,
        }
      );
      if (!result.success) {
        markError(result.error || 'Failed to log meeting');
        toast.error(result.error || 'Failed to log meeting');
        throw new Error(result.error || 'Failed to log meeting');
      }
      markSaved();
      toast.success('Meeting logged');
      onSuccess();
      onClose();
    },
  });

  const wrappedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    markDirty();
    handleChange(e);
  };

  return (
    <Modal open={open} onClose={() => confirmClose(onClose)} title="Log Meeting" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Meeting Title"
          name="title"
          value={values.title as string}
          onChange={wrappedChange}
          error={errors.title}
          required
          placeholder="e.g. Benefits review"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Location"
            name="location"
            value={values.location as string}
            onChange={wrappedChange}
            placeholder="e.g. Office / Zoom"
          />
          <InputField
            label="Meeting Link"
            name="meeting_url"
            value={values.meeting_url as string}
            onChange={wrappedChange}
            placeholder="https://..."
          />
        </div>
        <TextareaField
          label="Meeting Notes"
          name="notes"
          value={values.notes as string}
          onChange={wrappedChange}
          placeholder="Meeting agenda, discussion points, outcomes..."
          rows={6}
          minRows={5}
          autoExpand
          hint="Capture key decisions, action items, and follow-up commitments"
        />

        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{submitError}</p>
            <button type="button" onClick={retry} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors">
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Log Meeting" loadingLabel="Saving..." />
          <button type="button" onClick={() => confirmClose(onClose)} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
          <SaveIndicator status={status} errorMessage={errorMessage} />
        </div>
      </form>
    </Modal>
  );
}
