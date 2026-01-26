import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Zap,
  FileText,
  Globe,
  Lock,
  UserCheck,
  X,
  ChevronDown,
  Play,
  Save,
  Loader2,
  AlertCircle,
  Check,
  User,
  Users2,
  Presentation,
  GraduationCap,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string | null;
  meeting_type: MeetingType;
  default_duration: number;
  default_visibility: MeetingVisibility;
  default_agenda: string | null;
  require_registration: boolean;
  allow_guests: boolean;
  auto_record: boolean;
}

export type MeetingType = 'all_hands' | 'group' | 'one_on_one' | 'training' | 'webinar';
export type MeetingVisibility = 'all' | 'selected' | 'private';

export interface AdvisorForSelection {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  avatar_url?: string;
}

export interface MeetingFormData {
  title: string;
  description: string;
  meeting_type: MeetingType;
  scheduled_at: string;
  scheduled_time: string;
  duration_minutes: number;
  visibility: MeetingVisibility;
  selected_advisors: string[];
  agenda: string;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | 'biweekly' | 'monthly' | null;
  require_registration: boolean;
  allow_guests: boolean;
  auto_record: boolean;
  reminder_minutes: number;
  passcode: string;
  max_participants: number | null;
}

interface MeetingSchedulerProps {
  templates: MeetingTemplate[];
  advisors: AdvisorForSelection[];
  onSchedule: (data: MeetingFormData, startNow: boolean) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<MeetingFormData>;
  isEditing?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MEETING_TYPES: { value: MeetingType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'all_hands', label: 'All-Hands', icon: <Users2 className="w-5 h-5" />, description: 'Everyone attends' },
  { value: 'group', label: 'Group Call', icon: <Users className="w-5 h-5" />, description: 'Selected team members' },
  { value: 'one_on_one', label: '1-on-1', icon: <User className="w-5 h-5" />, description: 'Individual meeting' },
  { value: 'training', label: 'Training', icon: <GraduationCap className="w-5 h-5" />, description: 'Learning session' },
  { value: 'webinar', label: 'Webinar', icon: <Presentation className="w-5 h-5" />, description: 'Presentation mode' },
];

const VISIBILITY_OPTIONS: { value: MeetingVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'all', label: 'All Advisors', icon: <Globe className="w-5 h-5" />, description: 'Visible to everyone' },
  { value: 'selected', label: 'Selected Only', icon: <UserCheck className="w-5 h-5" />, description: 'Invite specific people' },
  { value: 'private', label: 'Private', icon: <Lock className="w-5 h-5" />, description: 'Hidden from calendar' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'No reminder' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

// ============================================================================
// Component
// ============================================================================

export function MeetingScheduler({
  templates,
  advisors,
  onSchedule,
  onCancel,
  initialData,
  isEditing = false,
}: MeetingSchedulerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(!isEditing);
  const [showAdvisorSelector, setShowAdvisorSelector] = useState(false);
  const [advisorSearch, setAdvisorSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState<MeetingFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    meeting_type: initialData?.meeting_type || 'group',
    scheduled_at: initialData?.scheduled_at || new Date().toISOString().split('T')[0],
    scheduled_time: initialData?.scheduled_time || getNextHalfHour(),
    duration_minutes: initialData?.duration_minutes || 60,
    visibility: initialData?.visibility || 'all',
    selected_advisors: initialData?.selected_advisors || [],
    agenda: initialData?.agenda || '',
    is_recurring: initialData?.is_recurring || false,
    recurrence_pattern: initialData?.recurrence_pattern || null,
    require_registration: initialData?.require_registration || false,
    allow_guests: initialData?.allow_guests || false,
    auto_record: initialData?.auto_record || false,
    reminder_minutes: initialData?.reminder_minutes || 30,
    passcode: initialData?.passcode || '',
    max_participants: initialData?.max_participants || null,
  });

  // Get next half hour for default time
  function getNextHalfHour(): string {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    if (roundedMinutes === 0) {
      now.setHours(now.getHours() + 1);
    }
    now.setMinutes(roundedMinutes);
    return now.toTimeString().slice(0, 5);
  }

  // Quick time presets
  const timePresets = [
    { label: 'Now', getValue: () => new Date().toTimeString().slice(0, 5) },
    { label: '9 AM', getValue: () => '09:00' },
    { label: '12 PM', getValue: () => '12:00' },
    { label: '3 PM', getValue: () => '15:00' },
    { label: '5 PM', getValue: () => '17:00' },
  ];

  // Quick date presets
  const datePresets = [
    { label: 'Today', getValue: () => new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }},
    { label: 'Next Week', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }},
  ];

  // Apply template
  const applyTemplate = (template: MeetingTemplate) => {
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description || '',
      meeting_type: template.meeting_type,
      duration_minutes: template.default_duration,
      visibility: template.default_visibility,
      agenda: template.default_agenda || '',
      require_registration: template.require_registration,
      allow_guests: template.allow_guests,
      auto_record: template.auto_record,
    }));
    setShowTemplates(false);
  };

  // Toggle advisor selection
  const toggleAdvisor = (advisorId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_advisors: prev.selected_advisors.includes(advisorId)
        ? prev.selected_advisors.filter(id => id !== advisorId)
        : [...prev.selected_advisors, advisorId],
    }));
  };

  // Select all advisors
  const selectAllAdvisors = () => {
    setFormData(prev => ({
      ...prev,
      selected_advisors: advisors.filter(a => a.status === 'active').map(a => a.id),
    }));
  };

  // Clear all advisors
  const clearAllAdvisors = () => {
    setFormData(prev => ({
      ...prev,
      selected_advisors: [],
    }));
  };

  // Filter advisors by search
  const filteredAdvisors = advisors.filter(advisor => {
    const search = advisorSearch.toLowerCase();
    return (
      advisor.first_name.toLowerCase().includes(search) ||
      advisor.last_name.toLowerCase().includes(search) ||
      advisor.email.toLowerCase().includes(search)
    );
  });

  // Handle form submission
  const handleSubmit = async (startNow: boolean = false) => {
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    if (formData.visibility === 'selected' && formData.selected_advisors.length === 0) {
      setError('Please select at least one advisor');
      return;
    }

    if (formData.meeting_type === 'one_on_one' && formData.selected_advisors.length !== 1) {
      setError('1-on-1 meetings require exactly one advisor');
      return;
    }

    setLoading(true);
    try {
      await onSchedule(formData, startNow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  // Get selected advisor names for display
  const selectedAdvisorNames = formData.selected_advisors
    .map(id => {
      const advisor = advisors.find(a => a.id === id);
      return advisor ? `${advisor.first_name} ${advisor.last_name}` : '';
    })
    .filter(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h2>
              <p className="text-blue-100 text-sm">
                {isEditing ? 'Update meeting details' : 'Create a video conference with advisors'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Template Selection */}
        {showTemplates && !isEditing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Quick Start from Template</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                Skip
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {MEETING_TYPES.find(t => t.value === template.meeting_type)?.icon}
                    <span className="font-medium text-gray-900 group-hover:text-blue-700">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {template.default_duration} min
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Weekly Team Sync"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's this meeting about?"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MEETING_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData(prev => ({ ...prev, meeting_type: type.value }))}
                    className={cn(
                      'p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                      formData.meeting_type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                    title={type.description}
                  >
                    {type.icon}
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-1 mt-1">
                  {datePresets.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setFormData(prev => ({ ...prev, scheduled_at: preset.getValue() }))}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-1 mt-1 flex-wrap">
                  {timePresets.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setFormData(prev => ({ ...prev, scheduled_time: preset.getValue() }))}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, duration_minutes: option.value }))}
                    className={cn(
                      'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      formData.duration_minutes === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can join?
              </label>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, visibility: option.value }))}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left',
                      formData.visibility === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      formData.visibility === option.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                    {formData.visibility === option.value && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Advisor Selection (shown when 'selected' visibility or 1-on-1) */}
            {(formData.visibility === 'selected' || formData.meeting_type === 'one_on_one') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4 inline mr-1" />
                    Select Advisors {formData.meeting_type === 'one_on_one' ? '(1)' : `(${formData.selected_advisors.length})`}
                  </label>
                  <div className="flex gap-2">
                    {formData.meeting_type !== 'one_on_one' && (
                      <>
                        <button
                          onClick={selectAllAdvisors}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearAllAdvisors}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected advisors badges */}
                {selectedAdvisorNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedAdvisorNames.slice(0, 5).map((name, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700">
                        {name}
                      </Badge>
                    ))}
                    {selectedAdvisorNames.length > 5 && (
                      <Badge variant="outline" className="bg-gray-50">
                        +{selectedAdvisorNames.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Advisor search & list */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    value={advisorSearch}
                    onChange={(e) => setAdvisorSearch(e.target.value)}
                    placeholder="Search advisors..."
                    className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredAdvisors.map(advisor => (
                      <button
                        key={advisor.id}
                        onClick={() => {
                          if (formData.meeting_type === 'one_on_one') {
                            setFormData(prev => ({ ...prev, selected_advisors: [advisor.id] }));
                          } else {
                            toggleAdvisor(advisor.id);
                          }
                        }}
                        className={cn(
                          'w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left',
                          formData.selected_advisors.includes(advisor.id) && 'bg-blue-50'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                          formData.selected_advisors.includes(advisor.id) ? 'bg-blue-600' : 'bg-gray-400'
                        )}>
                          {advisor.first_name[0]}{advisor.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {advisor.first_name} {advisor.last_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{advisor.email}</div>
                        </div>
                        {formData.selected_advisors.includes(advisor.id) && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredAdvisors.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-500 text-sm">
                        No advisors found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Agenda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Agenda (Optional)
              </label>
              <textarea
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="1. Welcome&#10;2. Updates&#10;3. Discussion&#10;4. Q&A"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_recurring: e.target.checked,
                      recurrence_pattern: e.target.checked ? 'weekly' : null,
                    }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Recurring meeting</span>
                </label>

                {formData.is_recurring && (
                  <select
                    value={formData.recurrence_pattern || 'weekly'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrence_pattern: e.target.value as 'weekly' | 'biweekly' | 'monthly',
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_record}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_record: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-record meeting</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Reminder:</span>
                  <select
                    value={formData.reminder_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminder_minutes: parseInt(e.target.value) }))}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {REMINDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {/* Schedule for Later */}
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Save Changes' : 'Schedule'}
          </Button>

          {/* Start Now */}
          {!isEditing && (
            <Button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Start Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingScheduler;
