// ============================================================================
// Domain Add-ons - SPF/DKIM/DMARC verification wizard
// Custom sender domain management with DNS verification
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Plus, Shield, ShieldCheck, ShieldAlert, ShieldX,
  RefreshCw, Trash2, Copy, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronDown, ChevronRight, Mail,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type { MailDomain, DomainHealthResult, RequiredDnsRecords } from '@mpbhealth/crm-core';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  verified: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Verified' },
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Failed' },
  expired: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Expired' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function DomainAddons() {
  const { domainService } = useCRM();
  const { activeOrgId } = useOrg();

  const [domains, setDomains] = useState<MailDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ domain: MailDomain; required_records: RequiredDnsRecords } | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<Record<string, DomainHealthResult>>({});
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const data = await domainService.getDomains(activeOrgId);
      setDomains(data);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  }, [domainService, activeOrgId]);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  const handleAddDomain = async () => {
    if (!activeOrgId || !newDomain.trim()) return;
    setAdding(true);
    try {
      const result = await domainService.addDomain(activeOrgId, newDomain.trim().toLowerCase());
      setAddResult(result);
      toast.success('Domain added - configure DNS records below');
      await loadDomains();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId);
    try {
      const result = await domainService.verifyDomain(domainId);
      toast.success('Verification complete');
      await loadDomains();
    } catch {
      toast.error('Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const handleCheckHealth = async (domainId: string) => {
    try {
      const health = await domainService.getDomainHealth(domainId);
      setHealthData(prev => ({ ...prev, [domainId]: health }));
    } catch {
      toast.error('Health check failed');
    }
  };

  const handleDelete = async (domain: MailDomain) => {
    if (!confirm(`Remove domain "${domain.domain}"? This cannot be undone.`)) return;
    try {
      await domainService.deleteDomain(domain.id);
      toast.success('Domain removed');
      await loadDomains();
    } catch {
      toast.error('Failed to remove domain');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Domain Add-ons</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Verify your sender domains for optimal email deliverability
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddResult(null); setNewDomain(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {/* Domains List */}
      {domains.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Globe className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-2">No domains configured</h3>
          <p className="text-sm text-th-text-secondary mb-6 max-w-sm mx-auto">
            Add your sender domains and verify SPF, DKIM, and DMARC records to improve deliverability
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
          >
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map(domain => {
            const isExpanded = expandedDomain === domain.id;
            const health = healthData[domain.id];

            return (
              <div key={domain.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {/* Domain Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                  onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        domain.is_verified ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        {domain.is_verified ? (
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-th-text-primary">{domain.domain}</span>
                          {domain.is_verified ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-th-text-tertiary">SPF:</span>
                            <StatusBadge status={domain.spf_status} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-th-text-tertiary">DKIM:</span>
                            <StatusBadge status={domain.dkim_status} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-th-text-tertiary">DMARC:</span>
                            <StatusBadge status={domain.dmarc_status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleVerify(domain.id); }}
                        disabled={verifying === domain.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-th-accent-600 hover:bg-th-accent-50 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${verifying === domain.id ? 'animate-spin' : ''}`} />
                        Verify
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleCheckHealth(domain.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-th-text-tertiary hover:bg-neutral-50 rounded-lg"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Health
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(domain); }}
                        className="p-1.5 text-th-text-tertiary hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 p-5 bg-neutral-50/50 space-y-4">
                    {/* Health Score */}
                    {health && (
                      <div className="bg-white rounded-lg border border-neutral-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-th-text-primary">Domain Health</h4>
                          <div className={`text-2xl font-bold ${
                            health.health_score >= 80 ? 'text-green-600' :
                            health.health_score >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {health.health_score}/100
                          </div>
                        </div>
                        {health.issues.length > 0 && (
                          <div className="space-y-1">
                            {health.issues.map((issue, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DNS Records */}
                    <div>
                      <h4 className="font-medium text-th-text-primary mb-3">Required DNS Records</h4>
                      <div className="space-y-3">
                        {/* SPF */}
                        <DnsRecordRow
                          label="SPF"
                          type="TXT"
                          host={domain.domain}
                          value={domain.spf_record || 'v=spf1 include:_spf.google.com ~all'}
                          status={domain.spf_status}
                          onCopy={copyToClipboard}
                        />
                        {/* DKIM */}
                        <DnsRecordRow
                          label="DKIM"
                          type="TXT"
                          host={`${domain.dkim_selector || 'mpbcrm'}._domainkey.${domain.domain}`}
                          value={domain.dkim_record || 'v=DKIM1; k=rsa; p=<your-public-key>'}
                          status={domain.dkim_status}
                          onCopy={copyToClipboard}
                        />
                        {/* DMARC */}
                        <DnsRecordRow
                          label="DMARC"
                          type="TXT"
                          host={`_dmarc.${domain.domain}`}
                          value={domain.dmarc_record || `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain.domain}`}
                          status={domain.dmarc_status}
                          onCopy={copyToClipboard}
                        />
                        {/* Verification */}
                        <DnsRecordRow
                          label="Verify"
                          type="TXT"
                          host={domain.domain}
                          value={`mpb-verify=${domain.verification_token}`}
                          status={domain.spf_status === 'verified' ? 'verified' : 'pending'}
                          onCopy={copyToClipboard}
                        />
                      </div>
                    </div>

                    {/* Compliance Footer */}
                    <div>
                      <h4 className="font-medium text-th-text-primary mb-2">Compliance Footer</h4>
                      <p className="text-xs text-th-text-tertiary mb-2">
                        Auto-injected at the bottom of every email sent from this domain
                      </p>
                      <textarea
                        defaultValue={domain.compliance_footer || ''}
                        onBlur={e => {
                          domainService.updateComplianceFooter(domain.id, e.target.value);
                          toast.success('Footer saved');
                        }}
                        placeholder="e.g., This message may contain PHI. If you received this in error..."
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                      />
                    </div>

                    {/* Last check */}
                    {domain.last_check_at && (
                      <p className="text-xs text-th-text-tertiary">
                        Last checked: {new Date(domain.last_check_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            {!addResult ? (
              <>
                <h2 className="text-lg font-semibold text-th-text-primary mb-1">Add Sender Domain</h2>
                <p className="text-sm text-th-text-secondary mb-4">
                  Enter the domain you want to send emails from
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="e.g., mpb.health"
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                  />
                  <button
                    onClick={handleAddDomain}
                    disabled={adding || !newDomain.trim()}
                    className="px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 text-sm"
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-th-text-primary mb-1">Configure DNS Records</h2>
                <p className="text-sm text-th-text-secondary mb-4">
                  Add these DNS records to your domain registrar, then click Verify
                </p>
                <div className="space-y-3 mb-4">
                  {Object.entries(addResult.required_records).map(([key, record]) => (
                    <div key={key} className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-th-text-primary uppercase">{key}</span>
                        <span className="text-xs text-th-text-tertiary">{record.type}</span>
                      </div>
                      <div className="text-xs text-th-text-secondary mb-1">
                        Host: <code className="bg-neutral-200 px-1 rounded">{record.host}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-neutral-200 px-2 py-1 rounded flex-1 break-all">
                          {record.value}
                        </code>
                        <button
                          onClick={() => copyToClipboard(record.value)}
                          className="p-1 text-th-text-tertiary hover:text-th-accent-600"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-th-text-tertiary mt-1">{record.description}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setShowAddModal(false); setExpandedDomain(addResult.domain.id); }}
                  className="w-full px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 text-sm"
                >
                  Done - I&apos;ll verify after DNS propagates
                </button>
              </>
            )}

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-2 px-4 py-2 text-sm text-th-text-secondary hover:text-th-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DNS Record Row Component
// ============================================================================

function DnsRecordRow({
  label, type, host, value, status, onCopy,
}: {
  label: string;
  type: string;
  host: string;
  value: string;
  status: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-th-text-primary">{label}</span>
          <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{type}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="text-xs text-th-text-tertiary mb-1">
        Host: <code className="bg-neutral-100 px-1 rounded">{host}</code>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-neutral-100 px-2 py-1 rounded flex-1 break-all text-th-text-secondary">
          {value}
        </code>
        <button
          onClick={() => onCopy(value)}
          className="p-1 text-th-text-tertiary hover:text-th-accent-600 flex-shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
