import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Package,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { InputField, SelectField, TextareaField, SubmitButton, CheckboxField } from '../components/FormField';
import { useForm } from '../hooks/useForm';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent } from '@mpbhealth/auth';
import type { Product, ProductFilters, ProductCreateInput } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Get active status badge colors
function getStatusColors(isActive: boolean) {
  return isActive
    ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' }
    : { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' };
}

// Format currency
function formatCurrency(amount: number | null, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Add/Edit Product Modal
// ---------------------------------------------------------------------------

interface ProductFormValues {
  name: string;
  code: string;
  description: string;
  category: string;
  unit_price: string;
  cost: string;
  currency: string;
  unit_of_measure: string;
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: string;
  sku: string;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product?: Product | null;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const defaultFormValues: ProductFormValues = {
  name: '',
  code: '',
  description: '',
  category: '',
  unit_price: '',
  cost: '',
  currency: 'USD',
  unit_of_measure: '',
  is_active: true,
  is_taxable: false,
  tax_rate: '',
  sku: '',
};

function AddProductModal({ open, onClose, onSuccess, product }: AddProductModalProps) {
  const { productService } = useCRM();
  const { activeOrgId } = useOrg();
  const [categories, setCategories] = useState<string[]>([]);

  const isEdit = !!product;

  // Load existing categories
  useEffect(() => {
    if (open) {
      productService.getCategories().then(setCategories);
    }
  }, [open, productService]);

  // Get initial values from product for edit mode
  const getInitialValues = (): ProductFormValues => {
    if (!product) return defaultFormValues;

    return {
      name: product.name || '',
      code: product.code || '',
      description: product.description || '',
      category: product.category || '',
      unit_price: product.unit_price?.toString() || '',
      cost: product.cost?.toString() || '',
      currency: product.currency || 'USD',
      unit_of_measure: product.unit_of_measure || '',
      is_active: product.is_active ?? true,
      is_taxable: product.is_taxable ?? false,
      tax_rate: product.tax_rate?.toString() || '',
      sku: product.sku || '',
    };
  };

  const handleSubmit = async (values: ProductFormValues) => {
    const productData: ProductCreateInput = {
      name: values.name,
      code: values.code || undefined,
      description: values.description || undefined,
      category: values.category || undefined,
      unit_price: Number(values.unit_price),
      cost: values.cost ? Number(values.cost) : undefined,
      currency: values.currency,
      unit_of_measure: values.unit_of_measure || undefined,
      is_active: values.is_active,
      is_taxable: values.is_taxable,
      tax_rate: values.tax_rate ? Number(values.tax_rate) : undefined,
      sku: values.sku || undefined,
    };

    if (isEdit && product) {
      const result = await productService.updateProduct(product.id, productData);
      if (!result.success) {
        toast.error(result.error || 'Failed to update product');
        return;
      }

      toast.success('Product updated');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'product.updated',
        entityType: 'product',
        entityId: product.id,
        before: { name: product.name },
        after: { name: values.name },
      }).catch(console.error);

      onSuccess?.();
      onClose();
    } else {
      const result = await productService.createProduct(productData);
      if (!result.success) {
        toast.error(result.error || 'Failed to create product');
        return;
      }

      toast.success('Product created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'product.created',
        entityType: 'product',
        entityId: result.productId,
        after: { name: values.name },
      }).catch(console.error);

      onSuccess?.();
      onClose();
    }
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset, setFieldValue } = useForm<ProductFormValues>({
    initialValues: getInitialValues(),
    validate: (vals) => {
      const errs: Partial<Record<keyof ProductFormValues, string>> = {};
      if (!vals.name.trim()) errs.name = 'Product name is required';
      if (!vals.unit_price || isNaN(Number(vals.unit_price))) {
        errs.unit_price = 'Valid unit price is required';
      }
      if (vals.cost && isNaN(Number(vals.cost))) {
        errs.cost = 'Must be a valid number';
      }
      if (vals.tax_rate && isNaN(Number(vals.tax_rate))) {
        errs.tax_rate = 'Must be a valid number';
      }
      return errs;
    },
    onSubmit: handleSubmit,
  });

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, product]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'New Product'}
      description={isEdit ? 'Update product details' : 'Enter product details'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={onFormSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Basic Information
          </h3>
          <InputField
            label="Product Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Premium Widget"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Product Code"
              name="code"
              value={values.code}
              onChange={handleChange}
              placeholder="PROD-001"
            />
            <InputField
              label="SKU"
              name="sku"
              value={values.sku}
              onChange={handleChange}
              placeholder="SKU-12345"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-th-text-secondary mb-1">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={values.category}
                onChange={handleChange}
                list="category-suggestions"
                placeholder="Select or type category"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
              />
              <datalist id="category-suggestions">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <InputField
              label="Unit of Measure"
              name="unit_of_measure"
              value={values.unit_of_measure}
              onChange={handleChange}
              placeholder="Each, Box, Hour, etc."
            />
          </div>
          <TextareaField
            label="Description"
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            placeholder="Enter product description..."
          />
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Pricing
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Unit Price"
              name="unit_price"
              type="number"
              value={values.unit_price}
              onChange={handleChange}
              error={errors.unit_price}
              required
              placeholder="99.99"
            />
            <InputField
              label="Cost"
              name="cost"
              type="number"
              value={values.cost}
              onChange={handleChange}
              error={errors.cost}
              placeholder="49.99"
            />
          </div>
          <SelectField
            label="Currency"
            name="currency"
            value={values.currency}
            onChange={handleChange}
            options={CURRENCY_OPTIONS}
          />
        </div>

        {/* Tax & Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Tax & Status
          </h3>
          <div className="space-y-3">
            <CheckboxField
              label="Product is Active"
              name="is_active"
              checked={values.is_active}
              onChange={handleChange}
              description="Inactive products cannot be added to quotes or invoices"
            />
            <CheckboxField
              label="Product is Taxable"
              name="is_taxable"
              checked={values.is_taxable}
              onChange={handleChange}
              description="Tax will be applied when this product is used"
            />
          </div>
          {values.is_taxable && (
            <InputField
              label="Tax Rate (%)"
              name="tax_rate"
              type="number"
              value={values.tax_rate}
              onChange={handleChange}
              error={errors.tax_rate}
              placeholder="8.25"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label={isEdit ? 'Update Product' : 'Create Product'}
            loadingLabel={isEdit ? 'Updating...' : 'Creating...'}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

interface DeleteProductModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  loading: boolean;
}

function DeleteProductModal({ open, onClose, onConfirm, productName, loading }: DeleteProductModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Product" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Are you sure you want to delete <span className="font-semibold">{productName}</span>? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Products List Page
// ---------------------------------------------------------------------------

export default function Products() {
  const navigate = useNavigate();
  const { productService } = useCRM();
  const { activeOrgId } = useOrg();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const pageSize = 20;

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products: data, total: count } = await productService.getProducts(
        filters,
        pageSize,
        page * pageSize
      );
      setProducts(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [productService, filters, page]);

  // Load categories for filter dropdown
  const loadCategories = useCallback(async () => {
    const data = await productService.getCategories();
    setCategories(data);
  }, [productService]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedProducts(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({ ...prev, category: category || undefined }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'active') {
      setFilters((prev) => ({ ...prev, is_active: true }));
    } else if (status === 'inactive') {
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
      const { products: exportProducts } = await productService.getProducts(filters, 1000, 0);
      const csv = generateProductCSV(exportProducts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export products');
    }
  };

  // Generate CSV from products
  function generateProductCSV(data: Product[]) {
    const headers = ['Name', 'Code', 'SKU', 'Category', 'Unit Price', 'Cost', 'Currency', 'Active', 'Taxable', 'Created'];
    const rows = data.map((product) => [
      product.name,
      product.code || '',
      product.sku || '',
      product.category || '',
      product.unit_price?.toString() || '',
      product.cost?.toString() || '',
      product.currency,
      product.is_active ? 'Yes' : 'No',
      product.is_taxable ? 'Yes' : 'No',
      new Date(product.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  }, [products, selectedProducts.size]);

  const toggleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const handleToggleActive = async (product: Product) => {
    const result = await productService.toggleActive(product.id);
    if (result.success) {
      toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
      loadProducts();
    } else {
      toast.error(result.error || 'Failed to toggle product status');
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    setDeleting(true);
    const result = await productService.deleteProduct(deleteProduct.id);
    setDeleting(false);

    if (result.success) {
      toast.success('Product deleted');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'product.deleted',
        entityType: 'product',
        entityId: deleteProduct.id,
        before: { name: deleteProduct.name },
      }).catch(console.error);
      setDeleteProduct(null);
      loadProducts();
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  const handleRowClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedProducts.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedProducts(new Set())}
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
          <h1 className="text-2xl font-bold text-th-text-primary">Products</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total products</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="products.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="products.write">
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
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
              placeholder="Search by name, code, SKU, or description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={filters.category || ''}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.is_active === true ? 'active' : filters.is_active === false ? 'inactive' : ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {STATUS_OPTIONS.map((opt) => (
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

      {/* Products table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new product</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Code
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="w-24 px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {products.map((product) => {
                  const statusColors = getStatusColors(product.is_active);
                  const isSelected = selectedProducts.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(product.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {product.name}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-th-text-tertiary">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {product.code || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(product.unit_price, product.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {product.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                        >
                          {statusColors.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(product.created_at)}
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center space-x-2">
                          <PermissionGate permission="products.write">
                            <button
                              onClick={() => handleToggleActive(product)}
                              className="p-1.5 hover:bg-surface-tertiary rounded-lg text-th-text-tertiary hover:text-th-text-secondary"
                              title={product.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {product.is_active ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditProduct(product)}
                              className="p-1.5 hover:bg-surface-tertiary rounded-lg text-th-text-tertiary hover:text-th-text-secondary"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="products.delete">
                            <button
                              onClick={() => setDeleteProduct(product)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-th-text-tertiary hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        </div>
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

      {/* Add Product Modal */}
      <AddProductModal
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={() => loadProducts()}
      />

      {/* Edit Product Modal */}
      <AddProductModal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        onSuccess={() => {
          setEditProduct(null);
          loadProducts();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        productName={deleteProduct?.name || ''}
        loading={deleting}
      />
    </div>
  );
}
