import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, AlertCircle, Loader2, GripVertical } from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';

interface TicketCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function TicketCategoriesSettings() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('ticket_categories')
        .select('id, name, slug, description, is_active, display_order')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setAddError('Category name is required.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const slug = slugify(name);
      const { error: err } = await supabase
        .from('ticket_categories')
        .insert({
          name,
          slug,
          description: newDescription.trim() || null,
          display_order: categories.length,
        });
      if (err) {
        if (err.code === '23505') throw new Error(`A category named "${name}" already exists.`);
        throw err;
      }
      toast.success(`Category "${name}" added`);
      setNewName('');
      setNewDescription('');
      await loadCategories();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (cat: TicketCategory) => {
    try {
      const { error: err } = await supabase
        .from('ticket_categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);
      if (err) throw err;
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c)),
      );
      toast.success(cat.is_active ? 'Category deactivated' : 'Category activated');
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (cat: TicketCategory) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeletingId(cat.id);
    try {
      const { error: err } = await supabase
        .from('ticket_categories')
        .delete()
        .eq('id', cat.id);
      if (err) throw err;
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success(`Category "${cat.name}" deleted`);
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Ticket Categories"
        subtitle="Manage categories for support ticket classification"
        icon={<Tag className="w-6 h-6" />}
      />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            Categories ({categories.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
            <Tag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No categories yet. Add one below.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-neutral-300 flex-shrink-0 cursor-grab" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${cat.is_active ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
                      {cat.name}
                    </span>
                    <code className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono">
                      {cat.slug}
                    </code>
                    {!cat.is_active && (
                      <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-neutral-500 mt-0.5">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      cat.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete category"
                  >
                    {deletingId === cat.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Add Category</h3>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[160px]">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
          {newName && (
            <p className="text-xs text-neutral-400 mt-1.5">
              Slug: <code className="font-mono">{slugify(newName)}</code>
            </p>
          )}
          {addError && (
            <p className="text-sm text-red-600 mt-2">{addError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
