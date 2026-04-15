import { useState } from 'react';
import { Modal } from '../Modal';
import { Package, Plus, Trash2, DollarSign, Sparkles, FileText } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductBundleModalProps { open: boolean; onClose: () => void; }

type BundleItem = { id: string; plan: string; memberType: string; rate: number };

const PLAN_OPTIONS = [
  { id: 'essentials', name: 'Essentials', rates: { member: 142, family: 395 } },
  { id: 'mec', name: 'MEC+ Essentials', rates: { member: 198, family: 510 } },
  { id: 'care_plus', name: 'Care Plus', rates: { member: 284, family: 720 } },
  { id: 'direct', name: 'Direct', rates: { member: 348, family: 860 } },
  { id: 'secure_hsa', name: 'Secure HSA', rates: { member: 412, family: 1020 } },
  { id: 'dental', name: 'Dental Add-on', rates: { member: 35, family: 95 } },
  { id: 'vision', name: 'Vision Add-on', rates: { member: 18, family: 45 } },
];

let nextId = 0;

export function ProductBundleModal({ open, onClose }: ProductBundleModalProps) {
  const [items, setItems] = useState<BundleItem[]>([]);
  const [bundleName, setBundleName] = useState('');

  const addItem = () => {
    const defaultPlan = PLAN_OPTIONS[0];
    setItems((prev) => [...prev, { id: String(++nextId), plan: defaultPlan.id, memberType: 'member', rate: defaultPlan.rates.member }]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, planId: string, mt: string) => {
    const p = PLAN_OPTIONS.find((o) => o.id === planId);
    if (!p) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, plan: planId, memberType: mt, rate: (p.rates as Record<string, number>)[mt] ?? p.rates.member } : i));
  };

  const total = items.reduce((s, i) => s + i.rate, 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Bundle Builder" size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1">Bundle Name</label>
          <input type="text" value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="e.g. Family Complete Package" className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none" />
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-6 text-th-text-tertiary">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Add plans to your bundle</p>
            </div>
          ) : items.map((item) => {
            const plan = PLAN_OPTIONS.find((p) => p.id === item.plan);
            return (
              <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-th-border/50">
                <select value={item.plan} onChange={(e) => updateItem(item.id, e.target.value, item.memberType)} className="flex-1 text-xs rounded-lg border border-th-border/30 bg-surface-primary px-2 py-1.5 focus:outline-none">
                  {PLAN_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={item.memberType} onChange={(e) => updateItem(item.id, item.plan, e.target.value)} className="text-xs rounded-lg border border-th-border/30 bg-surface-primary px-2 py-1.5 focus:outline-none">
                  <option value="member">Member</option>
                  <option value="family">Family</option>
                </select>
                <span className="text-xs font-bold text-th-accent-500 tabular-nums w-16 text-right">{fmt(item.rate)}</span>
                <button onClick={() => removeItem(item.id)} className="p-1 text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>

        <button onClick={addItem} className="w-full py-2 rounded-xl border-2 border-dashed border-th-border text-xs font-medium text-th-text-tertiary hover:border-th-accent-500 hover:text-th-accent-500 flex items-center justify-center gap-1 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>

        {items.length > 0 && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-th-accent-500/10 to-violet-500/10 border border-th-accent-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-th-text-secondary">Bundle Total</span>
              <div className="text-right">
                <p className="text-xl font-extrabold text-th-text-primary tabular-nums">{fmt(total)}<span className="text-xs font-medium text-th-text-tertiary">/mo</span></p>
                <p className="text-[9px] text-th-text-tertiary">{fmt(total * 12)}/yr for {items.length} plan{items.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {items.length >= 2 && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Multi-plan discount eligible</span></div>
            <p className="text-[10px] text-th-text-secondary mt-0.5">This bundle qualifies for a 5% multi-plan discount. Apply during proposal.</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
          <button disabled={items.length === 0} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 hover:bg-th-accent-600 transition-colors">
            <FileText className="w-4 h-4" /> Generate Proposal
          </button>
        </div>
      </div>
    </Modal>
  );
}
