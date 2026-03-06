import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  Star,
  Tag,
  Package,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createPriceBookService,
  formatTimeAgo,
  type PriceBookWithRelations,
  type PriceBookItem,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Format currency
function formatCurrency(amount: number | null | undefined, currency?: string): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PriceBookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize service
  const [priceBookService] = useState(() => createPriceBookService(supabase));

  // State
  const [priceBook, setPriceBook] = useState<PriceBookWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');

  // Load price book data
  const loadPriceBook = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await priceBookService.getPriceBook(id);
      setPriceBook(data);
    } catch (error) {
      console.error('Failed to load price book:', error);
      toast.error('Failed to load price book');
    } finally {
      setLoading(false);
    }
  }, [id, priceBookService]);

  useEffect(() => {
    loadPriceBook();
  }, [loadPriceBook]);

  const handleSetDefault = async () => {
    if (!priceBook) return;
    try {
      await priceBookService.updatePriceBook(priceBook.id, { is_default: true });
      toast.success('Price book set as default');
      loadPriceBook();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to set as default');
    }
  };

  const handleToggleActive = async () => {
    if (!priceBook) return;
    try {
      await priceBookService.updatePriceBook(priceBook.id, { is_active: !priceBook.is_active });
      toast.success(priceBook.is_active ? 'Price book deactivated' : 'Price book activated');
      loadPriceBook();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!priceBook) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Price book not found</p>
        <Link to="/price-books" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to price books
        </Link>
      </div>
    );
  }

  const items: PriceBookItem[] = priceBook.items || [];
  const activeItems = items.filter((item) => item.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/price-books')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{priceBook.name}</h1>
                {priceBook.is_default && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Star className="w-3 h-3" />
                    <span>Default</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    priceBook.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {priceBook.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-th-text-tertiary text-sm">
                {priceBook.description || 'No description'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="price_books.write">
            <button
              onClick={() => navigate(`/price-books/${priceBook.id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
          {!priceBook.is_default && (
            <PermissionGate permission="price_books.write">
              <button
                onClick={handleSetDefault}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
              >
                <Star className="w-4 h-4" />
                <span>Set as Default</span>
              </button>
            </PermissionGate>
          )}
          <PermissionGate permission="price_books.write">
            <button
              onClick={handleToggleActive}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              {priceBook.is_active ? (
                <ToggleRight className="w-4 h-4 text-green-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-th-text-tertiary" />
              )}
              <span>{priceBook.is_active ? 'Deactivate' : 'Activate'}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{items.length}</p>
              <p className="text-xs text-th-text-tertiary">Total Products</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{activeItems.length}</p>
              <p className="text-xs text-th-text-tertiary">Active Items</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {priceBook.currency || 'USD'}
              </p>
              <p className="text-xs text-th-text-tertiary">Currency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex border-b border-th-border">
          {(['overview', 'products'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {tab === 'overview' ? 'Overview' : `Products & Pricing (${items.length})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Price Book Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Name
                    </label>
                    <p className="text-sm text-th-text-primary">{priceBook.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <p className="text-sm text-th-text-primary">
                      {priceBook.description || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Currency
                    </label>
                    <p className="text-sm text-th-text-primary">
                      {priceBook.currency || '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Is Default
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priceBook.is_default
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {priceBook.is_default ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Is Active
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priceBook.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {priceBook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Dates & Metadata</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">
                        Effective From
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {priceBook.effective_from
                          ? new Date(priceBook.effective_from).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">
                        Effective To
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {priceBook.effective_to
                          ? new Date(priceBook.effective_to).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">
                        Created
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {formatTimeAgo(priceBook.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">
                        Updated
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {formatTimeAgo(priceBook.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products & Pricing Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-th-text-primary">
                  Products & Pricing ({items.length})
                </h3>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No products in this price book</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Add products to define custom pricing for this price book
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-th-border">
                        <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Product Code
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          List Price ($)
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Discount %
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Discount Amount ($)
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Min Qty
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Max Qty
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Active
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Net Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                      {items.map((item) => {
                        const listPrice = item.list_price ?? 0;
                        const discountPct = item.discount_percent ?? 0;
                        const discountAmt = item.discount_amount ?? 0;
                        const netPrice = listPrice - (listPrice * discountPct / 100) - discountAmt;

                        return (
                          <tr key={item.id} className="hover:bg-surface-secondary">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-th-text-primary">
                                {item.product?.name || '-'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-th-text-secondary">
                                {item.product?.code || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {formatCurrency(item.list_price, priceBook.currency)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {discountPct > 0 ? `${discountPct}%` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {discountAmt > 0
                                  ? formatCurrency(discountAmt, priceBook.currency)
                                  : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {item.min_quantity ?? '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {item.max_quantity ?? '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-th-text-primary">
                                {formatCurrency(netPrice, priceBook.currency)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
