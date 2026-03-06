import { Link } from 'react-router-dom';
import {
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  Code,
  BarChart3,
  MoreVertical,
  FileInput,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { WebForm, FormStatus } from '@mpbhealth/crm-core';

const statusColors: Record<FormStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  archived: { bg: 'bg-red-100', text: 'text-red-700' },
};

interface FormCardProps {
  form: WebForm;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (slug: string) => void;
  onShowEmbed: (form: WebForm) => void;
}

export function FormCard({ form, onDuplicate, onDelete, onCopyLink, onShowEmbed }: FormCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusStyle = statusColors[form.status] || statusColors.draft;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileInput className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Link
              to={`/web-forms/${form.id}/edit`}
              className="text-sm font-semibold text-th-text-primary hover:text-th-accent-600"
            >
              {form.name}
            </Link>
            <span
              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-48 bg-surface-primary rounded-lg border border-th-border shadow-lg py-1">
              <Link
                to={`/web-forms/${form.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary"
              >
                <Edit className="w-4 h-4" /> Edit
              </Link>
              <Link
                to={`/web-forms/${form.id}/submissions`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary"
              >
                <BarChart3 className="w-4 h-4" /> View Submissions
              </Link>
              <button
                onClick={() => { onDuplicate(form.id); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary w-full text-left"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button
                onClick={() => { onCopyLink(form.slug); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary w-full text-left"
              >
                <ExternalLink className="w-4 h-4" /> Copy Link
              </button>
              <button
                onClick={() => { onShowEmbed(form); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary w-full text-left"
              >
                <Code className="w-4 h-4" /> Embed Code
              </button>
              <div className="border-t border-th-border my-1" />
              <button
                onClick={() => { onDelete(form.id); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {form.description && (
        <p className="text-xs text-th-text-tertiary mb-3 line-clamp-2">{form.description}</p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold text-th-text-primary">{form.submit_count}</p>
          <p className="text-xs text-th-text-tertiary">Submissions</p>
        </div>
        <div>
          <p className="text-sm text-th-text-secondary">{formatDate(form.last_submission_at)}</p>
          <p className="text-xs text-th-text-tertiary">Last Submission</p>
        </div>
        <div>
          <p className="text-sm text-th-text-secondary">{formatDate(form.created_at)}</p>
          <p className="text-xs text-th-text-tertiary">Created</p>
        </div>
      </div>
    </div>
  );
}
