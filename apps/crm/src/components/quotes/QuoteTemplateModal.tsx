import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../Modal';
import {
  FileText,
  Plus,
  Star,
  Copy,
  Trash2,
  Edit2,
  Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../../contexts/CRMContext';
import { useOrg } from '../../contexts/OrgContext';
import type { QuoteTemplate } from '@mpbhealth/crm-core';

interface QuoteTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
}

export function QuoteTemplateModal({ open, onClose, onSelectTemplate }: QuoteTemplateModalProps) {
  const navigate = useNavigate();
  const { quoteTemplateService } = useCRM();
  const { can } = useOrg();
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    quoteTemplateService.getTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, [open, quoteTemplateService]);

  const handleCreate = () => {
    onClose();
    navigate('/quote-templates/new');
  };

  const handleEdit = (id: string) => {
    onClose();
    navigate(`/quote-templates/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    const result = await quoteTemplateService.duplicateTemplate(id);
    if (result.success) {
      toast.success('Template duplicated');
      const data = await quoteTemplateService.getTemplates();
      setTemplates(data);
    } else {
      toast.error(result.error || 'Failed to duplicate');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await quoteTemplateService.deleteTemplate(id);
    if (result.success) {
      toast.success('Template removed');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selected === id) setSelected('');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleSelect = () => {
    if (selected && onSelectTemplate) {
      onSelectTemplate(selected);
      onClose();
    }
  };

  const canManage = can('quote_templates.manage');

  return (
    <Modal open={open} onClose={onClose} title="Quote Templates" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-th-text-tertiary">
            {onSelectTemplate
              ? 'Select a template to apply branding and layout to your quote.'
              : 'Manage your reusable quote document templates.'}
          </p>
          {canManage && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Palette className="w-12 h-12 text-th-text-tertiary mb-3 opacity-50" />
            <p className="text-th-text-secondary font-medium">No templates yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">
              Create your first template to customize quote branding and layout.
            </p>
            {canManage && (
              <button
                onClick={handleCreate}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected === t.id
                    ? 'border-th-accent-500/50 bg-th-accent-500/5 ring-1 ring-th-accent-500/20'
                    : 'border-th-border hover:border-th-border-strong'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: t.branding?.primaryColor ? `${t.branding.primaryColor}15` : undefined }}
                >
                  <FileText
                    className="w-5 h-5"
                    style={{ color: t.branding?.primaryColor || undefined }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-th-text-primary truncate">
                      {t.name}
                    </span>
                    {t.is_default && (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                        <Star className="w-2.5 h-2.5" /> DEFAULT
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-th-text-tertiary truncate">{t.description}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(t.id); }}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
                      title="Edit template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(t.id); }}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
                      title="Duplicate template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-th-text-tertiary hover:text-red-600"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-th-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            Cancel
          </button>
          {onSelectTemplate && (
            <button
              disabled={!selected}
              onClick={handleSelect}
              className="flex-1 py-2.5 rounded-xl bg-th-accent-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-th-accent-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Apply Template
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
