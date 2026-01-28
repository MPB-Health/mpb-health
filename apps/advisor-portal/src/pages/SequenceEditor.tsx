import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import {
  sequenceService,
  type SequenceWithSteps,
  type SequenceStep,
  type CreateStepInput,
  type StepActionType,
} from '@mpbhealth/champion-core';
import { useTemplates } from '../hooks/useInbox';

export default function SequenceEditor() {
  const { sequenceId } = useParams<{ sequenceId: string }>();
  const navigate = useNavigate();
  const { templates } = useTemplates();

  const [sequence, setSequence] = useState<SequenceWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadSequence = useCallback(async () => {
    if (!sequenceId) return;
    try {
      setLoading(true);
      const data = await sequenceService.getSequence(sequenceId);
      setSequence(data);
      if (data) {
        setName(data.name);
        setDescription(data.description || '');
      }
    } catch (err) {
      console.error('Failed to load sequence:', err);
    } finally {
      setLoading(false);
    }
  }, [sequenceId]);

  useEffect(() => {
    loadSequence();
  }, [loadSequence]);

  const handleSave = async () => {
    if (!sequenceId) return;
    try {
      setSaving(true);
      await sequenceService.updateSequence(sequenceId, { name, description });
      loadSequence();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!sequenceId || !sequence) return;
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    try {
      await sequenceService.updateStatus(sequenceId, newStatus);
      loadSequence();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleAddStep = async (actionType: StepActionType) => {
    if (!sequenceId || !sequence) return;
    const stepNumber = (sequence.steps?.length || 0) + 1;

    const input: CreateStepInput = {
      step_number: stepNumber,
      action_type: actionType,
      delay_days: stepNumber === 1 ? 0 : 1,
      delay_hours: 0,
      delay_minutes: 0,
    };

    if (actionType === 'send_email') {
      input.channel = 'email';
      input.subject = '';
      input.body_text = '';
    } else if (actionType === 'send_sms') {
      input.channel = 'sms';
      input.body_text = '';
    }

    try {
      await sequenceService.addStep(sequenceId, input);
      loadSequence();
    } catch (err) {
      console.error('Failed to add step:', err);
    }
  };

  const handleUpdateStep = async (stepId: string, updates: Partial<CreateStepInput>) => {
    try {
      await sequenceService.updateStep(stepId, updates);
      loadSequence();
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await sequenceService.deleteStep(stepId);
      loadSequence();
    } catch (err) {
      console.error('Failed to delete step:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 mb-4">Sequence not found</p>
        <button
          onClick={() => navigate('/sequences')}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          Back to Sequences
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sequences')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold text-neutral-900 bg-transparent border-none outline-none focus:ring-0 p-0"
              placeholder="Sequence name"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm text-neutral-500 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
              placeholder="Add a description..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {sequence.status === 'active' ? (
            <button
              onClick={handleStatusToggle}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStatusToggle}
              className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <Play className="w-4 h-4" />
              <span>Activate</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Sequence Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Send Window
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  defaultValue={sequence.send_window_start}
                  className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="time"
                  defaultValue={sequence.send_window_end}
                  className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Send Days
              </label>
              <div className="flex items-center space-x-1">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <button
                    key={day}
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      sequence.send_days.includes(day)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Exit Conditions
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sequence.exit_on_reply}
                    className="rounded border-neutral-300 text-primary-600"
                  />
                  <span className="text-sm text-neutral-600">Exit on reply</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sequence.exit_on_meeting_scheduled}
                    className="rounded border-neutral-300 text-primary-600"
                  />
                  <span className="text-sm text-neutral-600">Exit on meeting</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sequence.exit_on_unsubscribe}
                    className="rounded border-neutral-300 text-primary-600"
                  />
                  <span className="text-sm text-neutral-600">Exit on unsubscribe</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">Steps</h3>
        </div>

        {/* Steps list */}
        <div className="space-y-3">
          {sequence.steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isFirst={index === 0}
              isExpanded={expandedStep === step.id}
              templates={templates}
              onToggleExpand={() =>
                setExpandedStep(expandedStep === step.id ? null : step.id)
              }
              onUpdate={(updates) => handleUpdateStep(step.id, updates)}
              onDelete={() => handleDeleteStep(step.id)}
            />
          ))}

          {/* Add step buttons */}
          <div className="flex items-center justify-center space-x-4 py-4">
            <button
              onClick={() => handleAddStep('send_email')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Mail className="w-4 h-4" />
              <span>Add Email</span>
            </button>
            <button
              onClick={() => handleAddStep('send_sms')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step card component
function StepCard({
  step,
  stepNumber,
  isFirst,
  isExpanded,
  templates,
  onToggleExpand,
  onUpdate,
  onDelete,
}: {
  step: SequenceStep;
  stepNumber: number;
  isFirst: boolean;
  isExpanded: boolean;
  templates: any[];
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<CreateStepInput>) => void;
  onDelete: () => void;
}) {
  const [localSubject, setLocalSubject] = useState(step.subject || '');
  const [localBody, setLocalBody] = useState(step.body_text || '');
  const [localDelayDays, setLocalDelayDays] = useState(step.delay_days);
  const [localDelayHours, setLocalDelayHours] = useState(step.delay_hours);

  const handleSaveContent = () => {
    onUpdate({
      subject: localSubject,
      body_text: localBody,
      delay_days: localDelayDays,
      delay_hours: localDelayHours,
    });
  };

  const getDelayText = () => {
    if (isFirst && step.delay_days === 0 && step.delay_hours === 0) {
      return 'Immediately';
    }
    const parts = [];
    if (step.delay_days > 0) parts.push(`${step.delay_days} day${step.delay_days > 1 ? 's' : ''}`);
    if (step.delay_hours > 0) parts.push(`${step.delay_hours} hour${step.delay_hours > 1 ? 's' : ''}`);
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes} min`);
    return parts.length > 0 ? `Wait ${parts.join(' ')}` : 'Immediately';
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Step header */}
      <div
        className="flex items-center p-4 cursor-pointer hover:bg-neutral-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 text-sm font-semibold mr-3">
          {stepNumber}
        </div>

        <div className="flex items-center space-x-2 mr-3">
          {step.action_type === 'send_email' ? (
            <div className="flex items-center space-x-1 text-blue-600">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-green-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">SMS</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-neutral-500 text-sm mr-3">
          <Clock className="w-4 h-4" />
          <span>{getDelayText()}</span>
        </div>

        <div className="flex-1 truncate text-sm text-neutral-600">
          {step.subject || step.body_text?.substring(0, 50) || 'No content yet'}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-50 text-red-500 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-neutral-100">
          {/* Delay settings */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-medium text-neutral-700">Delay:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                value={localDelayDays}
                onChange={(e) => setLocalDelayDays(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-neutral-200 rounded text-sm"
              />
              <span className="text-sm text-neutral-500">days</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="23"
                value={localDelayHours}
                onChange={(e) => setLocalDelayHours(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-neutral-200 rounded text-sm"
              />
              <span className="text-sm text-neutral-500">hours</span>
            </div>
          </div>

          {/* Content */}
          {step.action_type === 'send_email' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={localSubject}
                onChange={(e) => setLocalSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {step.action_type === 'send_email' ? 'Body' : 'Message'}
            </label>
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder={
                step.action_type === 'send_email'
                  ? 'Email body...'
                  : 'SMS message...'
              }
              rows={4}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Use {'{{first_name}}'}, {'{{advisor_name}}'} for personalization
            </p>
          </div>

          <div className="flex items-center justify-between">
            <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
              <option value="">Use a template...</option>
              {templates
                .filter((t) =>
                  step.action_type === 'send_email'
                    ? t.channel === 'email' || t.channel === 'both'
                    : t.channel === 'sms' || t.channel === 'both'
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>

            <button
              onClick={handleSaveContent}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              Save Step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
