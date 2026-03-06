import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Edit2,
  Mail,
  Star,
  DollarSign,
  FileText,
  Tag,
  Hash,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createVendorService,
  createPurchaseOrderService,
  formatTimeAgo,
  type VendorWithRelations,
  type PurchaseOrderWithRelations,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

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

// Get PO status badge colors
function getPOStatusColors(status: string) {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending_approval':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'received':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Format currency
function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format address object to string
function formatAddress(address: Record<string, string> | null): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

// Render star rating
function renderStars(rating: number | null) {
  if (!rating) return <span className="text-sm text-th-text-tertiary">-</span>;
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// Format PO status for display
function formatPOStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId, can } = useOrg();

  // Initialize services
  const [vendorService] = useState(() => createVendorService(supabase));
  const [purchaseOrderService] = useState(() => createPurchaseOrderService(supabase));

  // State
  const [vendor, setVendor] = useState<VendorWithRelations | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'purchase_orders'>('overview');
  const [editing, setEditing] = useState(false);

  // Load vendor data
  const loadVendor = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [vendorData, posData] = await Promise.all([
        vendorService.getVendor(id),
        vendorService.getVendorPurchaseOrders(id),
      ]);

      setVendor(vendorData);
      setPurchaseOrders(posData);
    } catch (error) {
      console.error('Failed to load vendor:', error);
      toast.error('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  }, [id, vendorService]);

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  const handleToggleActive = async () => {
    if (!vendor || !id) return;
    try {
      await vendorService.updateVendor(id, { is_active: !vendor.is_active });
      toast.success(`Vendor ${vendor.is_active ? 'deactivated' : 'activated'}`);
      loadVendor();
    } catch (error) {
      console.error('Failed to toggle vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Vendor not found</p>
        <Link to="/vendors" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to vendors
        </Link>
      </div>
    );
  }

  const typeColors = getVendorTypeColors(vendor.vendor_type || '');
  const addressStr = formatAddress(vendor.address as Record<string, string>);
  const totalPOValue = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vendors')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <Truck className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{vendor.name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vendor.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </span>
                {vendor.vendor_type && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                  >
                    {vendor.vendor_type.charAt(0).toUpperCase() + vendor.vendor_type.slice(1)}
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary text-sm">{vendor.code || 'No vendor code'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="vendors.write">
            <button
              onClick={handleToggleActive}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium ${
                vendor.is_active
                  ? 'border-red-300 text-red-700 hover:bg-red-50'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              <span>{vendor.is_active ? 'Deactivate' : 'Activate'}</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="vendors.write">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{purchaseOrders.length}</p>
              <p className="text-xs text-th-text-tertiary">Purchase Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(totalPOValue)}</p>
              <p className="text-xs text-th-text-tertiary">Total PO Value</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="mt-1">{renderStars(vendor.rating)}</div>
              <p className="text-xs text-th-text-tertiary">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex border-b border-th-border">
          {(['overview', 'purchase_orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {tab === 'purchase_orders' ? `Purchase Orders (${purchaseOrders.length})` : 'Overview'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vendor Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Vendor Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Vendor Name
                      </label>
                      <p className="text-sm text-th-text-primary">{vendor.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Vendor Code
                      </label>
                      <p className="text-sm text-th-text-primary">{vendor.code || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Vendor Type
                      </label>
                      {vendor.vendor_type ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                        >
                          {vendor.vendor_type.charAt(0).toUpperCase() + vendor.vendor_type.slice(1)}
                        </span>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Email
                      </label>
                      {vendor.email ? (
                        <a
                          href={`mailto:${vendor.email}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.email}
                        </a>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Phone
                      </label>
                      {vendor.phone ? (
                        <a
                          href={`tel:${vendor.phone}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Website
                      </label>
                      {vendor.website ? (
                        <a
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Payment Terms
                      </label>
                      <p className="text-sm text-th-text-primary">{vendor.payment_terms || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Tax ID
                      </label>
                      <p className="text-sm text-th-text-primary">{vendor.tax_id || '-'}</p>
                    </div>
                  </div>
                  {vendor.description && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <p className="text-sm text-th-text-secondary">{vendor.description}</p>
                    </div>
                  )}
                  {vendor.tags && vendor.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {vendor.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-th-accent-100 text-th-accent-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address & Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Contact Information</h3>
                <div className="space-y-4">
                  {vendor.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Phone</label>
                        <a
                          href={`tel:${vendor.phone}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Email</label>
                        <a
                          href={`mailto:${vendor.email}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Website</label>
                        <a
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {addressStr && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Address</label>
                        <p className="text-sm text-th-text-primary">{addressStr}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                      <p className="text-sm text-th-text-primary">{formatTimeAgo(vendor.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {activeTab === 'purchase_orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-th-text-primary">
                  Purchase Orders ({purchaseOrders.length})
                </h3>
              </div>
              {purchaseOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No purchase orders yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Purchase orders for this vendor will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-th-border">
                  {purchaseOrders.map((po) => {
                    const statusColors = getPOStatusColors(po.status || '');
                    return (
                      <div
                        key={po.id}
                        className="py-4 flex items-center justify-between hover:bg-surface-secondary px-4 -mx-4 rounded-lg cursor-pointer"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-th-text-primary">
                                {po.po_number || po.name}
                              </p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                              >
                                {formatPOStatus(po.status || 'draft')}
                              </span>
                            </div>
                            <p className="text-xs text-th-text-tertiary">
                              {po.name}{po.order_date ? ` - ${new Date(po.order_date).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-th-text-primary">
                            {formatCurrency(po.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
