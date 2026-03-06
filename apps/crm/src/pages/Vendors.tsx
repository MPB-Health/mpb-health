import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Truck,
  Phone,
  Globe,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createVendorService,
  formatTimeAgo,
  type VendorWithRelations,
  type VendorFilters,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Vendor type options
const VENDOR_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'other', label: 'Other' },
];

// Active status options
const ACTIVE_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Get vendor type badge colors
function getVendorTypeColors(type: string) {
  switch (type) {
    case 'supplier':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'manufacturer':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    case 'distributor':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'contractor':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Render star rating
function renderStars(rating: number | null) {
  if (!rating) return <span className="text-sm text-th-text-tertiary">-</span>;
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function Vendors() {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize vendor service
  const [vendorService] = useState(() => createVendorService(supabase));

  const [vendors, setVendors] = useState<VendorWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VendorFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  // Bulk selection state
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());

  // Load vendors
  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { vendors: data, total: count } = await vendorService.getVendors(
        filters,
        pageSize,
        page * pageSize
      );
      setVendors(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [vendorService, filters, page]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedVendors(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleTypeFilter = (vendor_type: string) => {
    setFilters((prev) => ({ ...prev, vendor_type: vendor_type || undefined }));
    setPage(0);
  };

  const handleActiveFilter = (active: string) => {
    if (active === 'active') {
      setFilters((prev) => ({ ...prev, is_active: true }));
    } else if (active === 'inactive') {
      setFilters((prev) => ({ ...prev, is_active: false }));
    } else {
      setFilters((prev) => {
        const { is_active, ...rest } = prev;
        return rest;
      });
    }
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const csv = generateVendorCSV(vendors);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export vendors');
    }
  };

  const handleExportSelected = async () => {
    try {
      const selected = vendors.filter((v) => selectedVendors.has(v.id));
      const csv = generateVendorCSV(selected);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export vendors');
    }
  };

  // Generate CSV from vendors
  function generateVendorCSV(data: VendorWithRelations[]) {
    const headers = ['Name', 'Code', 'Type', 'Email', 'Phone', 'Website', 'Rating', 'Status', 'Created'];
    const rows = data.map((vendor) => [
      vendor.name,
      vendor.code || '',
      vendor.vendor_type || '',
      vendor.email || '',
      vendor.phone || '',
      vendor.website || '',
      vendor.rating != null ? String(vendor.rating) : '',
      vendor.is_active ? 'Active' : 'Inactive',
      new Date(vendor.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedVendors.size === vendors.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(vendors.map((v) => v.id)));
    }
  }, [vendors, selectedVendors.size]);

  const toggleSelectVendor = useCallback((vendorId: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (vendorId: string) => {
    navigate(`/vendors/${vendorId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedVendors.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedVendors.size} vendor{selectedVendors.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <PermissionGate permission="vendors.read">
              <button
                onClick={handleExportSelected}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Export Selected
              </button>
            </PermissionGate>
            <button
              onClick={() => setSelectedVendors(new Set())}
              className="text-sm text-th-text-tertiary hover:text-th-text-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Vendors</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total vendors</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="vendors.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="vendors.write">
            <button
              onClick={() => navigate('/vendors/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Vendor</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search by name, code, or email..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Vendor Type filter */}
          <div className="relative">
            <select
              value={filters.vendor_type || ''}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {VENDOR_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Active Status filter */}
          <div className="relative">
            <select
              value={
                filters.is_active === true
                  ? 'active'
                  : filters.is_active === false
                  ? 'inactive'
                  : ''
              }
              onChange={(e) => handleActiveFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {ACTIVE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Vendors table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Truck className="w-12 h-12 mb-4 opacity-50" />
            <p>No vendors found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new vendor</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedVendors.size === vendors.length && vendors.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {vendors.map((vendor) => {
                  const typeColors = getVendorTypeColors(vendor.vendor_type || '');
                  const isSelected = selectedVendors.has(vendor.id);

                  return (
                    <tr
                      key={vendor.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(vendor.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVendor(vendor.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {vendor.name}
                            </p>
                            {vendor.website && (
                              <a
                                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-th-text-tertiary hover:text-th-accent-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                {vendor.website}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vendor.vendor_type ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                          >
                            {vendor.vendor_type.charAt(0).toUpperCase() + vendor.vendor_type.slice(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {vendor.phone ? (
                          <a
                            href={`tel:${vendor.phone}`}
                            className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {vendor.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {renderStars(vendor.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {vendor.owner?.email || vendor.owner?.full_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(vendor.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-th-border">
                <p className="text-sm text-th-text-tertiary">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
