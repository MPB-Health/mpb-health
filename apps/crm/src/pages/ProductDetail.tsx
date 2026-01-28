import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  Tag,
  Percent,
  BookOpen,
  Plus,
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
import type { ProductWithRelations, PriceBookItem, ProductCreateInput } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

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

// Get active status badge colors
function getStatusColors(isActive: boolean) {
  return isActive
    ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' }
    : { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' };
}

// ---------------------------------------------------------------------------
// Edit Product Modal
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

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: ProductWithRelations;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

function EditProductModal({ open, onClose, onSuccess, product }: EditProductModalProps) {
  const { productService } = useCRM();
  const { activeOrgId } = useOrg();
  const [categories, setCategories] = useState<string[]>([]);

  // Load existing categories
  useEffect(() => {
    if (open) {
      productService.getCategories().then(setCategories);
    }
  }, [open, productService]);

  const getInitialValues = (): ProductFormValues => ({
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
  });

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
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset } = useForm<ProductFormValues>({
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

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, product]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Product"
      description="Update product details"
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
            label="Update Product"
            loadingLabel="Updating..."
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
// Product Detail Page
// ---------------------------------------------------------------------------

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productService } = useCRM();
  const { activeOrgId } = useOrg();

  // State
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load product data
  const loadProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const productData = await productService.getProduct(id);
      setProduct(productData);
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id, productService]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleToggleActive = async () => {
    if (!product) return;

    const result = await productService.toggleActive(product.id);
    if (result.success) {
      toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
      loadProduct();
    } else {
      toast.error(result.error || 'Failed to toggle product status');
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    setDeleting(true);
    const result = await productService.deleteProduct(product.id);
    setDeleting(false);

    if (result.success) {
      toast.success('Product deleted');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'product.deleted',
        entityType: 'product',
        entityId: product.id,
        before: { name: product.name },
      }).catch(console.error);
      navigate('/products');
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Product not found</p>
        <Link to="/products" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColors(product.is_active);
  const margin = product.cost ? ((product.unit_price - product.cost) / product.unit_price) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{product.name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                >
                  {statusColors.label}
                </span>
                {product.is_taxable && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Taxable
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary text-sm">
                {product.code ? `${product.code}` : 'No product code'}
                {product.sku ? ` | SKU: ${product.sku}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="products.write">
            <button
              onClick={handleToggleActive}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              {product.is_active ? (
                <>
                  <ToggleRight className="w-4 h-4 text-green-600" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Inactive</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowEditProduct(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="products.delete">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {formatCurrency(product.unit_price, product.currency)}
              </p>
              <p className="text-xs text-th-text-tertiary">Unit Price</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {product.cost ? formatCurrency(product.cost, product.currency) : '-'}
              </p>
              <p className="text-xs text-th-text-tertiary">Cost</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {margin !== null ? `${margin.toFixed(1)}%` : '-'}
              </p>
              <p className="text-xs text-th-text-tertiary">Margin</p>
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
                {product.price_book_items?.length || 0}
              </p>
              <p className="text-xs text-th-text-tertiary">Price Books</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Product Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Product Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                    Product Name
                  </label>
                  <p className="text-sm text-th-text-primary">{product.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                    Product Code
                  </label>
                  <p className="text-sm text-th-text-primary">{product.code || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                    SKU
                  </label>
                  <p className="text-sm text-th-text-primary">{product.sku || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <p className="text-sm text-th-text-primary">{product.category || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                  Unit of Measure
                </label>
                <p className="text-sm text-th-text-primary">{product.unit_of_measure || '-'}</p>
              </div>
              {product.description && (
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <p className="text-sm text-th-text-secondary">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-th-text-tertiary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary">Unit Price</label>
                  <p className="text-sm font-medium text-th-text-primary">
                    {formatCurrency(product.unit_price, product.currency)}
                  </p>
                </div>
              </div>
              {product.cost && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-th-text-tertiary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary">Cost</label>
                    <p className="text-sm font-medium text-th-text-primary">
                      {formatCurrency(product.cost, product.currency)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-th-text-tertiary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary">Currency</label>
                  <p className="text-sm text-th-text-primary">{product.currency}</p>
                </div>
              </div>
              {product.is_taxable && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-th-text-tertiary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary">Tax Rate</label>
                    <p className="text-sm text-th-text-primary">
                      {product.tax_rate ? `${product.tax_rate}%` : 'Default'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-th-text-tertiary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                  <p className="text-sm text-th-text-primary">{formatTimeAgo(product.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Price Book Items */}
        <div className="lg:col-span-2">
          <div className="bg-surface-primary rounded-xl border border-th-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">
                Price Book Items ({product.price_book_items?.length || 0})
              </h2>
              {/* Add to Price Book button could go here */}
            </div>

            <div className="p-6">
              {!product.price_book_items || product.price_book_items.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No price book entries</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    This product hasn't been added to any price books yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-th-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Price Book
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          List Price
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                      {product.price_book_items.map((item: PriceBookItem) => {
                        const itemStatusColors = getStatusColors(item.is_active);
                        const hasDiscount = item.discount_percent || item.discount_amount;

                        return (
                          <tr key={item.id} className="hover:bg-surface-secondary">
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-th-accent-100 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-th-accent-700" />
                                </div>
                                <span className="text-sm font-medium text-th-text-primary">
                                  {item.price_book_id}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-th-text-primary">
                                {formatCurrency(item.list_price, product.currency)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {hasDiscount ? (
                                <div className="text-sm text-th-text-secondary">
                                  {item.discount_percent && (
                                    <span className="text-green-600">{item.discount_percent}% off</span>
                                  )}
                                  {item.discount_percent && item.discount_amount && ' + '}
                                  {item.discount_amount && (
                                    <span className="text-green-600">
                                      {formatCurrency(item.discount_amount, product.currency)} off
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-th-text-tertiary">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${itemStatusColors.bg} ${itemStatusColors.text}`}
                              >
                                {itemStatusColors.label}
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
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {product && (
        <EditProductModal
          open={showEditProduct}
          onClose={() => setShowEditProduct(false)}
          product={product}
          onSuccess={() => {
            setShowEditProduct(false);
            loadProduct();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        productName={product?.name || ''}
        loading={deleting}
      />
    </div>
  );
}
