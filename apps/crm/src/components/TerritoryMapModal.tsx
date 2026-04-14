import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  MapPin, Users, DollarSign, Filter, ChevronDown, ChevronRight,
  RefreshCw, Shield, AlertTriangle, TrendingUp, BarChart3, Target,
  Eye, Download, Layers, Circle,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type PolicyStatusFilter = 'all' | 'active' | 'renewal_due' | 'lapsed' | 'prospect';

interface TerritoryClient {
  id: string;
  name: string;
  zipCode: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  policyStatus: 'active' | 'renewal_due' | 'lapsed' | 'prospect';
  planType: string;
  monthlyPremium: number;
  lastContact?: string;
}

interface ZipCodeCluster {
  zipCode: string;
  city: string;
  state: string;
  clientCount: number;
  revenue: number;
  active: number;
  renewalDue: number;
  lapsed: number;
  prospects: number;
  lat: number;
  lng: number;
}

interface TerritoryMapModalProps {
  open: boolean;
  onClose: () => void;
  clients?: TerritoryClient[];
  agentName?: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'text-green-500', bg: 'bg-green-500', label: 'Active' },
  renewal_due: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Renewal Due' },
  lapsed: { color: 'text-red-500', bg: 'bg-red-500', label: 'Lapsed' },
  prospect: { color: 'text-blue-500', bg: 'bg-blue-500', label: 'Prospect' },
};

const MOCK_CLIENTS: TerritoryClient[] = [
  { id: '1', name: 'James Wilson', zipCode: '32801', city: 'Orlando', state: 'FL', lat: 28.538, lng: -81.379, policyStatus: 'active', planType: 'Medicare Advantage', monthlyPremium: 0, lastContact: '2026-04-10' },
  { id: '2', name: 'Mary Johnson', zipCode: '32801', city: 'Orlando', state: 'FL', lat: 28.542, lng: -81.375, policyStatus: 'renewal_due', planType: 'Medicare Supplement', monthlyPremium: 145, lastContact: '2026-03-15' },
  { id: '3', name: 'Robert Chen', zipCode: '32803', city: 'Orlando', state: 'FL', lat: 28.550, lng: -81.363, policyStatus: 'active', planType: 'ACA', monthlyPremium: 320, lastContact: '2026-04-01' },
  { id: '4', name: 'Dorothy Harris', zipCode: '32806', city: 'Orlando', state: 'FL', lat: 28.522, lng: -81.370, policyStatus: 'lapsed', planType: 'Medicare Advantage', monthlyPremium: 15, lastContact: '2026-01-10' },
  { id: '5', name: 'Susan Thompson', zipCode: '32789', city: 'Winter Park', state: 'FL', lat: 28.600, lng: -81.339, policyStatus: 'active', planType: 'Medicare Advantage', monthlyPremium: 29, lastContact: '2026-04-05' },
  { id: '6', name: 'Michael Davis', zipCode: '32789', city: 'Winter Park', state: 'FL', lat: 28.595, lng: -81.345, policyStatus: 'prospect', planType: '', monthlyPremium: 0 },
  { id: '7', name: 'Jennifer White', zipCode: '32819', city: 'Orlando', state: 'FL', lat: 28.473, lng: -81.429, policyStatus: 'active', planType: 'Life', monthlyPremium: 85, lastContact: '2026-03-20' },
  { id: '8', name: 'David Brown', zipCode: '32825', city: 'Orlando', state: 'FL', lat: 28.530, lng: -81.291, policyStatus: 'renewal_due', planType: 'Medicare Advantage', monthlyPremium: 0, lastContact: '2026-02-28' },
  { id: '9', name: 'Linda Garcia', zipCode: '32825', city: 'Orlando', state: 'FL', lat: 28.535, lng: -81.285, policyStatus: 'active', planType: 'Dental/Vision', monthlyPremium: 35, lastContact: '2026-04-12' },
  { id: '10', name: 'Patricia Moore', zipCode: '34786', city: 'Windermere', state: 'FL', lat: 28.494, lng: -81.535, policyStatus: 'prospect', planType: '', monthlyPremium: 0 },
  { id: '11', name: 'Charles Lee', zipCode: '32836', city: 'Orlando', state: 'FL', lat: 28.428, lng: -81.498, policyStatus: 'active', planType: 'Medicare Advantage', monthlyPremium: 0, lastContact: '2026-04-08' },
  { id: '12', name: 'Elizabeth Clark', zipCode: '32839', city: 'Orlando', state: 'FL', lat: 28.472, lng: -81.430, policyStatus: 'active', planType: 'Group Health', monthlyPremium: 450, lastContact: '2026-04-02' },
];

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function TerritoryMapModal({
  open, onClose, clients: propClients, agentName = 'My',
}: TerritoryMapModalProps) {
  const clients = propClients && propClients.length > 0 ? propClients : MOCK_CLIENTS;
  const [filter, setFilter] = useState<PolicyStatusFilter>('all');
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const filtered = useMemo(() => {
    if (filter === 'all') return clients;
    return clients.filter((c) => c.policyStatus === filter);
  }, [clients, filter]);

  const clusters = useMemo(() => {
    const map = new Map<string, ZipCodeCluster>();
    filtered.forEach((c) => {
      const existing = map.get(c.zipCode);
      if (existing) {
        existing.clientCount++;
        existing.revenue += c.monthlyPremium;
        if (c.policyStatus === 'active') existing.active++;
        else if (c.policyStatus === 'renewal_due') existing.renewalDue++;
        else if (c.policyStatus === 'lapsed') existing.lapsed++;
        else existing.prospects++;
      } else {
        map.set(c.zipCode, {
          zipCode: c.zipCode, city: c.city, state: c.state,
          clientCount: 1, revenue: c.monthlyPremium,
          active: c.policyStatus === 'active' ? 1 : 0,
          renewalDue: c.policyStatus === 'renewal_due' ? 1 : 0,
          lapsed: c.policyStatus === 'lapsed' ? 1 : 0,
          prospects: c.policyStatus === 'prospect' ? 1 : 0,
          lat: c.lat, lng: c.lng,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.clientCount - a.clientCount);
  }, [filtered]);

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((c) => c.policyStatus === 'active').length,
    renewalDue: filtered.filter((c) => c.policyStatus === 'renewal_due').length,
    lapsed: filtered.filter((c) => c.policyStatus === 'lapsed').length,
    prospects: filtered.filter((c) => c.policyStatus === 'prospect').length,
    monthlyRevenue: filtered.reduce((s, c) => s + c.monthlyPremium, 0),
    zipCodes: clusters.length,
  }), [filtered, clusters]);

  const selectedZipClients = selectedZip ? filtered.filter((c) => c.zipCode === selectedZip) : [];

  return (
    <Modal open={open} onClose={onClose} title={`${agentName} Territory — Book of Business`} size="2xl">
      <div className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Clients', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Zip Codes', value: stats.zipCodes, icon: MapPin, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Monthly Revenue', value: currencyFmt(stats.monthlyRevenue), icon: DollarSign, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'At Risk', value: stats.renewalDue + stats.lapsed, icon: AlertTriangle, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-2.5 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-3.5 h-3.5 mb-0.5', s.color)} />
              <p className="text-sm font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + view toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'active', 'renewal_due', 'lapsed', 'prospect'] as PolicyStatusFilter[]).map((f) => {
            const cfg = f === 'all' ? null : STATUS_COLORS[f];
            return (
              <button key={f} onClick={() => { setFilter(f); setSelectedZip(null); }} className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary border border-transparent'
              )}>
                {cfg && <span className={cn('w-2 h-2 rounded-full', cfg.bg)} />}
                {f === 'all' ? 'All' : cfg?.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5">
            <button onClick={() => setViewMode('map')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              viewMode === 'map' ? 'bg-surface-primary shadow-sm text-th-text-primary' : 'text-th-text-tertiary'
            )}>
              <MapPin className="w-3 h-3 inline mr-1" />Map
            </button>
            <button onClick={() => setViewMode('list')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              viewMode === 'list' ? 'bg-surface-primary shadow-sm text-th-text-primary' : 'text-th-text-tertiary'
            )}>
              <Layers className="w-3 h-3 inline mr-1" />List
            </button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {viewMode === 'map' ? (
            <div className="space-y-3">
              {/* Visual territory representation */}
              <div className="relative rounded-xl border border-th-border/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 p-4 min-h-[200px] overflow-hidden">
                {/* Grid overlay for map feel */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative flex flex-wrap gap-3 justify-center">
                  {clusters.map((cluster) => {
                    const maxClients = Math.max(...clusters.map((c) => c.clientCount));
                    const size = Math.max(48, (cluster.clientCount / maxClients) * 100);
                    const isSelected = selectedZip === cluster.zipCode;
                    return (
                      <button
                        key={cluster.zipCode}
                        onClick={() => setSelectedZip(isSelected ? null : cluster.zipCode)}
                        className={cn(
                          'rounded-2xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105',
                          isSelected ? 'border-th-accent-500 bg-th-accent-500/10 shadow-lg' : 'border-th-border/50 bg-surface-primary/80 hover:border-th-accent-500/30'
                        )}
                        style={{ width: size, height: size, minWidth: 64, minHeight: 64 }}
                      >
                        <span className="text-sm font-bold text-th-text-primary tabular-nums">{cluster.clientCount}</span>
                        <span className="text-[9px] font-medium text-th-text-tertiary">{cluster.zipCode}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          {cluster.active > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {cluster.renewalDue > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {cluster.lapsed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {cluster.prospects > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected zip detail */}
              {selectedZip && (
                <div className="rounded-xl border border-th-accent-500/30 bg-th-accent-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-th-accent-500" />
                    <span className="text-sm font-semibold text-th-text-primary">{selectedZip} — {selectedZipClients[0]?.city}, {selectedZipClients[0]?.state}</span>
                    <span className="text-xs text-th-text-tertiary ml-auto">{selectedZipClients.length} clients</span>
                  </div>
                  <div className="space-y-1">
                    {selectedZipClients.map((client) => {
                      const sCfg = STATUS_COLORS[client.policyStatus];
                      return (
                        <div key={client.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-secondary/50">
                          <span className={cn('w-2 h-2 rounded-full shrink-0', sCfg.bg)} />
                          <span className="text-xs font-medium text-th-text-primary flex-1">{client.name}</span>
                          <span className="text-[10px] text-th-text-tertiary">{client.planType || 'No plan'}</span>
                          {client.monthlyPremium > 0 && <span className="text-[10px] font-medium text-th-text-secondary tabular-nums">${client.monthlyPremium}/mo</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-th-text-tertiary">
                {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={cn('w-2 h-2 rounded-full', cfg.bg)} /> {cfg.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {clusters.map((cluster) => {
                const expanded = selectedZip === cluster.zipCode;
                const clusterClients = filtered.filter((c) => c.zipCode === cluster.zipCode);
                return (
                  <div key={cluster.zipCode} className={cn('rounded-xl border transition-all', expanded ? 'border-th-accent-500/30' : 'border-th-border/50')}>
                    <button onClick={() => setSelectedZip(expanded ? null : cluster.zipCode)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/30 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-th-accent-500/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-th-accent-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-th-text-primary">{cluster.zipCode} — {cluster.city}, {cluster.state}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cluster.active > 0 && <span className="text-[10px] text-green-500">{cluster.active} active</span>}
                          {cluster.renewalDue > 0 && <span className="text-[10px] text-amber-500">{cluster.renewalDue} renewal</span>}
                          {cluster.lapsed > 0 && <span className="text-[10px] text-red-500">{cluster.lapsed} lapsed</span>}
                          {cluster.prospects > 0 && <span className="text-[10px] text-blue-500">{cluster.prospects} prospects</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-th-text-primary tabular-nums">{cluster.clientCount}</p>
                        <p className="text-[10px] text-th-text-tertiary">{currencyFmt(cluster.revenue)}/mo</p>
                      </div>
                      {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-th-border/30 space-y-1">
                        {clusterClients.map((client) => {
                          const sCfg = STATUS_COLORS[client.policyStatus];
                          return (
                            <div key={client.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-secondary/50">
                              <span className={cn('w-2 h-2 rounded-full shrink-0', sCfg.bg)} />
                              <span className="text-xs font-medium text-th-text-primary flex-1">{client.name}</span>
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', sCfg.color, `${sCfg.bg}/10`)}>{sCfg.label}</span>
                              <span className="text-[10px] text-th-text-tertiary">{client.planType || '—'}</span>
                              {client.monthlyPremium > 0 && <span className="text-[10px] font-medium text-th-text-secondary tabular-nums">${client.monthlyPremium}/mo</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">Close</button>
        </div>
      </div>
    </Modal>
  );
}
