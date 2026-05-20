import { useState } from 'react';
import { Modal } from './Modal';
import {
  Globe, Copy, Check, Mail, Send, Eye, Shield, FileText, Calendar,
  MessageSquare, Upload, Settings, Link, QrCode, ExternalLink,
  Smartphone, Loader2, CheckCircle2,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface PortalPermission {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

interface ClientPortalModalProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
  clientId: string;
  existingPortalUrl?: string;
  onGeneratePortal?: (permissions: string[]) => Promise<{ url: string; token: string }>;
  onSendInvite?: (email: string, url: string) => Promise<void>;
}

const DEFAULT_PERMISSIONS: PortalPermission[] = [
  { id: 'view_policies', label: 'View Policies', description: 'See active policies, coverage details, and ID cards', icon: Shield, enabled: true },
  { id: 'view_documents', label: 'View Documents', description: 'Access shared documents and plan comparisons', icon: FileText, enabled: true },
  { id: 'upload_documents', label: 'Upload Documents', description: 'Submit documents like ID, income verification, etc.', icon: Upload, enabled: true },
  { id: 'schedule_appointments', label: 'Schedule Appointments', description: 'Book meetings directly on agent calendar', icon: Calendar, enabled: true },
  { id: 'send_messages', label: 'Secure Messaging', description: 'Send and receive messages with their agent', icon: MessageSquare, enabled: true },
  { id: 'view_claims', label: 'View Claims Status', description: 'Track claim submissions and status', icon: Eye, enabled: false },
  { id: 'request_changes', label: 'Request Changes', description: 'Submit coverage change requests', icon: Settings, enabled: false },
];

export function ClientPortalModal({
  open, onClose, clientName, clientEmail, clientId,
  existingPortalUrl, onGeneratePortal, onSendInvite,
}: ClientPortalModalProps) {
  const [permissions, setPermissions] = useState<PortalPermission[]>(DEFAULT_PERMISSIONS);
  const [portalUrl, setPortalUrl] = useState(existingPortalUrl || '');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    `Hi ${clientName},\n\nI've set up a secure client portal for you where you can view your policies, upload documents, and schedule appointments with me.\n\nClick the link below to access your portal.`
  );
  const [tab, setTab] = useState<'setup' | 'preview' | 'invite'>(!existingPortalUrl ? 'setup' : 'invite');

  const togglePermission = (id: string) => {
    setPermissions((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const enabledPermissions = permissions.filter((p) => p.enabled);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await onGeneratePortal?.(enabledPermissions.map((p) => p.id));
      if (result) {
        setPortalUrl(result.url);
      } else {
        setPortalUrl(`https://portal.mpb.health/client/${clientId}?token=${Date.now().toString(36)}`);
      }
      setTab('invite');
    } catch { /* parent handles */ }
    finally { setGenerating(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    setSending(true);
    try {
      await onSendInvite?.(clientEmail, portalUrl);
      setSent(true);
    } catch { /* parent handles */ }
    finally { setSending(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Client Portal — ${clientName}`} size="xl">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          {[
            { id: 'setup' as const, label: 'Portal Setup', icon: Settings },
            { id: 'preview' as const, label: 'Preview', icon: Eye },
            { id: 'invite' as const, label: 'Send Invite', icon: Send },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[340px]">
          {/* Setup tab */}
          {tab === 'setup' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Create a branded self-service portal for <strong>{clientName}</strong>. Choose what they can access below.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-th-text-secondary">Portal Permissions</p>
                {permissions.map((perm) => {
                  const Icon = perm.icon;
                  return (
                    <label key={perm.id} className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      perm.enabled ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        perm.enabled ? 'bg-th-accent-500/10' : 'bg-surface-tertiary'
                      )}>
                        <Icon className={cn('w-4 h-4', perm.enabled ? 'text-th-accent-500' : 'text-th-text-tertiary')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-th-text-primary">{perm.label}</span>
                        <p className="text-xs text-th-text-tertiary">{perm.description}</p>
                      </div>
                      <div className={cn(
                        'w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer',
                        perm.enabled ? 'bg-th-accent-500' : 'bg-surface-tertiary'
                      )} onClick={(e) => { e.preventDefault(); togglePermission(perm.id); }}>
                        <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                          perm.enabled ? 'translate-x-4' : 'translate-x-0'
                        )} />
                      </div>
                    </label>
                  );
                })}
              </div>

              <button onClick={handleGenerate} disabled={generating || enabledPermissions.length === 0}
                className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {generating ? 'Generating Portal...' : `Generate Portal (${enabledPermissions.length} features)`}
              </button>
            </div>
          )}

          {/* Preview tab */}
          {tab === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-th-border overflow-hidden">
                {/* Mock portal header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">ARYX Client Portal</p>
                    <p className="text-[10px] text-white/70">Welcome, {clientName}</p>
                  </div>
                </div>
                {/* Mock portal body */}
                <div className="p-4 bg-surface-secondary/30">
                  <div className="grid grid-cols-3 gap-2">
                    {enabledPermissions.map((perm) => {
                      const Icon = perm.icon;
                      return (
                        <div key={perm.id} className="p-3 rounded-xl bg-surface-primary border border-th-border/50 text-center">
                          <Icon className="w-5 h-5 text-th-accent-500 mx-auto mb-1.5" />
                          <p className="text-xs font-medium text-th-text-primary">{perm.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  {enabledPermissions.length === 0 && (
                    <p className="text-sm text-th-text-tertiary text-center py-8">Enable permissions in Setup to see the portal preview</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Portal is mobile-responsive and works on all devices</span>
              </div>
            </div>
          )}

          {/* Invite tab */}
          {tab === 'invite' && (
            <div className="space-y-4">
              {portalUrl ? (
                <>
                  {/* Portal URL */}
                  <div className="p-3 rounded-xl bg-surface-secondary border border-th-border/50">
                    <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1.5">Portal Link</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-primary border border-th-border/50">
                        <Link className="w-3.5 h-3.5 text-th-text-tertiary shrink-0" />
                        <span className="text-xs text-th-text-primary truncate font-mono">{portalUrl}</span>
                      </div>
                      <button onClick={handleCopy} className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
                        copied ? 'bg-green-500/10 text-green-500' : 'bg-surface-tertiary text-th-text-secondary hover:text-th-text-primary'
                      )}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Email invite */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-th-text-secondary">Email Invitation</p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-th-border/50">
                      <Mail className="w-3.5 h-3.5 text-th-text-tertiary" />
                      <span className="text-xs text-th-text-primary">{clientEmail}</span>
                    </div>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                      className="w-full text-xs rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  {sent ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Portal invite sent to {clientEmail}!</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSendInvite} disabled={sending}
                        className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? 'Sending...' : 'Send Portal Invite'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-th-text-secondary">Generate a portal first in the Setup tab</p>
                  <button onClick={() => setTab('setup')} className="mt-2 text-sm text-th-accent-500 hover:text-th-accent-600">
                    Go to Setup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
