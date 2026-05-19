import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Loader2,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Check,
  BarChart3,
} from 'lucide-react';
import { redirectService, type CmsRedirect, type RedirectCreateInput } from '@mpbhealth/admin-core';
import { useAuth } from '../../../contexts/AuthContext';

export default function RedirectManager() {
  const { user } = useAuth();
  const [redirects, setRedirects] = useState<CmsRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await redirectService.getRedirects();
      setRedirects(data);
    } catch (e) {
      toast.error('Failed to load redirects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (input: RedirectCreateInput) => {
    try {
      await redirectService.createRedirect({ ...input, created_by: user?.id || null });
      toast.success('Redirect created');
      setShowAdd(false);
      load();
    } catch (e) {
      toast.error('Failed to create redirect');
    }
  };

  const handleUpdate = async (id: string, input: { from_path?: string; to_path?: string; status_code?: number }) => {
    try {
      await redirectService.updateRedirect(id, input);
      toast.success('Updated');
      setEditingId(null);
      load();
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this redirect?')) return;
    try {
      await redirectService.deleteRedirect(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await redirectService.toggleActive(id, active);
      load();
    } catch (e) {
      toast.error('Failed to toggle');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    const rows = lines.map((line) => {
      const [from_path, to_path, code] = line.split(',').map((s) => s.trim());
      return { from_path, to_path, status_code: code ? parseInt(code) : 301 };
    }).filter((r) => r.from_path && r.to_path);

    if (rows.length === 0) { toast.error('No valid rows found'); return; }

    const toastId = toast.loading(`Importing ${rows.length} redirects…`);
    try {
      await redirectService.bulkImport(rows, user?.id);
      toast.success(`Imported ${rows.length} redirects`, { id: toastId });
      load();
    } catch (e) {
      toast.error('Import failed', { id: toastId });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const csv = redirects.map((r) => `${r.from_path},${r.to_path},${r.status_code}`).join('\n');
    const blob = new Blob([`from_path,to_path,status_code\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'redirects.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = 'px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary text-sm';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Redirect Manager</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Manage 301/302 redirects. {redirects.length} total redirect{redirects.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={redirects.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Redirect
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleBulkImport} className="hidden" />
        </div>
      </header>

      {showAdd && (
        <RedirectForm
          onSubmit={handleCreate}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
        </div>
      ) : redirects.length === 0 ? (
        <div className="bg-surface-primary border border-dashed border-th-border rounded-xl p-12 text-center">
          <ArrowRight className="w-10 h-10 mx-auto text-th-text-tertiary mb-3" />
          <p className="text-th-text-secondary font-medium">No redirects yet</p>
          <p className="text-sm text-th-text-tertiary mt-1">Add your first redirect or import from CSV</p>
        </div>
      ) : (
        <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary/60 border-b border-th-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-th-text-secondary">From</th>
                <th className="text-left px-4 py-3 font-medium text-th-text-secondary">To</th>
                <th className="text-center px-4 py-3 font-medium text-th-text-secondary w-20">Code</th>
                <th className="text-center px-4 py-3 font-medium text-th-text-secondary w-20">
                  <BarChart3 className="w-4 h-4 inline" />
                </th>
                <th className="text-center px-4 py-3 font-medium text-th-text-secondary w-20">Active</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/60">
              {redirects.map((r) => (
                <tr key={r.id} className="hover:bg-surface-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs text-th-text-primary truncate max-w-[200px]">
                    {r.from_path}
                    {r.is_regex && <span className="ml-1 text-xs text-amber-600">regex</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-th-text-secondary truncate max-w-[200px]">{r.to_path}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                      {r.status_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-th-text-tertiary">{r.hit_count}</td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => handleToggle(r.id, !r.is_active)}>
                      {r.is_active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-neutral-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(r.id)}
                        className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded text-th-text-tertiary hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RedirectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { from_path: string; to_path: string; status_code: number };
  onSubmit: (input: RedirectCreateInput) => void;
  onCancel: () => void;
}) {
  const [from, setFrom] = useState(initial?.from_path || '');
  const [to, setTo] = useState(initial?.to_path || '');
  const [code, setCode] = useState(initial?.status_code || 301);

  const inputClass = 'px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary text-sm font-mono';

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-4 flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-th-text-secondary mb-1">From Path</label>
        <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-page" className={inputClass + ' w-full'} />
      </div>
      <ArrowRight className="w-5 h-5 text-th-text-tertiary flex-shrink-0 mb-2" />
      <div className="flex-1">
        <label className="block text-xs font-medium text-th-text-secondary mb-1">To Path</label>
        <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="/new-page" className={inputClass + ' w-full'} />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Code</label>
        <select value={code} onChange={(e) => setCode(Number(e.target.value))} className={inputClass + ' w-full'}>
          <option value={301}>301</option>
          <option value={302}>302</option>
          <option value={307}>307</option>
          <option value={308}>308</option>
        </select>
      </div>
      <button type="button" onClick={() => onSubmit({ from_path: from, to_path: to, status_code: code })} disabled={!from || !to} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
        <Check className="w-5 h-5" />
      </button>
      <button type="button" onClick={onCancel} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
