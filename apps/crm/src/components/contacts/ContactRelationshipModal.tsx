import { useState } from 'react';
import { Modal } from '../Modal';
import { Users, Building2, ArrowRight, Heart, Star, Sparkles, ExternalLink } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface RelNode { id: string; name: string; role: string; type: 'contact' | 'account'; connections: { targetId: string; label: string }[]; }
interface ContactRelationshipModalProps { open: boolean; onClose: () => void; onNavigateToContact?: (id: string) => void; }

const MOCK_NETWORK: RelNode[] = [
  { id: '1', name: 'Brett Baker', role: 'Primary Contact', type: 'contact', connections: [
    { targetId: '2', label: 'Spouse' }, { targetId: '3', label: 'Referred' }, { targetId: 'a1', label: 'Works at' },
  ]},
  { id: '2', name: 'Sarah Baker', role: 'Family Member', type: 'contact', connections: [
    { targetId: '1', label: 'Spouse' }, { targetId: 'a1', label: 'Works at' },
  ]},
  { id: '3', name: 'Tom Wilson', role: 'Referral', type: 'contact', connections: [
    { targetId: '1', label: 'Referred by' }, { targetId: 'a2', label: 'Works at' },
  ]},
  { id: 'a1', name: 'Baker & Associates', role: 'Account', type: 'account', connections: [
    { targetId: '1', label: 'Key Contact' }, { targetId: '2', label: 'Contact' },
  ]},
  { id: 'a2', name: 'Wilson Health Group', role: 'Account', type: 'account', connections: [
    { targetId: '3', label: 'Key Contact' },
  ]},
];

const MOCK_REFERRALS = [
  { from: 'Brett Baker', to: 'Tom Wilson', date: '2026-02-15', status: 'converted' },
  { from: 'Brett Baker', to: 'Patricia Moore', date: '2026-03-01', status: 'active' },
  { from: 'Tom Wilson', to: 'David Brown', date: '2026-03-20', status: 'pending' },
];

export function ContactRelationshipModal({ open, onClose, onNavigateToContact }: ContactRelationshipModalProps) {
  const [tab, setTab] = useState<'network' | 'referrals'>('network');

  const contacts = MOCK_NETWORK.filter((n) => n.type === 'contact');
  const accounts = MOCK_NETWORK.filter((n) => n.type === 'account');
  const totalConnections = MOCK_NETWORK.reduce((s, n) => s + n.connections.length, 0) / 2;

  return (
    <Modal open={open} onClose={onClose} title="Contact Relationships" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{contacts.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Contacts</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Building2 className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{accounts.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Heart className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{Math.round(totalConnections)}</p>
            <p className="text-[10px] text-th-text-tertiary">Connections</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'network' as const, label: 'Network' }, { id: 'referrals' as const, label: `Referrals (${MOCK_REFERRALS.length})` }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {tab === 'network' && (
            <div className="space-y-2">
              {MOCK_NETWORK.map((node) => (
                <div key={node.id} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                      node.type === 'contact' ? 'bg-blue-500/10' : 'bg-violet-500/10')}>
                      {node.type === 'contact' ? <Users className="w-4 h-4 text-blue-500" /> : <Building2 className="w-4 h-4 text-violet-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-th-text-primary">{node.name}</span>
                        <span className="text-[10px] text-th-text-tertiary">{node.role}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.connections.map((c) => {
                          const target = MOCK_NETWORK.find((n) => n.id === c.targetId);
                          return (
                            <span key={c.targetId} className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">
                              {c.label} → {target?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {node.type === 'contact' && (
                      <button onClick={() => onNavigateToContact?.(node.id)} className="text-th-text-tertiary hover:text-th-accent-500">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'referrals' && (
            <div className="space-y-1.5">
              {MOCK_REFERRALS.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                  <Star className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-th-text-primary">{ref.from}</span>
                      <ArrowRight className="w-3 h-3 text-th-text-tertiary" />
                      <span className="text-xs font-medium text-th-text-primary">{ref.to}</span>
                    </div>
                    <span className="text-[10px] text-th-text-tertiary">{ref.date}</span>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                    ref.status === 'converted' ? 'bg-green-500/10 text-green-500' : ref.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  )}>{ref.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Relationship Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Brett Baker</strong> is a key referral source with 2 referrals. Consider a VIP referral incentive to increase this network effect.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
