import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  X,
  FileText,
  Type,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateSection {
  id: string;
  type: 'header' | 'line_items' | 'totals' | 'terms' | 'signature' | 'footer' | 'custom';
  label: string;
  visible: boolean;
  config: Record<string, unknown>;
}

interface TemplateBranding {
  primaryColor: string;
  accentColor: string;
  headerBackground: string;
  fontFamily: string;
}

interface QuoteTemplate {
  id?: string;
  org_id: string;
  name: string;
  description: string;
  is_default: boolean;
  sections: TemplateSection[];
  branding: TemplateBranding;
  created_by: string;
  updated_at?: string;
}

type SectionType = TemplateSection['type'];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: 'header', type: 'header', label: 'Header', visible: true, config: { companyName: '', logoUrl: '' } },
  {
    id: 'line_items',
    type: 'line_items',
    label: 'Line Items',
    visible: true,
    config: {
      columns: {
        product: true,
        description: true,
        quantity: true,
        unitPrice: true,
        discount: true,
        tax: true,
        total: true,
      },
    },
  },
  { id: 'totals', type: 'totals', label: 'Totals', visible: true, config: {} },
  { id: 'terms', type: 'terms', label: 'Terms & Conditions', visible: true, config: { text: '' } },
  { id: 'signature', type: 'signature', label: 'Signature Block', visible: true, config: { label: 'Authorized Signature' } },
  { id: 'footer', type: 'footer', label: 'Footer', visible: true, config: { text: '' } },
];

const DEFAULT_BRANDING: TemplateBranding = {
  primaryColor: '#1e40af',
  accentColor: '#2563eb',
  headerBackground: '#f8fafc',
  fontFamily: 'Inter',
};

const FONT_OPTIONS = [
  'Inter',
  'Helvetica',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Roboto',
  'Open Sans',
];

const SAMPLE_LINE_ITEMS = [
  { product: 'Health Insurance Plan A', description: 'Comprehensive coverage', qty: 1, price: 450.0, discount: 0, tax: 36.0, total: 486.0 },
  { product: 'Dental Add-on', description: 'Full dental coverage', qty: 2, price: 75.0, discount: 10.0, tax: 10.5, total: 150.5 },
  { product: 'Vision Package', description: 'Annual eye care', qty: 1, price: 35.0, discount: 0, tax: 2.8, total: 37.8 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm text-th-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-th-border cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-xs px-2 py-1 border border-th-border rounded bg-surface-primary text-th-text-primary font-mono"
        />
      </div>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-th-accent-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section property editors
// ---------------------------------------------------------------------------

function HeaderProperties({
  section,
  branding,
  onUpdate,
  onBrandingChange,
}: {
  section: TemplateSection;
  branding: TemplateBranding;
  onUpdate: (c: Record<string, unknown>) => void;
  onBrandingChange: (b: Partial<TemplateBranding>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ ...section.config, logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Header Properties</h3>

      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Company Logo</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" aria-label="Upload company logo" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full px-3 py-2 text-sm border border-dashed border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary"
        >
          {section.config.logoUrl ? 'Change Logo' : 'Upload Logo'}
        </button>
        {!!section.config.logoUrl && (
          <div className="mt-2 flex items-center gap-2">
            <img src={section.config.logoUrl as string} alt="Logo" className="h-8 object-contain" />
            <button onClick={() => onUpdate({ ...section.config, logoUrl: '' })} className="text-red-500 hover:text-red-700" aria-label="Remove logo">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Company Name</label>
        <input
          type="text"
          value={(section.config.companyName as string) || ''}
          onChange={(e) => onUpdate({ ...section.config, companyName: e.target.value })}
          placeholder="Your Company"
          className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary"
        />
      </div>

      <ColorInput label="Primary Color" value={branding.primaryColor} onChange={(v) => onBrandingChange({ primaryColor: v })} />
      <ColorInput label="Accent Color" value={branding.accentColor} onChange={(v) => onBrandingChange({ accentColor: v })} />
      <ColorInput label="Header Background" value={branding.headerBackground} onChange={(v) => onBrandingChange({ headerBackground: v })} />

      <div>
        <label htmlFor="header-font-family" className="block text-xs font-medium text-th-text-secondary mb-1">Font Family</label>
        <select
          id="header-font-family"
          value={branding.fontFamily}
          onChange={(e) => onBrandingChange({ fontFamily: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function LineItemsProperties({
  section,
  onUpdate,
}: {
  section: TemplateSection;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const columns = (section.config.columns || {}) as Record<string, boolean>;
  const toggle = (col: string) => onUpdate({ ...section.config, columns: { ...columns, [col]: !columns[col] } });

  const COLS: [string, string][] = [
    ['product', 'Product'],
    ['description', 'Description'],
    ['quantity', 'Quantity'],
    ['unitPrice', 'Unit Price'],
    ['discount', 'Discount'],
    ['tax', 'Tax'],
    ['total', 'Total'],
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Line Items Columns</h3>
      {COLS.map(([key, label]) => (
        <label key={key} className="flex items-center justify-between">
          <span className="text-sm text-th-text-secondary">{label}</span>
          <Toggle checked={columns[key] !== false} onChange={() => toggle(key)} />
        </label>
      ))}
    </div>
  );
}

function TermsProperties({
  section,
  onUpdate,
}: {
  section: TemplateSection;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Terms & Conditions</h3>
      <textarea
        value={(section.config.text as string) || ''}
        onChange={(e) => onUpdate({ ...section.config, text: e.target.value })}
        rows={8}
        placeholder="Enter your terms and conditions..."
        className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary resize-y"
      />
    </div>
  );
}

function SignatureProperties({
  section,
  onUpdate,
}: {
  section: TemplateSection;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Signature Block</h3>
      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Signature Line Label</label>
        <input
          type="text"
          value={(section.config.label as string) || ''}
          onChange={(e) => onUpdate({ ...section.config, label: e.target.value })}
          placeholder="Authorized Signature"
          className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary"
        />
      </div>
    </div>
  );
}

function FooterProperties({
  section,
  onUpdate,
}: {
  section: TemplateSection;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Footer</h3>
      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Footer Text</label>
        <textarea
          value={(section.config.text as string) || ''}
          onChange={(e) => onUpdate({ ...section.config, text: e.target.value })}
          rows={3}
          placeholder="Thank you for your business!"
          className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary resize-y"
        />
      </div>
    </div>
  );
}

function CustomSectionProperties({
  section,
  onUpdate,
}: {
  section: TemplateSection;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary">Custom Section</h3>
      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Title</label>
        <input
          type="text"
          value={(section.config.title as string) || ''}
          onChange={(e) => onUpdate({ ...section.config, title: e.target.value })}
          placeholder="Section title"
          className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-th-text-secondary mb-1">Content</label>
        <textarea
          value={(section.config.content as string) || ''}
          onChange={(e) => onUpdate({ ...section.config, content: e.target.value })}
          rows={6}
          placeholder="Enter section content..."
          className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary resize-y"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview components
// ---------------------------------------------------------------------------

function PreviewHeader({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  return (
    <div style={{ backgroundColor: branding.headerBackground, fontFamily: branding.fontFamily }} className="p-6 rounded-t-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {section.config.logoUrl ? (
            <img src={section.config.logoUrl as string} alt="Logo" className="h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: branding.accentColor }}>
              <FileText className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: branding.primaryColor }}>
              {(section.config.companyName as string) || 'Your Company Name'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">123 Business Ave, Suite 100 · City, ST 12345</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold" style={{ color: branding.primaryColor }}>QUOTE</h2>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <p>Quote #: <span className="font-medium text-gray-700">QT-2026-0042</span></p>
            <p>Date: <span className="font-medium text-gray-700">Apr 15, 2026</span></p>
            <p>Valid Until: <span className="font-medium text-gray-700">May 15, 2026</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t" style={{ borderColor: `${branding.primaryColor}20` }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: branding.accentColor }}>Bill To</p>
          <p className="text-sm font-medium text-gray-800 mt-1">Acme Health Corp</p>
          <p className="text-xs text-gray-500">456 Client St · New York, NY 10001</p>
          <p className="text-xs text-gray-500">contact@acmehealth.com</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: branding.accentColor }}>Ship To</p>
          <p className="text-sm font-medium text-gray-800 mt-1">Acme Health Corp</p>
          <p className="text-xs text-gray-500">456 Client St · New York, NY 10001</p>
        </div>
      </div>
    </div>
  );
}

function PreviewLineItems({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  const cols = (section.config.columns || {}) as Record<string, boolean>;

  return (
    <div className="px-6 py-4" style={{ fontFamily: branding.fontFamily }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: branding.primaryColor }} className="text-white">
            {cols.product !== false && <th className="py-2 px-3 text-left font-medium rounded-tl-md">Product</th>}
            {cols.description !== false && <th className="py-2 px-3 text-left font-medium">Description</th>}
            {cols.quantity !== false && <th className="py-2 px-3 text-right font-medium">Qty</th>}
            {cols.unitPrice !== false && <th className="py-2 px-3 text-right font-medium">Unit Price</th>}
            {cols.discount !== false && <th className="py-2 px-3 text-right font-medium">Discount</th>}
            {cols.tax !== false && <th className="py-2 px-3 text-right font-medium">Tax</th>}
            {cols.total !== false && <th className="py-2 px-3 text-right font-medium rounded-tr-md">Total</th>}
          </tr>
        </thead>
        <tbody>
          {SAMPLE_LINE_ITEMS.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {cols.product !== false && <td className="py-2 px-3 font-medium text-gray-800">{item.product}</td>}
              {cols.description !== false && <td className="py-2 px-3 text-gray-500">{item.description}</td>}
              {cols.quantity !== false && <td className="py-2 px-3 text-right text-gray-700">{item.qty}</td>}
              {cols.unitPrice !== false && <td className="py-2 px-3 text-right text-gray-700">${item.price.toFixed(2)}</td>}
              {cols.discount !== false && <td className="py-2 px-3 text-right text-gray-700">${item.discount.toFixed(2)}</td>}
              {cols.tax !== false && <td className="py-2 px-3 text-right text-gray-700">${item.tax.toFixed(2)}</td>}
              {cols.total !== false && <td className="py-2 px-3 text-right font-medium text-gray-800">${item.total.toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTotals({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  return (
    <div className="px-6 py-3 flex justify-end" style={{ fontFamily: branding.fontFamily }}>
      <div className="w-64 space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>$674.30</span></div>
        <div className="flex justify-between text-gray-600"><span>Discount</span><span>-$10.00</span></div>
        <div className="flex justify-between text-gray-600"><span>Tax</span><span>$49.30</span></div>
        <div className="flex justify-between text-gray-600"><span>Shipping</span><span>$0.00</span></div>
        <div className="border-t pt-1.5 flex justify-between font-bold text-sm" style={{ color: branding.primaryColor, borderColor: `${branding.primaryColor}30` }}>
          <span>Total</span><span>$713.60</span>
        </div>
      </div>
    </div>
  );
}

function PreviewTerms({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  const text = (section.config.text as string) || 'Payment is due within 30 days of the quote date. All prices are in USD. This quote is valid for 30 days from the date of issue.';
  return (
    <div className="px-6 py-4" style={{ fontFamily: branding.fontFamily }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: branding.accentColor }}>Terms & Conditions</h3>
      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function PreviewSignature({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  return (
    <div className="px-6 py-6" style={{ fontFamily: branding.fontFamily }}>
      <div className="grid grid-cols-2 gap-12">
        <div>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <p className="text-xs text-gray-500">{(section.config.label as string) || 'Authorized Signature'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Date: _______________</p>
        </div>
        <div>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <p className="text-xs text-gray-500">Client Signature</p>
          <p className="text-xs text-gray-400 mt-0.5">Date: _______________</p>
        </div>
      </div>
    </div>
  );
}

function PreviewFooter({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  const text = (section.config.text as string) || 'Thank you for your business!';
  return (
    <div className="px-6 py-3 text-center border-t" style={{ fontFamily: branding.fontFamily, borderColor: `${branding.primaryColor}15` }}>
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

function PreviewCustom({ section, branding }: { section: TemplateSection; branding: TemplateBranding }) {
  if (!section.visible) return null;
  return (
    <div className="px-6 py-4" style={{ fontFamily: branding.fontFamily }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: branding.accentColor }}>
        {(section.config.title as string) || 'Custom Section'}
      </h3>
      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
        {(section.config.content as string) || 'Custom section content will appear here.'}
      </p>
    </div>
  );
}

const PREVIEW_MAP: Record<SectionType, React.FC<{ section: TemplateSection; branding: TemplateBranding }>> = {
  header: PreviewHeader,
  line_items: PreviewLineItems,
  totals: PreviewTotals,
  terms: PreviewTerms,
  signature: PreviewSignature,
  footer: PreviewFooter,
  custom: PreviewCustom,
};

// ---------------------------------------------------------------------------
// Full-page preview modal
// ---------------------------------------------------------------------------

function PreviewModal({
  open,
  onClose,
  sections,
  branding,
}: {
  open: boolean;
  onClose: () => void;
  sections: TemplateSection[];
  branding: TemplateBranding;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Template Preview</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Close preview">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" style={{ fontFamily: branding.fontFamily }}>
            {sections.map((s) => {
              const Comp = PREVIEW_MAP[s.type];
              return Comp ? <Comp key={s.id} section={s} branding={branding} /> : null;
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QuoteTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const isEditing = Boolean(id);

  // Template state
  const [name, setName] = useState('Untitled Template');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [sections, setSections] = useState<TemplateSection[]>(DEFAULT_SECTIONS);
  const [branding, setBranding] = useState<TemplateBranding>(DEFAULT_BRANDING);

  // UI state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>('header');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing template
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('crm_quote_templates')
          .select('id, name, description, is_default, sections, branding')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setName(data.name || 'Untitled Template');
          setDescription(data.description || '');
          setIsDefault(data.is_default ?? false);
          setSections(data.sections || DEFAULT_SECTIONS);
          setBranding(data.branding || DEFAULT_BRANDING);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
        toast.error('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!activeOrgId || !user) {
      toast.error('Unable to save — missing org or user context');
      return;
    }
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);

    const payload: QuoteTemplate = {
      ...(id ? { id } : {}),
      org_id: activeOrgId,
      name: name.trim(),
      description: description.trim(),
      is_default: isDefault,
      sections,
      branding,
      created_by: user.id,
    };

    try {
      const { data, error } = await supabase
        .from('crm_quote_templates')
        .upsert(payload)
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Template saved');

      if (!id && data?.id) {
        navigate(`/quotes/templates/${data.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to save template:', err);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [id, activeOrgId, user, name, description, isDefault, sections, branding, navigate]);

  const updateSectionConfig = useCallback(
    (sectionId: string, config: Record<string, unknown>) => {
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, config } : s)));
    },
    [],
  );

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, visible: !s.visible } : s)));
  }, []);

  const addCustomSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: sectionId(),
      type: 'custom',
      label: 'Custom Section',
      visible: true,
      config: { title: '', content: '' },
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  }, []);

  const removeSection = useCallback(
    (sid: string) => {
      setSections((prev) => prev.filter((s) => s.id !== sid));
      if (selectedSectionId === sid) setSelectedSectionId(null);
    },
    [selectedSectionId],
  );

  const handleBrandingChange = useCallback((partial: Partial<TemplateBranding>) => {
    setBranding((prev) => ({ ...prev, ...partial }));
  }, []);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-surface-primary shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotes/legacy')}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
            aria-label="Back to quotes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-th-accent-600" />
            <span className="text-lg font-semibold text-th-text-primary truncate max-w-xs">{name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* 3-panel editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---- Left sidebar ---- */}
        <div className="w-[250px] border-r border-th-border bg-surface-primary overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description..."
                className="w-full px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary resize-none"
              />
            </div>

            <label className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Set as default</span>
              <Toggle checked={isDefault} onChange={setIsDefault} label="Set as default template" />
            </label>

            <div className="pt-2 border-t border-th-border">
              <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">Sections</p>

              <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-1">
                {sections.map((section) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none group text-sm ${
                      selectedSectionId === section.id
                        ? 'bg-th-accent-600/10 text-th-accent-600 border border-th-accent-600/30'
                        : 'hover:bg-surface-secondary text-th-text-secondary border border-transparent'
                    }`}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-th-text-tertiary shrink-0 cursor-grab" />
                    <span className="flex-1 truncate">{section.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section.id); }}
                      className="p-0.5 rounded hover:bg-surface-secondary"
                      title={section.visible ? 'Hide section' : 'Show section'}
                    >
                      {section.visible ? (
                        <Eye className="w-3.5 h-3.5 text-th-text-tertiary" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-th-text-tertiary opacity-50" />
                      )}
                    </button>
                    {section.type === 'custom' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className="p-0.5 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove section"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              <button
                onClick={addCustomSection}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary hover:border-th-accent-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Section
              </button>
            </div>
          </div>
        </div>

        {/* ---- Center panel — live preview ---- */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary">
          <div className="max-w-[700px] mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ fontFamily: branding.fontFamily }}>
              {sections.map((section) => {
                const Comp = PREVIEW_MAP[section.type];
                if (!Comp) return null;

                const isSelected = selectedSectionId === section.id;

                return (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`relative cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : 'hover:ring-1 hover:ring-blue-300 hover:ring-inset'
                    } ${!section.visible ? 'opacity-30' : ''}`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-blue-500">
                        {section.label}
                      </div>
                    )}
                    <Comp section={section} branding={branding} />
                    {!section.visible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Right sidebar — properties ---- */}
        <div className="w-[280px] border-l border-th-border bg-surface-primary overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 flex-1">
            <AnimatePresence mode="wait">
              {selectedSection ? (
                <motion.div
                  key={selectedSection.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {selectedSection.type === 'header' && (
                    <HeaderProperties
                      section={selectedSection}
                      branding={branding}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                      onBrandingChange={handleBrandingChange}
                    />
                  )}
                  {selectedSection.type === 'line_items' && (
                    <LineItemsProperties
                      section={selectedSection}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                    />
                  )}
                  {selectedSection.type === 'totals' && (
                    <div className="text-sm text-th-text-tertiary">
                      <h3 className="text-sm font-semibold text-th-text-primary mb-2">Totals Section</h3>
                      <p>The totals section is auto-calculated from line items. No additional configuration needed.</p>
                    </div>
                  )}
                  {selectedSection.type === 'terms' && (
                    <TermsProperties
                      section={selectedSection}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                    />
                  )}
                  {selectedSection.type === 'signature' && (
                    <SignatureProperties
                      section={selectedSection}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                    />
                  )}
                  {selectedSection.type === 'footer' && (
                    <FooterProperties
                      section={selectedSection}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                    />
                  )}
                  {selectedSection.type === 'custom' && (
                    <CustomSectionProperties
                      section={selectedSection}
                      onUpdate={(c) => updateSectionConfig(selectedSection.id, c)}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-th-text-tertiary text-center"
                >
                  <Type className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">Select a section to edit its properties</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Branding panel — always visible */}
          <div className="border-t border-th-border p-4 space-y-3 bg-surface-secondary/50">
            <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <ChevronDown className="w-3 h-3" />
              Branding
            </p>
            <ColorInput label="Primary" value={branding.primaryColor} onChange={(v) => handleBrandingChange({ primaryColor: v })} />
            <ColorInput label="Accent" value={branding.accentColor} onChange={(v) => handleBrandingChange({ accentColor: v })} />
            <ColorInput label="Header Bg" value={branding.headerBackground} onChange={(v) => handleBrandingChange({ headerBackground: v })} />
            <div>
              <label htmlFor="branding-font-family" className="block text-xs text-th-text-secondary mb-1">Font Family</label>
              <select
                id="branding-font-family"
                value={branding.fontFamily}
                onChange={(e) => handleBrandingChange({ fontFamily: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-th-border rounded bg-surface-primary text-th-text-primary"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Full-page preview modal */}
      <AnimatePresence>
        <PreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          sections={sections}
          branding={branding}
        />
      </AnimatePresence>
    </div>
  );
}
