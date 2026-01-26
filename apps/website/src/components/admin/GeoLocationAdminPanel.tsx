import React, { useEffect, useState } from 'react';
import {
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Search,
  Filter,
  Edit2,
  X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  getAllStateSettingsWithStatus, 
  updateStateSetting, 
  getStateStats,
  clearStateSettingsCache,
  GeoStateSetting 
} from '../../lib/geoLocationService';
import { useAuth } from '../../contexts/AuthContext';

export const GeoLocationAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [states, setStates] = useState<GeoStateSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, supported: 0, restricted: 0, unsupported: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'supported' | 'restricted' | 'unsupported'>('all');
  const [editingState, setEditingState] = useState<GeoStateSetting | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const [editForm, setEditForm] = useState({
    is_supported: true,
    is_restricted: false,
    restriction_message: '',
    not_supported_message: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      clearStateSettingsCache();
      const [statesResult, statsData] = await Promise.all([
        getAllStateSettingsWithStatus(),
        getStateStats()
      ]);
      setStates(statesResult.data);
      setStats(statsData);
      // Use explicit table existence status from the service
      setTableExists(statesResult.tableExists);
    } catch (error) {
      console.error('Error loading geo data:', error);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (state: GeoStateSetting) => {
    setEditingState(state);
    setEditForm({
      is_supported: state.is_supported,
      is_restricted: state.is_restricted,
      restriction_message: state.restriction_message || '',
      not_supported_message: state.not_supported_message || '',
      notes: state.notes || ''
    });
  };

  const handleSave = async () => {
    if (!editingState) return;

    setSaving(true);
    try {
      const result = await updateStateSetting(
        editingState.state_code,
        {
          is_supported: editForm.is_supported,
          is_restricted: editForm.is_restricted,
          restriction_message: editForm.restriction_message || undefined,
          not_supported_message: editForm.not_supported_message || undefined,
          notes: editForm.notes || undefined
        },
        user?.id
      );

      if (result) {
        setEditingState(null);
        await loadData();
      } else {
        alert('Failed to update state settings');
      }
    } catch (error) {
      console.error('Error saving state:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (state: GeoStateSetting, field: 'is_supported' | 'is_restricted') => {
    const newValue = !state[field];
    
    // If disabling support, also disable restriction
    const updates: any = { [field]: newValue };
    if (field === 'is_supported' && !newValue) {
      updates.is_restricted = false;
    }
    // If enabling restriction, ensure it's supported
    if (field === 'is_restricted' && newValue) {
      updates.is_supported = true;
    }

    const result = await updateStateSetting(state.state_code, updates, user?.id);
    if (result) {
      await loadData();
    }
  };

  const filteredStates = states.filter(state => {
    const matchesSearch = 
      state.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.state_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'supported' && state.is_supported && !state.is_restricted) ||
      (filter === 'restricted' && state.is_restricted) ||
      (filter === 'unsupported' && !state.is_supported);

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (state: GeoStateSetting) => {
    if (!state.is_supported) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (state.is_restricted) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = (state: GeoStateSetting) => {
    if (!state.is_supported) return 'Not Supported';
    if (state.is_restricted) return 'Restricted';
    return 'Supported';
  };

  const getStatusColor = (state: GeoStateSetting) => {
    if (!state.is_supported) return 'bg-red-50 border-red-200';
    if (state.is_restricted) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading geographic settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Geographic Service Settings</h2>
          <p className="text-neutral-600">Manage which states can access MPB Health services</p>
        </div>
        <Button onClick={loadData} variant="secondary" className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Table Not Found Warning */}
      {!tableExists && !loading && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Database Table Not Found</h3>
              <p className="text-sm text-red-800">
                The geo_state_settings table does not exist in the database. 
                Please run the migrations in the Supabase Dashboard SQL Editor to enable geographic settings management.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Total States</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Supported</p>
              <p className="text-2xl font-bold text-green-900">{stats.supported}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Restricted</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.restricted}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Not Supported</p>
              <p className="text-2xl font-bold text-red-900">{stats.unsupported}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-neutral-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              <option value="supported">Supported Only</option>
              <option value="restricted">Restricted Only</option>
              <option value="unsupported">Not Supported</option>
            </select>
          </div>
        </div>
      </Card>

      {/* States Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStates.map(state => (
          <Card
            key={state.state_code}
            className={`p-4 border-2 transition-all hover:shadow-md ${getStatusColor(state)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(state)}
                <div>
                  <h3 className="font-semibold text-neutral-900">{state.state_code}</h3>
                  <p className="text-sm text-neutral-600">{state.state_name}</p>
                </div>
              </div>
              <button
                onClick={() => handleEditClick(state)}
                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Status:</span>
                <span className={`font-medium ${
                  !state.is_supported ? 'text-red-600' :
                  state.is_restricted ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getStatusText(state)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleQuickToggle(state, 'is_supported')}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    state.is_supported
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {state.is_supported ? '✓ Supported' : 'Enable'}
                </button>
                <button
                  onClick={() => handleQuickToggle(state, 'is_restricted')}
                  disabled={!state.is_supported}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    state.is_restricted
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {state.is_restricted ? '⚠ Restricted' : 'Restrict'}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStates.length === 0 && (
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">No states match your search criteria</p>
        </Card>
      )}

      {/* Edit Modal */}
      {editingState && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEditingState(null)} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Edit {editingState.state_name} ({editingState.state_code})
                    </h2>
                    <p className="text-sm text-neutral-600">Configure service availability</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingState(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Support Toggle */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Service Supported</p>
                    <p className="text-sm text-neutral-600">Allow users from this state to enroll</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_supported}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        is_supported: e.target.checked,
                        is_restricted: e.target.checked ? editForm.is_restricted : false
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {/* Restriction Toggle */}
                <div className={`flex items-center justify-between p-4 bg-neutral-50 rounded-lg ${!editForm.is_supported ? 'opacity-50' : ''}`}>
                  <div>
                    <p className="font-medium text-neutral-900">Has Restrictions</p>
                    <p className="text-sm text-neutral-600">Show special requirements message</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_restricted}
                      onChange={(e) => setEditForm({ ...editForm, is_restricted: e.target.checked })}
                      disabled={!editForm.is_supported}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500 disabled:cursor-not-allowed"></div>
                  </label>
                </div>

                {/* Restriction Message */}
                {editForm.is_restricted && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Restriction Message
                    </label>
                    <textarea
                      value={editForm.restriction_message}
                      onChange={(e) => setEditForm({ ...editForm, restriction_message: e.target.value })}
                      rows={3}
                      placeholder="Custom message shown to users from this state..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Not Supported Message */}
                {!editForm.is_supported && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Not Supported Message
                    </label>
                    <textarea
                      value={editForm.not_supported_message}
                      onChange={(e) => setEditForm({ ...editForm, not_supported_message: e.target.value })}
                      rows={3}
                      placeholder="Custom message for users from unsupported states..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Internal Notes (Staff Only)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Notes for internal reference..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
                <Button variant="secondary" onClick={() => setEditingState(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How State Settings Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Supported</strong>: Users can enroll normally</li>
              <li>• <strong>Restricted</strong>: Users see a special message but can still proceed</li>
              <li>• <strong>Not Supported</strong>: Users are blocked from enrollment with a custom message</li>
              <li>• Changes take effect immediately across the website</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

