import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Settings, ArrowLeft, ChevronDown } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { FieldPalette } from '../components/forms/FieldPalette';
import { FormCanvas } from '../components/forms/FormCanvas';
import { FieldPropertyEditor } from '../components/forms/FieldPropertyEditor';
import { FormSettingsDrawer } from '../components/forms/FormSettingsDrawer';
import { FormPreviewModal } from '../components/forms/FormPreviewModal';
import type {
  FormField,
  FormFieldType,
  FormSettings,
  FormStyling,
  FormEntityType,
  FormStatus,
} from '@mpbhealth/crm-core';

const DEFAULT_LABEL: Record<FormFieldType, string> = {
  text: 'Text Field',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  textarea: 'Message',
  select: 'Dropdown',
  radio: 'Radio Group',
  checkbox: 'Checkbox',
  date: 'Date',
  hidden: 'Hidden Field',
  heading: 'Section Heading',
  paragraph: 'Paragraph',
  product_selector: 'Product Selector',
  product_quantity: 'Product Quantity',
  product_config: 'Product Configuration',
};

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formService, orgId } = useCRM();
  const isEditing = Boolean(id);

  // Form state
  const [name, setName] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [entityType, setEntityType] = useState<FormEntityType>('lead');
  const [status, setStatus] = useState<FormStatus>('draft');
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>({});
  const [styling, setStyling] = useState<FormStyling>({});

  // UI state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Load existing form
  useEffect(() => {
    if (!id) return;

    const loadForm = async () => {
      setLoading(true);
      const form = await formService.getForm(id);
      if (form) {
        setName(form.name);
        setDescription(form.description || '');
        setSlug(form.slug);
        setEntityType(form.entity_type);
        setStatus(form.status);
        setFields(form.fields || []);
        setSettings(form.settings || {});
        setStyling(form.styling || {});
      }
      setLoading(false);
    };

    loadForm();
  }, [id, formService]);

  const generateSlug = useCallback((formName: string) => {
    return formName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'form';
  }, []);

  const createField = (type: FormFieldType): FormField => ({
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: DEFAULT_LABEL[type] || type,
    placeholder: '',
    required: false,
    width: 'full',
    options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    content: type === 'heading' || type === 'paragraph' ? DEFAULT_LABEL[type] : undefined,
  });

  const handleAddField = (type: FormFieldType) => {
    const newField = createField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleAddFieldAtIndex = (type: FormFieldType, index: number) => {
    const newField = createField(type);
    setFields((prev) => {
      const next = [...prev];
      next.splice(index, 0, newField);
      return next;
    });
    setSelectedFieldId(newField.id);
  };

  const handleRemoveField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleUpdateField = (updates: Partial<FormField>) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f))
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const formSlug = slug || generateSlug(name);

    if (isEditing && id) {
      await formService.updateForm(id, {
        name,
        description: description || undefined,
        slug: formSlug,
        entity_type: entityType,
        status,
        fields,
        settings,
        styling,
      });
    } else {
      const result = await formService.createForm({
        name,
        description: description || undefined,
        slug: formSlug,
        entity_type: entityType,
        status,
        fields,
        settings,
        styling,
      });

      if (result.success && result.formId) {
        navigate(`/web-forms/${result.formId}/edit`, { replace: true });
      }
    }

    setSaving(false);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!isEditing && !slug) {
      setSlug(generateSlug(newName));
    }
  };

  const handleToggleStatus = () => {
    setStatus((prev) => (prev === 'active' ? 'draft' : 'active'));
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-surface-primary shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/web-forms')}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-lg font-semibold text-th-text-primary bg-transparent border-none outline-none focus:ring-0 min-w-[200px]"
            placeholder="Form name"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status toggle */}
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${
              status === 'active'
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
            {status === 'active' ? 'Active' : 'Draft'}
            <ChevronDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Builder area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Field palette */}
        <div className="w-56 border-r border-th-border bg-surface-primary overflow-y-auto p-4 shrink-0">
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Center panel - Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary">
          <div className="max-w-2xl mx-auto">
            <FormCanvas
              fields={fields}
              styling={styling}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onReorderFields={setFields}
              onRemoveField={handleRemoveField}
              onAddFieldAtIndex={handleAddFieldAtIndex}
            />
          </div>
        </div>

        {/* Right panel - Field properties */}
        <div className="w-64 border-l border-th-border bg-surface-primary overflow-y-auto p-4 shrink-0">
          {selectedField ? (
            <FieldPropertyEditor
              field={selectedField}
              onUpdate={handleUpdateField}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-th-text-tertiary text-center">
              <p className="text-sm">Select a field to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings drawer */}
      <FormSettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        name={name}
        description={description}
        slug={slug}
        entityType={entityType}
        settings={settings}
        styling={styling}
        onUpdateName={setName}
        onUpdateDescription={setDescription}
        onUpdateSlug={setSlug}
        onUpdateEntityType={setEntityType}
        onUpdateSettings={setSettings}
        onUpdateStyling={setStyling}
      />

      {/* Preview modal */}
      <FormPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        fields={fields}
        styling={styling}
      />
    </div>
  );
}
