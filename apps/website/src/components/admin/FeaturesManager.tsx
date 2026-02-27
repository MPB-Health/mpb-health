import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Loader2, Plus, Trash2, Edit, X, AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import type {
  Plan,
  PlanFeature,
  PlanFeatureCreateInput,
  ServiceResult,
} from '../../hooks/useAdminPlans';

interface FeaturesManagerProps {
  plans: Plan[];
  getFeatures: (planId: string) => Promise<PlanFeature[]>;
  getCategories: () => Promise<string[]>;
  addFeature: (input: PlanFeatureCreateInput) => Promise<ServiceResult<{ featureId: string }>>;
  updateFeature: (id: string, updates: Partial<Omit<PlanFeatureCreateInput, 'plan_id'>>) => Promise<ServiceResult>;
  deleteFeature: (id: string) => Promise<ServiceResult>;
}

interface EditingFeature {
  id?: string;
  category: string;
  feature_name: string;
  feature_value: string;
  cost: string;
  notes: string;
  sort_order: number;
}

const EMPTY_FEATURE: EditingFeature = {
  category: '',
  feature_name: '',
  feature_value: '',
  cost: '',
  notes: '',
  sort_order: 0,
};

export const FeaturesManager: React.FC<FeaturesManagerProps> = ({
  plans,
  getFeatures,
  getCategories,
  addFeature,
  updateFeature,
  deleteFeature,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit / create form state
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<EditingFeature>(EMPTY_FEATURE);
  const [newCategory, setNewCategory] = useState('');

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Load features
  const loadFeatures = useCallback(async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    setError(null);
    try {
      const [feats, cats] = await Promise.all([
        getFeatures(selectedPlanId),
        getCategories(),
      ]);
      setFeatures(feats);
      setCategories(cats);
    } catch {
      setError('Failed to load features');
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, getFeatures, getCategories]);

  useEffect(() => {
    if (selectedPlanId) loadFeatures();
  }, [selectedPlanId, loadFeatures]);

  // Select first plan by default
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Group features by category
  const grouped = features.reduce<Record<string, PlanFeature[]>>((acc, f) => {
    const cat = f.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const openAddForm = () => {
    setEditingFeature({ ...EMPTY_FEATURE, sort_order: features.length });
    setShowForm(true);
  };

  const openEditForm = (f: PlanFeature) => {
    setEditingFeature({
      id: f.id,
      category: f.category,
      feature_name: f.feature_name,
      feature_value: f.feature_value ?? '',
      cost: f.cost ?? '',
      notes: f.notes ?? '',
      sort_order: f.sort_order,
    });
    setShowForm(true);
  };

  const handleSaveFeature = async () => {
    if (!selectedPlanId) return;
    if (!editingFeature.feature_name.trim()) {
      setError('Feature name is required');
      return;
    }

    const category = newCategory.trim() || editingFeature.category;
    if (!category) {
      setError('Category is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let result: ServiceResult<any>;

      if (editingFeature.id) {
        // Update
        result = await updateFeature(editingFeature.id, {
          category,
          feature_name: editingFeature.feature_name,
          feature_value: editingFeature.feature_value || undefined,
          cost: editingFeature.cost || undefined,
          notes: editingFeature.notes || undefined,
          sort_order: editingFeature.sort_order,
        });
      } else {
        // Create
        result = await addFeature({
          plan_id: selectedPlanId,
          category,
          feature_name: editingFeature.feature_name,
          feature_value: editingFeature.feature_value || undefined,
          cost: editingFeature.cost || undefined,
          notes: editingFeature.notes || undefined,
          sort_order: editingFeature.sort_order,
        });
      }

      if (result.success) {
        setSuccessMsg(editingFeature.id ? 'Feature updated' : 'Feature added');
        setShowForm(false);
        setNewCategory('');
        await loadFeatures();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error || 'Failed to save feature');
      }
    } catch {
      setError('Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const result = await deleteFeature(id);
      if (result.success) {
        setDeletingId(null);
        setSuccessMsg('Feature deleted');
        await loadFeatures();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error || 'Failed to delete feature');
      }
    } catch {
      setError('Failed to delete feature');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan selector */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Select Plan</label>
            <select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              title="Select plan"
            >
              <option value="">— Choose a plan —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {!p.is_active ? '(inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedPlanId && (
            <Button variant="primary" onClick={openAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          )}
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto" title="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* Feature form modal */}
      {showForm && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {editingFeature.id ? 'Edit Feature' : 'Add Feature'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
              <select
                value={editingFeature.category}
                onChange={e => setEditingFeature(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Feature category"
              >
                <option value="">— Select or create new —</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or type new category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Feature Name *</label>
              <input
                type="text"
                value={editingFeature.feature_name}
                onChange={e => setEditingFeature(prev => ({ ...prev, feature_name: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Annual Wellness Visit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Feature Value</label>
              <input
                type="text"
                value={editingFeature.feature_value}
                onChange={e => setEditingFeature(prev => ({ ...prev, feature_value: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Included, $50 copay"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Cost</label>
              <input
                type="text"
                value={editingFeature.cost}
                onChange={e => setEditingFeature(prev => ({ ...prev, cost: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. $0, $25/visit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
              <input
                type="text"
                value={editingFeature.notes}
                onChange={e => setEditingFeature(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Additional notes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sort Order</label>
              <input
                type="number"
                min={0}
                value={editingFeature.sort_order}
                onChange={e => setEditingFeature(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Sort order"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); setNewCategory(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveFeature} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingFeature.id ? 'Update' : 'Add'}
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-neutral-500">Loading features...</p>
        </Card>
      )}

      {/* Features by category */}
      {!loading && selectedPlanId && (
        <>
          {Object.keys(grouped).length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No features configured</h3>
              <p className="text-neutral-600 mb-4">Add features to describe what this plan includes.</p>
              <Button variant="primary" onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Feature
              </Button>
            </Card>
          ) : (
            Object.entries(grouped).map(([category, feats]) => (
              <Card key={category} className="p-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs uppercase">
                    {category}
                  </span>
                  <span className="text-neutral-400 text-sm font-normal">({feats.length} features)</span>
                </h3>
                <div className="divide-y divide-neutral-100">
                  {feats
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(f => (
                      <div
                        key={f.id}
                        className="flex items-center gap-4 py-3 group hover:bg-neutral-50 px-2 rounded"
                      >
                        <span className="h-4 w-4 text-neutral-300 flex-shrink-0">•</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-900 text-sm">{f.feature_name}</div>
                          <div className="text-xs text-neutral-500 flex gap-3 mt-0.5">
                            {f.feature_value && <span>Value: {f.feature_value}</span>}
                            {f.cost && <span>Cost: {f.cost}</span>}
                            {f.notes && <span>Note: {f.notes}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(f)}
                            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {deletingId === f.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteFeature(f.id)}
                                disabled={saving}
                              >
                                Confirm
                              </Button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="p-1.5 hover:bg-neutral-100 rounded"
                                title="Cancel delete"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(f.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
};
