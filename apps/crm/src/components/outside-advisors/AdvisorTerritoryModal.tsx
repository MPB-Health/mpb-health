import { Modal } from '../Modal';
import { MapPin, Users, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TERRITORIES = [
  { region: 'Southeast', states: 'FL, GA, SC, NC, AL', advisors: ['Maria Santos', 'Kevin Brown'], leads: 48, production: 42000, coverage: 85, color: '#3b82f6' },
  { region: 'Northeast', states: 'NY, NJ, CT, PA, MA', advisors: ['David Park'], leads: 32, production: 34000, coverage: 60, color: '#10b981' },
  { region: 'Midwest', states: 'IL, OH, MI, IN, WI', advisors: ['Rachel Green'], leads: 26, production: 26000, coverage: 45, color: '#8b5cf6' },
  { region: 'Southwest', states: 'TX, AZ, NM, OK', advisors: ['James Wilson', 'Linda Chen'], leads: 34, production: 44500, coverage: 72, color: '#f59e0b' },
  { region: 'West Coast', states: 'CA, WA, OR, NV', advisors: [], leads: 18, production: 0, coverage: 0, color: '#ef4444' },
];

export function AdvisorTerritoryModal({ open, onClose }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalLeads = TERRITORIES.reduce((s, t) => s + t.leads, 0);
  const totalProd = TERRITORIES.reduce((s, t) => s + t.production, 0);

  return (
    <Modal open={open} onClose={onClose} title="Territory Management" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <MapPin className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{TERRITORIES.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Territories</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalLeads}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Leads</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{fmt(totalProd)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Production</p>
          </div>
        </div>

        <div className="space-y-2">
          {TERRITORIES.map((t) => (
            <div key={t.region} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-6 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-th-text-primary">{t.region}</p>
                  <p className="text-[9px] text-th-text-tertiary">{t.states}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-th-text-primary">{fmt(t.production)}</p>
                  <p className="text-[8px] text-th-text-tertiary">{t.leads} leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] text-th-text-tertiary w-16">Coverage</span>
                <div className="flex-1 h-2 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${t.coverage}%`, backgroundColor: t.color }} />
                </div>
                <span className={cn('text-[9px] font-bold w-8 text-right', t.coverage >= 70 ? 'text-green-500' : t.coverage >= 40 ? 'text-amber-500' : 'text-red-500')}>{t.coverage}%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.advisors.length > 0 ? t.advisors.map((a) => <span key={a} className="text-[8px] px-1.5 py-0.5 rounded bg-th-accent-500/10 text-th-accent-500">{a}</span>) : <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">No advisor assigned</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-700 dark:text-red-300">Territory Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>West Coast</strong> has 18 unworked leads with zero advisor coverage. Recruit a CA/WA-licensed advisor or reassign from the Southwest team. <strong>Midwest</strong> at 45% coverage — needs a second advisor.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
