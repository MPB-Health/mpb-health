import { useState } from 'react';
import { Modal } from '../Modal';
import { FileText, Star, Zap, Shield, Heart, Package, ArrowRight, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteTemplateModalProps { open: boolean; onClose: () => void; }

const TEMPLATES = [
  { id: 'individual', name: 'Individual Plan Quote', desc: 'Single member coverage package', icon: Heart, color: 'text-pink-500', bg: 'from-pink-500/10 to-rose-500/10', items: 2, avgValue: 4200, popular: true },
  { id: 'family', name: 'Family Bundle Quote', desc: 'Family coverage with add-ons', icon: Shield, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10', items: 4, avgValue: 12800, popular: true },
  { id: 'group', name: 'Small Group Package', desc: '5-50 employee group coverage', icon: Package, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10', items: 6, avgValue: 28500, popular: false },
  { id: 'enterprise', name: 'Enterprise Solution', desc: '50+ employees with custom terms', icon: Zap, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10', items: 8, avgValue: 65000, popular: false },
  { id: 'renewal', name: 'Renewal Quote', desc: 'Existing member renewal pricing', icon: Star, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10', items: 3, avgValue: 8500, popular: false },
  { id: 'custom', name: 'Custom Template', desc: 'Start from scratch', icon: FileText, color: 'text-gray-500', bg: 'from-gray-500/10 to-slate-500/10', items: 0, avgValue: 0, popular: false },
];

export function QuoteTemplateModal({ open, onClose }: QuoteTemplateModalProps) {
  const [selected, setSelected] = useState('');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Quote Templates" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-th-text-tertiary">Pick a template to create a new quote with pre-filled line items and terms.</p>

        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} className={cn('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all', selected === t.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-border')}>
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', t.bg)}>
                <t.icon className={cn('w-5 h-5', t.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-th-text-primary">{t.name}</span>
                  {t.popular && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">POPULAR</span>}
                </div>
                <p className="text-[10px] text-th-text-tertiary">{t.desc}</p>
              </div>
              <div className="text-right shrink-0">
                {t.items > 0 ? (
                  <>
                    <p className="text-[10px] text-th-text-tertiary">{t.items} items</p>
                    <p className="text-xs font-bold text-th-text-primary tabular-nums">~{fmt(t.avgValue)}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-th-text-tertiary">Blank</p>
                )}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-th-text-tertiary shrink-0" />
            </button>
          ))}
        </div>

        {selected && selected !== 'custom' && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Template Preview</span></div>
            <p className="text-xs text-th-text-secondary">This template includes pre-configured line items, standard terms & conditions, and recommended pricing. All fields are editable after creation.</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button disabled={!selected} className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-th-accent-600 transition-colors flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4" /> Create from Template
          </button>
        </div>
      </div>
    </Modal>
  );
}
