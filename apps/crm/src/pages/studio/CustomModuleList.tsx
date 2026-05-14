import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createModuleService,
  createViewService,
  createDynamicRecordService,
  type StudioModuleWithRelations,
  type StudioView,
  type DynamicRecord,
  type DynamicFilters,
} from '@mpbhealth/crm-core';
import { DynamicList } from '../../components/studio';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 50;

export default function CustomModuleList() {
  const { moduleApiName } = useParams<{ moduleApiName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize services
  const moduleService = useMemo(() => createModuleService(supabase), []);
  const viewService = useMemo(() => createViewService(supabase), []);
  const dynamicRecordService = useMemo(() => createDynamicRecordService(supabase), []);

  // State
  const [module, setModule] = useState<StudioModuleWithRelations | null>(null);
  const [views, setViews] = useState<StudioView[]>([]);
  const [activeView, setActiveView] = useState<StudioView | null>(null);
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortFieldId, setSortFieldId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load module by API name
  const loadModule = useCallback(async () => {
    if (!moduleApiName) return null;

    try {
      const moduleData = await moduleService.getModuleByApiName(moduleApiName);
      if (!moduleData) {
        toast.error('Module not found');
        navigate('/studio/legacy');
        return null;
      }
      setModule(moduleData);
      return moduleData;
    } catch (error) {
      console.error('Failed to load module:', error);
      toast.error('Failed to load module');
      return null;
    }
  }, [moduleApiName, moduleService, navigate]);

  // Load views for the module
  const loadViews = useCallback(async (moduleId: string) => {
    try {
      const viewsData = await viewService.getViews(moduleId, user?.id);
      setViews(viewsData);

      // Set the default view if available
      if (user?.id) {
        const defaultView = await viewService.getDefaultView(moduleId, user.id);
        if (defaultView) {
          setActiveView(defaultView);
          // Apply view's sort settings
          if (defaultView.sort_field_id) {
            setSortFieldId(defaultView.sort_field_id);
            setSortDirection(defaultView.sort_direction || 'desc');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load views:', error);
    }
  }, [viewService, user?.id]);

  // Load records
  const loadRecords = useCallback(async (
    moduleData: StudioModuleWithRelations,
    currentView?: StudioView | null,
    currentPage: number = 1,
    search: string = '',
    sortField: string | null = null,
    sortDir: 'asc' | 'desc' = 'desc'
  ) => {
    try {
      const filters: DynamicFilters = {};
      if (search) {
        filters.search = search;
      }

      // Create a modified view for sorting if we have custom sort
      let effectiveView = currentView || undefined;
      if (sortField) {
        effectiveView = {
          ...(currentView || {} as StudioView),
          sort_field_id: sortField,
          sort_direction: sortDir,
        } as StudioView;
      }

      const offset = (currentPage - 1) * PAGE_SIZE;
      const { records: data, total: count } = await dynamicRecordService.getRecords(
        moduleData,
        filters,
        effectiveView,
        PAGE_SIZE,
        offset
      );

      setRecords(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load records:', error);
      toast.error('Failed to load records');
    }
  }, [dynamicRecordService]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const moduleData = await loadModule();
      if (moduleData) {
        await loadViews(moduleData.id);
      }
      setLoading(false);
    };
    init();
  }, [loadModule, loadViews]);

  // Load records when module, view, page, search, or sort changes
  useEffect(() => {
    if (module && !loading) {
      loadRecords(module, activeView, page, searchTerm, sortFieldId, sortDirection);
    }
  }, [module, activeView, page, searchTerm, sortFieldId, sortDirection, loadRecords, loading]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!module) return;
    setRefreshing(true);
    await loadRecords(module, activeView, page, searchTerm, sortFieldId, sortDirection);
    setRefreshing(false);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle search
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPage(1); // Reset to first page on search
  };

  // Handle sort
  const handleSort = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortFieldId(fieldId);
    setSortDirection(direction);
    setPage(1); // Reset to first page on sort change
  };

  // Handle record click - navigate to detail page
  const handleRecordClick = (record: DynamicRecord) => {
    navigate(`/custom/${moduleApiName}/${record.id}`);
  };

  // Handle edit - navigate to edit page (same as detail for now)
  const handleEdit = (record: DynamicRecord) => {
    navigate(`/custom/${moduleApiName}/${record.id}`);
  };

  // Handle delete
  const handleDelete = async (recordIds: string[]) => {
    if (!module) return;

    const confirmMessage = recordIds.length === 1
      ? `Are you sure you want to delete this ${module.singular_name.toLowerCase()}?`
      : `Are you sure you want to delete ${recordIds.length} ${module.plural_name.toLowerCase()}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await dynamicRecordService.deleteRecords(module, recordIds);

      if (!result.success) {
        toast.error(result.error || 'Failed to delete records');
        return;
      }

      toast.success(
        recordIds.length === 1
          ? `${module.singular_name} deleted successfully`
          : `${result.deletedCount} ${module.plural_name.toLowerCase()} deleted successfully`
      );

      // Reload records
      await loadRecords(module, activeView, page, searchTerm, sortFieldId, sortDirection);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete records');
    }
  };

  // Handle view change
  const handleViewChange = (viewId: string) => {
    const selectedView = views.find((v) => v.id === viewId) || null;
    setActiveView(selectedView);

    // Apply view's sort settings
    if (selectedView?.sort_field_id) {
      setSortFieldId(selectedView.sort_field_id);
      setSortDirection(selectedView.sort_direction || 'desc');
    } else {
      setSortFieldId(null);
      setSortDirection('desc');
    }

    setPage(1); // Reset to first page
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
        <Link
          to="/studio/legacy"
          className="text-th-accent-600 hover:underline mt-2 inline-block"
        >
          Back to Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/studio/legacy')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">{module.plural_name}</h1>
            <p className="text-th-text-tertiary text-sm mt-1">{total} total records</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* View selector */}
          {views.length > 0 && (
            <select
              value={activeView?.id || ''}
              onChange={(e) => handleViewChange(e.target.value)}
              className="px-3 py-2 border border-th-border rounded-lg text-sm bg-surface-primary text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Records</option>
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to={`/custom/${moduleApiName}/new`}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>New {module.singular_name}</span>
          </Link>
        </div>
      </div>

      {/* Dynamic List */}
      <DynamicList
        module={module}
        fields={module.fields || []}
        view={activeView}
        records={records}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
        onRecordClick={handleRecordClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSort={handleSort}
        onSearch={handleSearch}
        sortFieldId={sortFieldId}
        sortDirection={sortDirection}
        searchTerm={searchTerm}
        loading={refreshing}
      />
    </div>
  );
}
