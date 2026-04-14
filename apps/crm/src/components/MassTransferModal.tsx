import { useState } from 'react';
import { Modal } from './Modal';
import { UserCheck, Search, AlertTriangle } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  activeLeads: number;
}

interface MassTransferModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  selectedCount: number;
  teamMembers: TeamMember[];
  onTransfer: (newOwnerId: string, options: { notifyNewOwner: boolean; notifyOldOwner: boolean; transferNotes: boolean }) => Promise<void>;
}

export function MassTransferModal({
  open, onClose, entityType, selectedCount, teamMembers, onTransfer,
}: MassTransferModalProps) {
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [search, setSearch] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [options, setOptions] = useState({
    notifyNewOwner: true,
    notifyOldOwner: true,
    transferNotes: true,
  });

  const filtered = teamMembers.filter(
    (m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMember = teamMembers.find((m) => m.id === selectedOwner);

  const handleTransfer = async () => {
    if (!selectedOwner) return;
    setTransferring(true);
    try {
      await onTransfer(selectedOwner, options);
      onClose();
    } catch {
      // parent handles
    } finally {
      setTransferring(false);
    }
  };

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <Modal open={open} onClose={onClose} title={`Transfer ${entityLabel}s`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-th-accent-500/10 border border-th-accent-500/20">
          <UserCheck className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-accent-600 dark:text-th-accent-400">
            Reassign <span className="font-semibold">{selectedCount}</span> {entityLabel.toLowerCase()}{selectedCount !== 1 ? 's' : ''} to a new owner
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team members..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-th-border/50 bg-surface-secondary focus:border-th-accent-500/50 focus:outline-none"
          />
        </div>

        {/* Team members */}
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
          {filtered.map((member) => (
            <label
              key={member.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                selectedOwner === member.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-border'
              )}
            >
              <input
                type="radio"
                name="owner"
                checked={selectedOwner === member.id}
                onChange={() => setSelectedOwner(member.id)}
                className="text-th-accent-500 focus:ring-th-accent-500/40"
              />
              <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center shrink-0 text-xs font-semibold text-th-text-secondary">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary">{member.name}</p>
                <p className="text-xs text-th-text-tertiary">{member.role} · {member.email}</p>
              </div>
              <span className="text-xs text-th-text-tertiary tabular-nums shrink-0">
                {member.activeLeads} active
              </span>
            </label>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-th-text-secondary">Transfer Options</p>
          {[
            { key: 'notifyNewOwner' as const, label: 'Notify new owner via email' },
            { key: 'notifyOldOwner' as const, label: 'Notify current owner(s)' },
            { key: 'transferNotes' as const, label: 'Transfer notes and activities' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options[opt.key]}
                onChange={(e) => setOptions((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40"
              />
              <span className="text-sm text-th-text-secondary">{opt.label}</span>
            </label>
          ))}
        </div>

        {selectedMember && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {selectedMember.name} currently has {selectedMember.activeLeads} active leads. Transferring {selectedCount} more will bring their total to {selectedMember.activeLeads + selectedCount}.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedOwner || transferring}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            {transferring ? 'Transferring...' : 'Transfer Records'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
