import { useState } from 'react';
import { Modal } from '../Modal';
import { MapPin, Building2, DollarSign, Users, Sparkles, Eye, Layers } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface MapAccount { id: string; name: string; state: string; city: string; lat: number; lng: number; type: string; revenue: number; contacts: number; }
interface Territory { name: string; states: string[]; accounts: number; revenue: number; color: string; rep: string; }
interface AccountMapModalProps { open: boolean; onClose: () => void; onNavigateToAccount?: (id: string) => void; }

const MOCK_ACCOUNTS: MapAccount[] = [
  { id: '1', name: 'Acme Health Group', state: 'FL', city: 'Miami', lat: 25.76, lng: -80.19, type: 'customer', revenue: 680000, contacts: 8 },
  { id: '2', name: 'BlueCross Partners', state: 'FL', city: 'Tampa', lat: 27.95, lng: -82.46, type: 'customer', revenue: 420000, contacts: 5 },
  { id: '3', name: 'Medicare Solutions', state: 'TX', city: 'Houston', lat: 29.76, lng: -95.37, type: 'customer', revenue: 256000, contacts: 4 },
  { id: '4', name: 'Senior Care Alliance', state: 'GA', city: 'Atlanta', lat: 33.75, lng: -84.39, type: 'customer', revenue: 198000, contacts: 5 },
  { id: '5', name: 'Wellness First Corp', state: 'CA', city: 'Los Angeles', lat: 34.05, lng: -118.24, type: 'customer', revenue: 142000, contacts: 4 },
  { id: '6', name: 'National Health Plan', state: 'NY', city: 'New York', lat: 40.71, lng: -74.01, type: 'prospect', revenue: 118000, contacts: 3 },
  { id: '7', name: 'Valley Care Group', state: 'AZ', city: 'Phoenix', lat: 33.45, lng: -112.07, type: 'prospect', revenue: 82000, contacts: 2 },
  { id: '8', name: 'Horizon Health', state: 'FL', city: 'Orlando', lat: 28.54, lng: -81.38, type: 'prospect', revenue: 0, contacts: 1 },
];

const MOCK_TERRITORIES: Territory[] = [
  { name: 'Southeast', states: ['FL', 'GA', 'SC', 'NC'], accounts: 4, revenue: 1100000, color: '#3b82f6', rep: 'Julia Smith' },
  { name: 'Southwest', states: ['TX', 'AZ', 'NM'], accounts: 2, revenue: 338000, color: '#10b981', rep: 'Mark Davis' },
  { name: 'West', states: ['CA', 'OR', 'WA'], accounts: 1, revenue: 142000, color: '#8b5cf6', rep: 'Sarah Johnson' },
  { name: 'Northeast', states: ['NY', 'NJ', 'CT', 'MA'], accounts: 1, revenue: 118000, color: '#f59e0b', rep: 'Tom Wilson' },
];

function currencyFmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  FL: { x: 78, y: 80 }, GA: { x: 72, y: 65 }, TX: { x: 40, y: 75 }, CA: { x: 8, y: 48 },
  NY: { x: 80, y: 25 }, AZ: { x: 20, y: 62 }, SC: { x: 75, y: 58 }, NC: { x: 78, y: 52 },
  NM: { x: 25, y: 68 }, OR: { x: 8, y: 20 }, WA: { x: 10, y: 10 }, NJ: { x: 84, y: 30 },
  CT: { x: 86, y: 22 }, MA: { x: 88, y: 18 },
};

export function AccountMapModal({ open, onClose, onNavigateToAccount }: AccountMapModalProps) {
  const [tab, setTab] = useState<'map' | 'territories'>('map');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const byState: Record<string, MapAccount[]> = {};
  MOCK_ACCOUNTS.forEach((a) => { (byState[a.state] ??= []).push(a); });

  return (
    <Modal open={open} onClose={onClose} title="Account Map" size="2xl">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'map' as const, label: 'Geographic View' }, { id: 'territories' as const, label: 'Territories' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'map' && (
          <>
            {/* Simplified US map using positioned dots */}
            <div className="relative w-full h-[220px] rounded-xl bg-surface-secondary/50 border border-th-border/30 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100" height="100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-th-text-tertiary" rx="4" /></svg>
              </div>
              {MOCK_ACCOUNTS.map((acct) => {
                const pos = STATE_POSITIONS[acct.state];
                if (!pos) return null;
                const size = Math.max(8, Math.min(20, acct.revenue / 50000));
                const isHovered = hoveredId === acct.id;
                return (
                  <div key={acct.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onMouseEnter={() => setHoveredId(acct.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onNavigateToAccount?.(acct.id)}>
                    <div className={cn('rounded-full border-2 transition-all',
                      acct.type === 'customer' ? 'bg-green-500/60 border-green-500' : 'bg-blue-500/60 border-blue-500',
                      isHovered && 'scale-150 z-10'
                    )} style={{ width: `${size}px`, height: `${size}px` }} />
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded-lg bg-surface-primary border border-th-border shadow-xl whitespace-nowrap z-20">
                        <p className="text-[10px] font-semibold text-th-text-primary">{acct.name}</p>
                        <p className="text-[9px] text-th-text-tertiary">{acct.city}, {acct.state} • {currencyFmt(acct.revenue)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* State summary */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(byState).map(([state, accts]) => (
                <div key={state} className="p-2 rounded-lg border border-th-border/30 text-center">
                  <p className="text-xs font-bold text-th-text-primary">{state}</p>
                  <p className="text-[10px] text-th-text-tertiary">{accts.length} accounts</p>
                  <p className="text-[10px] text-green-500 font-medium">{currencyFmt(accts.reduce((s, a) => s + a.revenue, 0))}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'territories' && (
          <div className="space-y-2">
            {MOCK_TERRITORIES.map((terr) => (
              <div key={terr.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: terr.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-th-text-primary">{terr.name}</span>
                      <span className="text-[10px] text-th-text-tertiary">{terr.states.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] text-th-text-tertiary flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{terr.accounts} accounts</span>
                      <span className="text-[10px] text-green-500 font-medium flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />{currencyFmt(terr.revenue)}</span>
                      <span className="text-[10px] text-th-text-tertiary flex items-center gap-1"><Users className="w-2.5 h-2.5" />{terr.rep}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Territory Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Southeast</strong> generates 62% of total revenue with only 4 accounts. High concentration risk — consider expanding <strong>Southwest</strong> territory which has growth potential.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
