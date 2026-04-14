import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Handshake, Users, ArrowRight, DollarSign, TrendingUp, Award,
  ChevronDown, ChevronRight, ExternalLink, BarChart3, Filter,
  Star, Target, Share2, Copy, Check, Link, User, Calendar,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ReferralChainNode {
  id: string;
  name: string;
  type: 'partner' | 'client' | 'lead';
  avatarInitials: string;
  date: string;
  status: 'converted' | 'active' | 'lost';
  value?: number;
}

interface ReferralPartnerStats {
  id: string;
  name: string;
  type: string;
  totalReferrals: number;
  converted: number;
  conversionRate: number;
  totalRevenue: number;
  commissionOwed: number;
  commissionPaid: number;
  avgDealSize: number;
  lastReferralDate: string;
  chain: ReferralChainNode[];
}

interface ReferralAttributionModalProps {
  open: boolean;
  onClose: () => void;
  partners?: ReferralPartnerStats[];
  onShareDashboard?: (partnerId: string) => Promise<string>;
}

const MOCK_PARTNERS: ReferralPartnerStats[] = [
  {
    id: '1', name: 'Dr. Sarah Mitchell', type: 'Healthcare Provider',
    totalReferrals: 28, converted: 19, conversionRate: 67.9, totalRevenue: 45600,
    commissionOwed: 2280, commissionPaid: 1800, avgDealSize: 2400, lastReferralDate: '2026-04-10',
    chain: [
      { id: 'c1', name: 'John Anderson', type: 'client', avatarInitials: 'JA', date: '2026-04-10', status: 'converted', value: 2400 },
      { id: 'c2', name: 'Maria Garcia', type: 'lead', avatarInitials: 'MG', date: '2026-04-05', status: 'active' },
      { id: 'c3', name: 'Robert Lee', type: 'client', avatarInitials: 'RL', date: '2026-03-22', status: 'converted', value: 3200 },
      { id: 'c4', name: 'Patricia Brown', type: 'client', avatarInitials: 'PB', date: '2026-03-15', status: 'converted', value: 1800 },
      { id: 'c5', name: 'David Wilson', type: 'lead', avatarInitials: 'DW', date: '2026-03-10', status: 'lost' },
    ],
  },
  {
    id: '2', name: 'First National Bank - Orlando', type: 'Financial Institution',
    totalReferrals: 15, converted: 8, conversionRate: 53.3, totalRevenue: 24800,
    commissionOwed: 1240, commissionPaid: 800, avgDealSize: 3100, lastReferralDate: '2026-04-02',
    chain: [
      { id: 'c6', name: 'Susan Thompson', type: 'client', avatarInitials: 'ST', date: '2026-04-02', status: 'converted', value: 2800 },
      { id: 'c7', name: 'Michael Davis', type: 'lead', avatarInitials: 'MD', date: '2026-03-28', status: 'active' },
      { id: 'c8', name: 'Jennifer White', type: 'client', avatarInitials: 'JW', date: '2026-03-20', status: 'converted', value: 3500 },
    ],
  },
  {
    id: '3', name: 'Senior Living Associates', type: 'Senior Community',
    totalReferrals: 42, converted: 31, conversionRate: 73.8, totalRevenue: 68200,
    commissionOwed: 3410, commissionPaid: 3000, avgDealSize: 2200, lastReferralDate: '2026-04-12',
    chain: [
      { id: 'c9', name: 'Elizabeth Clark', type: 'client', avatarInitials: 'EC', date: '2026-04-12', status: 'converted', value: 1900 },
      { id: 'c10', name: 'James Moore', type: 'lead', avatarInitials: 'JM', date: '2026-04-08', status: 'active' },
    ],
  },
];

function currencyFmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ReferralAttributionModal({
  open, onClose, partners: propPartners, onShareDashboard,
}: ReferralAttributionModalProps) {
  const partners = propPartners && propPartners.length > 0 ? propPartners : MOCK_PARTNERS;
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'totalReferrals' | 'conversionRate' | 'totalRevenue'>('totalRevenue');

  const sorted = useMemo(() => {
    return [...partners].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [partners, sortBy]);

  const totals = useMemo(() => ({
    referrals: partners.reduce((s, p) => s + p.totalReferrals, 0),
    converted: partners.reduce((s, p) => s + p.converted, 0),
    revenue: partners.reduce((s, p) => s + p.totalRevenue, 0),
    commissionOwed: partners.reduce((s, p) => s + p.commissionOwed, 0),
    commissionPaid: partners.reduce((s, p) => s + p.commissionPaid, 0),
  }), [partners]);

  const handleShare = async (partnerId: string) => {
    const url = await onShareDashboard?.(partnerId);
    if (url) {
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedLink(partnerId);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Referral Attribution Tracker" size="2xl">
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Partners', value: partners.length, icon: Handshake, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Total Referrals', value: totals.referrals, icon: Users, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Converted', value: totals.converted, icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Revenue', value: currencyFmt(totals.revenue), icon: DollarSign, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Commission Due', value: currencyFmt(totals.commissionOwed), icon: Award, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-2.5 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-3.5 h-3.5 mb-0.5', s.color)} />
              <p className="text-sm font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-th-text-tertiary" />
          <span className="text-xs text-th-text-tertiary">Sort by:</span>
          {[
            { key: 'totalRevenue' as const, label: 'Revenue' },
            { key: 'totalReferrals' as const, label: 'Referrals' },
            { key: 'conversionRate' as const, label: 'Conversion' },
          ].map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              sortBy === s.key ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Partners list */}
        <div className="max-h-[380px] overflow-y-auto space-y-2">
          {sorted.map((partner) => {
            const expanded = expandedPartner === partner.id;
            return (
              <div key={partner.id} className={cn('rounded-xl border transition-all', expanded ? 'border-th-accent-500/30' : 'border-th-border/50')}>
                <button onClick={() => setExpandedPartner(expanded ? null : partner.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-th-text-primary">{partner.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{partner.type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-th-text-tertiary">
                      <span>{partner.totalReferrals} referrals</span>
                      <span className="text-green-500 font-medium">{partner.conversionRate.toFixed(1)}% conversion</span>
                      <span>Last: {formatDate(partner.lastReferralDate)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-th-text-primary tabular-nums">{currencyFmt(partner.totalRevenue)}</p>
                    <p className="text-[10px] text-th-text-tertiary">revenue</p>
                  </div>
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-th-border/30 space-y-3">
                    {/* Performance bar */}
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div><span className="text-th-text-tertiary">Avg Deal</span><br /><strong className="text-th-text-primary tabular-nums">{currencyFmt(partner.avgDealSize)}</strong></div>
                      <div><span className="text-th-text-tertiary">Commission Paid</span><br /><strong className="text-green-500 tabular-nums">{currencyFmt(partner.commissionPaid)}</strong></div>
                      <div><span className="text-th-text-tertiary">Commission Owed</span><br /><strong className="text-amber-500 tabular-nums">{currencyFmt(partner.commissionOwed)}</strong></div>
                      <div><span className="text-th-text-tertiary">Net Outstanding</span><br /><strong className="text-red-500 tabular-nums">{currencyFmt(partner.commissionOwed - partner.commissionPaid)}</strong></div>
                    </div>

                    {/* Referral chain */}
                    <div>
                      <p className="text-xs font-semibold text-th-text-secondary mb-2">Referral Chain</p>
                      <div className="space-y-1.5">
                        {partner.chain.map((node, idx) => (
                          <div key={node.id} className="flex items-center gap-2">
                            {idx > 0 && <div className="w-4 flex justify-center"><ArrowRight className="w-3 h-3 text-th-text-tertiary" /></div>}
                            {idx === 0 && <div className="w-4" />}
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                              node.status === 'converted' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                              node.status === 'active' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              'bg-red-500/10 text-red-600 dark:text-red-400'
                            )}>
                              {node.avatarInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-th-text-primary">{node.name}</span>
                              <span className="text-[10px] text-th-text-tertiary ml-1.5">{formatDate(node.date)}</span>
                            </div>
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                              node.status === 'converted' ? 'text-green-600 dark:text-green-400 bg-green-500/10' :
                              node.status === 'active' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' :
                              'text-red-600 dark:text-red-400 bg-red-500/10'
                            )}>
                              {node.status}
                            </span>
                            {node.value && <span className="text-xs font-medium text-th-text-primary tabular-nums">{currencyFmt(node.value)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => handleShare(partner.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-th-border text-xs font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors">
                        {copiedLink === partner.id ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
                        {copiedLink === partner.id ? 'Link Copied!' : 'Share Dashboard'}
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-th-border text-xs font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors">
                        <BarChart3 className="w-3 h-3" /> Full Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
