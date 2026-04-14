import { useState } from 'react';
import { Modal } from './Modal';
import {
  Calendar, Check, Loader2, ExternalLink, RefreshCw, AlertTriangle,
  Link, Settings, ChevronRight, Clock, Shield, Eye,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  lastSync?: string;
  email?: string;
  eventCount?: number;
}

interface CalendarSyncModalProps {
  open: boolean;
  onClose: () => void;
  providers?: CalendarProvider[];
  onConnect?: (providerId: string) => Promise<void>;
  onDisconnect?: (providerId: string) => Promise<void>;
  onSync?: (providerId: string) => Promise<void>;
}

const DEFAULT_PROVIDERS: CalendarProvider[] = [
  { id: 'google', name: 'Google Calendar', icon: '📅', color: 'from-blue-500/10 to-green-500/10', connected: false },
  { id: 'outlook', name: 'Microsoft Outlook', icon: '📧', color: 'from-blue-500/10 to-cyan-500/10', connected: false },
  { id: 'apple', name: 'Apple Calendar (iCal)', icon: '🍎', color: 'from-gray-500/10 to-red-500/10', connected: false },
];

const SYNC_OPTIONS = [
  { id: 'two_way', label: 'Two-way sync', description: 'Events sync both directions. CRM events appear in your calendar and vice versa.' },
  { id: 'crm_to_cal', label: 'CRM → Calendar only', description: 'Only push CRM events to your external calendar. External events stay separate.' },
  { id: 'cal_to_crm', label: 'Calendar → CRM only', description: 'Import external calendar events into CRM. CRM events stay local.' },
];

export function CalendarSyncModal({
  open, onClose, providers: propProviders, onConnect, onDisconnect, onSync,
}: CalendarSyncModalProps) {
  const [providers, setProviders] = useState<CalendarProvider[]>(propProviders || DEFAULT_PROVIDERS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncDirection, setSyncDirection] = useState('two_way');
  const [syncInterval, setSyncInterval] = useState('15');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    try {
      await onConnect?.(providerId);
      setProviders((prev) => prev.map((p) => p.id === providerId ? {
        ...p, connected: true, lastSync: new Date().toISOString(),
        email: providerId === 'google' ? 'user@gmail.com' : providerId === 'outlook' ? 'user@outlook.com' : 'user@icloud.com',
        eventCount: 24,
      } : p));
    } catch { /* parent */ }
    finally { setConnecting(null); }
  };

  const handleDisconnect = async (providerId: string) => {
    await onDisconnect?.(providerId);
    setProviders((prev) => prev.map((p) => p.id === providerId ? { ...p, connected: false, lastSync: undefined, email: undefined, eventCount: undefined } : p));
  };

  const connectedCount = providers.filter((p) => p.connected).length;

  return (
    <Modal open={open} onClose={onClose} title="Calendar Sync & Integration" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Connect your external calendars to keep appointments, meetings, and events in sync with CRM.
              {connectedCount > 0 && <span className="font-medium"> {connectedCount} calendar{connectedCount > 1 ? 's' : ''} connected.</span>}
            </p>
          </div>
        </div>

        {/* Provider cards */}
        <div className="space-y-2">
          {providers.map((provider) => (
            <div key={provider.id} className={cn(
              'rounded-xl border transition-all',
              provider.connected ? 'border-green-500/30 bg-green-500/5' : 'border-th-border/50'
            )}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0', provider.color)}>
                  {provider.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-th-text-primary">{provider.name}</span>
                    {provider.connected && <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Check className="w-2.5 h-2.5" />Connected</span>}
                  </div>
                  {provider.connected && provider.email && (
                    <p className="text-xs text-th-text-tertiary">{provider.email} · {provider.eventCount} events synced · Last sync: {provider.lastSync ? new Date(provider.lastSync).toLocaleTimeString() : 'Never'}</p>
                  )}
                </div>
                {provider.connected ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onSync?.(provider.id)} className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-tertiary hover:text-th-text-secondary transition-colors" title="Sync now">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedProvider(selectedProvider === provider.id ? null : provider.id)} className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-tertiary hover:text-th-text-secondary transition-colors" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDisconnect(provider.id)} className="text-xs text-red-500 hover:text-red-600 px-2 py-1">Disconnect</button>
                  </div>
                ) : (
                  <button onClick={() => handleConnect(provider.id)} disabled={connecting === provider.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-accent text-white text-xs font-medium disabled:opacity-50">
                    {connecting === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
                    {connecting === provider.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>

              {selectedProvider === provider.id && provider.connected && (
                <div className="px-4 pb-3 pt-1 border-t border-th-border/30 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-th-text-secondary mb-2">Sync Direction</p>
                    <div className="space-y-1.5">
                      {SYNC_OPTIONS.map((opt) => (
                        <label key={opt.id} className={cn(
                          'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all',
                          syncDirection === opt.id ? 'border-th-accent-500/50 bg-th-accent-500/5' : 'border-th-border/50'
                        )}>
                          <input type="radio" name="syncDir" value={opt.id} checked={syncDirection === opt.id}
                            onChange={() => setSyncDirection(opt.id)} className="mt-0.5 w-4 h-4 text-th-accent-500 focus:ring-th-accent-500/40" />
                          <div>
                            <p className="text-xs font-medium text-th-text-primary">{opt.label}</p>
                            <p className="text-[10px] text-th-text-tertiary mt-0.5">{opt.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-th-text-secondary">Sync every:</span>
                    <select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)}
                      className="text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
