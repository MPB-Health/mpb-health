import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createModuleService,
  createLayoutService,
  createDynamicRecordService,
  type StudioModuleWithRelations,
  type StudioLayout,
  type DynamicRecord,
  type ValidationError,
} from '@mpbhealth/crm-core';
import { DynamicForm } from '../../components/studio';
import { supabase } from '../../lib/supabase';

export default function CustomModuleDetail() {
  const { moduleApiName, id } = useParams<{ moduleApiName: string; id: string }>();
  const navigate = useNavigate();

  // Determine if we're creating or editing
  const isNew = id === 'new';

  // Initialize services
  const [moduleService] = useState(() => createModuleService(supabase));
  const [layoutService] = useState(() => createLayoutService(supabase));
  const [dynamicRecordService] = useState(() => createDynamicRecordService(supabase));

  // State
  const [module, setModule] = useState<StudioModuleWithRelations | null>(null);
  const [layout, setLayout] = useState<StudioLayout | null>(null);
  const [record, setRecord] = useState<DynamicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load module, layout, and record data
  const loadData = useCallback(async () => {
    if (!moduleApiName) return;

    setLoading(true);
    try {
      // Load module by API name
      const moduleData = await moduleService.getModuleByApiName(moduleApiName);
      if (!moduleData) {
        toast.error('Module not found');
        navigate('/studio');
        return;
      }
      setModule(moduleData);

      // Load the appropriate layout
      const layoutType = isNew ? 'create' : 'edit';
      const layoutData = await layoutService.getDefaultLayout(moduleData.id, layoutType);

      if (!layoutData) {
        // Try falling back to any layout type
        const fallbackLayout = await layoutService.getDefaultLayout(moduleData.id, 'edit');
        if (fallbackLayout) {
          setLayout(fallbackLayout);
        } else {
          console.warn('No layout found for module');
        }
      } else {
        setLayout(layoutData);
      }

      // Load existing record if editing
      if (!isNew && id) {
        const recordData = await dynamicRecordService.getRecord(moduleData, id);
        if (!recordData) {
          toast.error('Record not found');
          navigate(`/studio/${moduleApiName}`);
          return;
        }
        setRecord(recordData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [moduleApiName, id, isNew, moduleService, layoutService, dynamicRecordService, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle form submission
  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!module) return;

    setSubmitting(true);
    setValidationErrors([]);

    try {
      if (isNew) {
        // Create new record
        const result = await dynamicRecordService.createRecord(module, data);

        if (!result.success) {
          if (result.validationErrors && result.validationErrors.length > 0) {
            setValidationErrors(result.validationErrors);
            toast.error('Please fix the validation errors');
          } else {
            toast.error(result.error || 'Failed to create record');
          }
          return;
        }

        toast.success(`${module.singular_name} created successfully`);
        // Navigate to the newly created record
        navigate(`/studio/${moduleApiName}/${result.recordId}`);
      } else {
        // Update existing record
        if (!id) return;

        const result = await dynamicRecordService.updateRecord(module, id, data);

        if (!result.success) {
          if (result.validationErrors && result.validationErrors.length > 0) {
            setValidationErrors(result.validationErrors);
            toast.error('Please fix the validation errors');
          } else {
            toast.error(result.error || 'Failed to update record');
          }
          return;
        }

        toast.success(`${module.singular_name} updated successfully`);
        // Reload the record to get the latest data
        await loadData();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle record deletion
  const handleDelete = async () => {
    if (!module || !id || isNew) return;

    setDeleting(true);
    try {
      const result = await dynamicRecordService.deleteRecord(module, id);

      if (!result.success) {
        toast.error(result.error || 'Failed to delete record');
        return;
      }

      toast.success(`${module.singular_name} deleted successfully`);
      navigate(`/studio/${moduleApiName}`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    if (isNew) {
      navigate(`/studio/${moduleApiName}`);
    } else {
      // Reload the record to discard changes
      loadData();
    }
  };

  // Navigate back to list
  const navigateToList = () => {
    navigate(`/studio/${moduleApiName}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  // Module not found
  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Module not found</p>
        <button
          onClick={() => navigate('/studio')}
          className="text-th-accent-600 hover:underline mt-2 inline-block"
        >
          Back to Studio
        </button>
      </div>
    );
  }

  // No layout available - show basic message
  if (!layout) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToList}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {isNew ? `New ${module.singular_name}` : record?.name || module.singular_name}
            </h1>
            <p className="text-sm text-th-text-tertiary">{module.plural_name}</p>
          </div>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-8 text-center">
          <p className="text-th-text-tertiary">
            No layout configured for this module. Please create a layout in Studio settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToList}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {isNew ? `New ${module.singular_name}` : record?.name || module.singular_name}
            </h1>
            <p className="text-sm text-th-text-tertiary">{module.plural_name}</p>
          </div>
        </div>

        {/* Delete button for existing records */}
        {!isNew && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Form */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <DynamicForm
          module={module}
          layout={layout}
          fields={module.fields || []}
          record={record || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          validationErrors={validationErrors}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">
              Delete {module.singular_name}
            </h3>
            <p className="text-th-text-secondary mb-6">
              Are you sure you want to delete "{record?.name}"? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
