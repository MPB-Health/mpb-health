import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../Modal';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// CRM Round 7 — Special Project Types admin modal
// ---------------------------------------------------------------------------
// Spec: "project name (free text or pick-list)". This modal lets org
// admins curate the org-scoped pick-list backing
// `crm_special_project_types`. RLS on the underlying table restricts
// insert / update / delete to org admins, so reps who somehow open this
// dialog will see read-only behaviour.

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export function ProjectTypesAdminModal({ open, onClose, orgId }: Props) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['specialProjectTypesAdmin', orgId] as const,
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_special_project_types')
        .select('id,name,description,is_active,sort_order')
        .eq('org_id', orgId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProjectType[];
    },
    staleTime: 5_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['specialProjectTypesAdmin', orgId] });
    queryClient.invalidateQueries({ queryKey: ['specialProjectTypes', orgId] });
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Project name is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('crm_special_project_types').insert({
      org_id: orgId,
      name,
      description: newDescription.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Project type added');
    setNewName('');
    setNewDescription('');
    refresh();
  };

  const toggleActive = async (row: ProjectType) => {
    const { error } = await supabase
      .from('crm_special_project_types')
      .update({ is_active: !row.is_active })
      .eq('id', row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  };

  const remove = async (row: ProjectType) => {
    if (!confirm(`Delete "${row.name}"? Existing entries that reference this type will keep their saved name.`)) {
      return;
    }
    const { error } = await supabase
      .from('crm_special_project_types')
      .delete()
      .eq('id', row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Project type deleted');
    refresh();
  };

  return (
    <Modal open={open} onClose={onClose} title="Special Project types">
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Curate the pick-list reps see when logging a Special Project. Free-text entries remain
          available — this list just shortcuts the common ones (e.g. <em>Carrier escalation</em>,
          <em> Internal training</em>). Deleting a type does not affect entries already logged
          under that name.
        </p>

        <div className="bg-surface-secondary/40 border border-th-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-text-tertiary">
            Add new
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Carrier escalation)"
              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-th-text-tertiary text-sm">
            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-th-text-tertiary text-xs border border-dashed border-th-border rounded-2xl">
            No project types yet. Reps fall back to free-text project names until you add some.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary/40 text-[11px] uppercase tracking-wider text-th-text-tertiary">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold">Description</th>
                <th className="text-center px-3 py-2 font-semibold">Active</th>
                <th className="text-right px-3 py-2 font-semibold">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-th-text-primary">{row.name}</td>
                  <td className="px-3 py-2 text-th-text-tertiary">{row.description ?? '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={() => void toggleActive(row)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => void remove(row)}
                      className="p-1 rounded hover:bg-surface-secondary text-th-text-tertiary hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
