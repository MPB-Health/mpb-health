import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';

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

  const { values, errors, loading, handleChange, handleSubmit } = useForm({
    initialValues: { title: '', description: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.title.trim()) errs.title = 'Title is required';
      if (!vals.description.trim()) errs.description = 'Note content is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const result = await activityService.addNote(leadId, vals.title as string, vals.description as string);
      if (!result.success) {
        toast.error(result.error || 'Failed to add note');
        return;
      }
      toast.success('Note added');
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Note" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Title"
          name="title"
          value={values.title as string}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="e.g. Initial consultation notes"
        />
        <TextareaField
          label="Note"
          name="description"
          value={values.description as string}
          onChange={handleChange}
          error={errors.description}
          required
          placeholder="Enter your note..."
          rows={4}
        />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Add Note" />
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
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

  const { values, errors, loading, handleChange, handleSubmit } = useForm({
    initialValues: { outcome: 'answered', direction: 'outbound', notes: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.outcome) errs.outcome = 'Outcome is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const result = await activityService.logCall(leadId, vals.outcome as string, vals.notes as string || undefined);
      if (!result.success) {
        toast.error(result.error || 'Failed to log call');
        return;
      }
      toast.success('Call logged');
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Log Call" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Outcome"
            name="outcome"
            value={values.outcome as string}
            onChange={handleChange}
            options={CALL_OUTCOME_OPTIONS}
            error={errors.outcome}
            required
          />
          <SelectField
            label="Direction"
            name="direction"
            value={values.direction as string}
            onChange={handleChange}
            options={CALL_DIRECTION_OPTIONS}
          />
        </div>
        <TextareaField
          label="Notes"
          name="notes"
          value={values.notes as string}
          onChange={handleChange}
          placeholder="Call notes..."
          rows={3}
        />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Log Call" />
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
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

  const { values, errors, loading, handleChange, handleSubmit } = useForm({
    initialValues: { title: '', location: '', meeting_url: '', notes: '' },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.title) errs.title = 'Meeting title is required';
      return errs;
    },
    onSubmit: async (vals) => {
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
        toast.error(result.error || 'Failed to log meeting');
        return;
      }
      toast.success('Meeting logged');
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Log Meeting" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Meeting Title"
          name="title"
          value={values.title as string}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="e.g. Benefits review"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Location"
            name="location"
            value={values.location as string}
            onChange={handleChange}
            placeholder="e.g. Office / Zoom"
          />
          <InputField
            label="Meeting Link"
            name="meeting_url"
            value={values.meeting_url as string}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
        <TextareaField
          label="Notes"
          name="notes"
          value={values.notes as string}
          onChange={handleChange}
          placeholder="Meeting notes..."
          rows={3}
        />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Log Meeting" />
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
