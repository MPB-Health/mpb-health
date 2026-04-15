import { useState } from 'react';
import { Modal } from '../Modal';
import { Package, DollarSign, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealProductMapModalProps { open: boolean; onClose: () => void; }

const MOCK_PRODUCTS = [
  { name: 'HealthShare Basic', deals: 18, totalValue: 324000, avgDealSize: 18000, winRate: 72, color: '#3b82f6' },
  { name: 'HealthShare Premium', deals: 12, totalValue: 420000, avgDealSize: 35000, winRate: 58, color: '#8b5cf6' },
  { name: 'Medicare Advantage', deals: 8, totalValue: 192000, avgDealSize: 24000, winRate: 65, color: '#10b981' },
  { name: 'Dental & Vision', deals: 14, totalValue: 168000, avgDealSize: 12000, winRate: 80, color: '#f59e0b' },
  { name: 'Group Plan', deals: 6, totalValue: 312000, avgDealSize: 52000, winRate: 50, color: '#ef4444' },
];

const MOCK_CROSS_SELL = [
  { product: 'Dental & Vision', withProduct: 'HealthShare Basic', coOccurrence: 68 },
  { product: 'HealthShare Premium', withProduct: 'Dental & Vision', coOccurrence: 42 },
  { product: 'Medicare Advantage', withProduct: 'Dental & Vision', coOccurrence: 55 },
];

export function DealProductMapModal({ open, onClose }: DealProductMapModalProps) {
  const [tab, setTab] = useState<'products' | 'cross'>('products');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const totalRevenue = MOCK_PRODUCTS.reduce((s, p) => s + p.totalValue, 0);
  const maxDeals = Math.max(...MOCK_PRODUCTS.map((p) => p.deals), 1);

  return (
    <Modal open={open} onClose={onClose} title="Product Map" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Package className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_PRODUCTS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Products</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-th-text-primary">{fmt(totalRevenue)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Pipeline</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">80%</p>
            <p className="text-[10px] text-th-text-tertiary">Best Win Rate</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'products' as const, label: 'By Product' }, { id: 'cross' as const, label: 'Cross-Sell' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="space-y-2">
            {MOCK_PRODUCTS.map((p) => (
              <div key={p.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-th-text-primary">{p.name}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', p.winRate >= 70 ? 'bg-green-500/10 text-green-500' : p.winRate >= 55 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>
                        {p.winRate}% win
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.deals / maxDeals) * 100}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                    <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{p.deals}</p><p className="text-[8px] text-th-text-tertiary">Deals</p></div>
                    <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(p.avgDealSize)}</p><p className="text-[8px] text-th-text-tertiary">Avg Size</p></div>
                    <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(p.totalValue)}</p><p className="text-[8px] text-th-text-tertiary">Total</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'cross' && (
          <div className="space-y-2">
            {MOCK_CROSS_SELL.map((cs, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-th-border/50 flex items-center gap-3">
                <Package className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-th-text-primary">{cs.product} + {cs.withProduct}</p>
                  <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-violet-500/50" style={{ width: `${cs.coOccurrence}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-violet-500 tabular-nums">{cs.coOccurrence}%</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Cross-Sell Insight</span>
              </div>
              <p className="text-xs text-th-text-secondary">68% of <strong>HealthShare Basic</strong> deals also include <strong>Dental & Vision</strong>. Bundle these as a default offering.</p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
