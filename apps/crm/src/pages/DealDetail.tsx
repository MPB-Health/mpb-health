import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  DollarSign,
  Building2,
  Calendar,
  User,
  Trophy,
  XCircle,
  Plus,
  Mail,
  Phone,
  Clock,
  Tag,
  FileText,
  Users,
  Package,
  Receipt,
  Activity,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddDealModal } from '../components/AddDealModal';
import { Modal } from '../components/Modal';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { DealWithRelations, DealStageHistory } from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

type TabType = 'overview' | 'contacts' | 'products' | 'quotes' | 'activities' | 'history';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dealService, activityService, dealStages, refreshDashboard } = useCRM();
  const { activeOrgId } = useOrg();

  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditDeal, setShowEditDeal] = useState(false);
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Related data
  const [dealContacts, setDealContacts] = useState<any[]>([]);
  const [dealProducts, setDealProducts] = useState<any[]>([]);
  const [stageHistory, setStageHistory] = useState<DealStageHistory[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const loadDeal = async () => {
    if (!id) return;

    setLoading(true);
    const dealData = await dealService.getDeal(id);
    setDeal(dealData);

    if (dealData) {
      // Load related data in parallel
      const [contacts, products, history] = await Promise.all([
        dealService.getDealContacts(id),
        dealService.getDealProducts(id),
        dealService.getDealStageHistory(id),
      ]);
      setDealContacts(contacts);
      setDealProducts(products);
      setStageHistory(history);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDeal();
  }, [id]);

  const handleStageChange = async (newStageId: string) => {
    if (!deal) return;

    const result = await dealService.updateDealStage(deal.id, newStageId);
    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.DEAL_STAGE_CHANGED || 'deal.stage_changed',
        entityType: 'deal',
        entityId: deal.id,
        before: { stage_id: deal.stage_id },
        after: { stage_id: newStageId },
      }).catch(console.error);
      toast.success('Stage updated');
      refreshDashboard();
      loadDeal();
    } else {
      toast.error('Failed to update stage');
    }
  };

  const handleMarkWon = async () => {
    if (!deal) return;

    setSaving(true);
    const result = await dealService.markDealWon(deal.id);
    setSaving(false);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.DEAL_WON || 'deal.won',
        entityType: 'deal',
        entityId: deal.id,
        after: { amount: deal.amount },
      }).catch(console.error);
      toast.success('Deal marked as Won!');
      refreshDashboard();
      setShowWonModal(false);
      loadDeal();
    } else {
      toast.error(result.error || 'Failed to mark deal as won');
    }
  };

  const handleMarkLost = async () => {
    if (!deal || !lostReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSaving(true);
    const result = await dealService.markDealLost(deal.id, lostReason);
    setSaving(false);

    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.DEAL_LOST || 'deal.lost',
        entityType: 'deal',
        entityId: deal.id,
        after: { lost_reason: lostReason },
      }).catch(console.error);
      toast.success('Deal marked as Lost');
      refreshDashboard();
      setShowLostModal(false);
      setLostReason('');
      loadDeal();
    } else {
      toast.error(result.error || 'Failed to mark deal as lost');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Deal not found</p>
        <Link to="/deals" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to deals
        </Link>
      </div>
    );
  }

  const isWon = deal.won_at !== null;
  const isLost = deal.lost_at !== null;
  const isClosed = isWon || isLost;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <Users className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes', icon: <Receipt className="w-4 h-4" /> },
    { id: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
    { id: 'history', label: 'Stage History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/deals')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{deal.name}</h1>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${deal.stage?.color || '#6B7280'}20`,
                  color: deal.stage?.color || '#6B7280',
                }}
              >
                {deal.stage?.display_name || '-'}
              </span>
              {isWon && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <Trophy className="w-4 h-4" /> Won
                </span>
              )}
              {isLost && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  <XCircle className="w-4 h-4" /> Lost
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-th-accent-600 mt-1">
              {formatCurrency(deal.amount)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isClosed && (
            <PermissionGate permission="deals.write">
              <button
                onClick={() => setShowLostModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
                <span>Lost</span>
              </button>
              <button
                onClick={() => setShowWonModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Trophy className="w-4 h-4" />
                <span>Won</span>
              </button>
            </PermissionGate>
          )}
          <PermissionGate permission="deals.write">
            <button
              onClick={() => setShowEditDeal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-th-accent-600 border-th-accent-600'
                  : 'text-th-text-tertiary border-transparent hover:text-th-text-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-6">
              <h2 className="text-lg font-semibold text-th-text-primary">Deal Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Amount</label>
                  <p className="text-th-text-primary font-medium">{formatCurrency(deal.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Probability</label>
                  <p className="text-th-text-primary font-medium">{deal.probability || deal.stage?.probability || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Expected Close</label>
                  <p className="text-th-text-primary">{formatDate(deal.expected_close_date)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Deal Type</label>
                  <p className="text-th-text-primary capitalize">
                    {deal.deal_type?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Lead Source</label>
                  <p className="text-th-text-primary">{deal.lead_source || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Created</label>
                  <p className="text-th-text-primary">{formatDate(deal.created_at)}</p>
                </div>
              </div>

              {deal.next_step && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Next Step</label>
                  <p className="text-th-text-primary">{deal.next_step}</p>
                </div>
              )}

              {deal.description && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Description</label>
                  <p className="text-th-text-secondary whitespace-pre-wrap">{deal.description}</p>
                </div>
              )}

              {deal.tags && deal.tags.length > 0 && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {deal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-surface-tertiary rounded text-sm text-th-text-secondary"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isLost && deal.lost_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-sm font-medium text-red-700 mb-1">Lost Reason</label>
                  <p className="text-red-600">{deal.lost_reason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">Contacts</h2>
                <PermissionGate permission="deals.write">
                  <button className="flex items-center gap-1 text-sm text-th-accent-600 hover:underline">
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                </PermissionGate>
              </div>

              {dealContacts.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No contacts linked</p>
              ) : (
                <div className="space-y-4">
                  {dealContacts.map((dc) => (
                    <div
                      key={dc.contact.id}
                      className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                          <span className="text-th-accent-700 font-medium">
                            {dc.contact.first_name?.[0]}
                            {dc.contact.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-th-text-primary">
                            {dc.contact.first_name} {dc.contact.last_name}
                          </p>
                          <p className="text-sm text-th-text-tertiary">{dc.role || dc.contact.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {dc.contact.email && (
                          <a
                            href={`mailto:${dc.contact.email}`}
                            className="p-2 hover:bg-surface-tertiary rounded-lg text-th-text-tertiary hover:text-th-accent-600"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {dc.contact.phone && (
                          <a
                            href={`tel:${dc.contact.phone}`}
                            className="p-2 hover:bg-surface-tertiary rounded-lg text-th-text-tertiary hover:text-th-accent-600"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {dc.is_primary && (
                          <span className="text-xs bg-th-accent-100 text-th-accent-700 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">Products</h2>
                <PermissionGate permission="deals.write">
                  <button className="flex items-center gap-1 text-sm text-th-accent-600 hover:underline">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </PermissionGate>
              </div>

              {dealProducts.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No products added</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-th-border">
                      <th className="text-left py-2 text-sm font-medium text-th-text-tertiary">
                        Product
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">
                        Qty
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">
                        Unit Price
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealProducts.map((dp) => (
                      <tr key={dp.id} className="border-b border-th-border">
                        <td className="py-3 text-th-text-primary">{dp.product?.name || '-'}</td>
                        <td className="py-3 text-right text-th-text-secondary">{dp.quantity}</td>
                        <td className="py-3 text-right text-th-text-secondary">
                          {formatCurrency(dp.unit_price)}
                        </td>
                        <td className="py-3 text-right font-medium text-th-text-primary">
                          {formatCurrency(dp.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">Quotes</h2>
                <PermissionGate permission="deals.write">
                  <button className="flex items-center gap-1 text-sm text-th-accent-600 hover:underline">
                    <Plus className="w-4 h-4" />
                    Create Quote
                  </button>
                </PermissionGate>
              </div>
              <p className="text-th-text-tertiary text-center py-8">No quotes yet</p>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Activity Timeline</h2>
              {activities.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No activities yet</p>
              ) : (
                <div className="activity-timeline">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <p className="text-sm font-medium text-th-text-primary">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-th-text-tertiary mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-th-text-tertiary mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Stage History</h2>
              {stageHistory.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No stage changes yet</p>
              ) : (
                <div className="space-y-4">
                  {stageHistory.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 bg-surface-secondary rounded-lg"
                    >
                      <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-th-accent-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {entry.from_stage && (
                            <>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${entry.from_stage.color}20`,
                                  color: entry.from_stage.color,
                                }}
                              >
                                {entry.from_stage.display_name}
                              </span>
                              <span className="text-th-text-tertiary">to</span>
                            </>
                          )}
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${entry.to_stage?.color}20`,
                              color: entry.to_stage?.color,
                            }}
                          >
                            {entry.to_stage?.display_name}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-th-text-secondary mt-1">{entry.notes}</p>
                        )}
                        <p className="text-xs text-th-text-tertiary mt-1">
                          {formatTimeAgo(entry.changed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stage selector */}
          {!isClosed && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Stage</h2>
              <select
                value={deal.stage_id}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                {dealStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.display_name} ({stage.probability}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Account</h2>
            {deal.account ? (
              <Link
                to={`/accounts/${deal.account.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-th-text-primary">{deal.account.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No account linked</p>
            )}
          </div>

          {/* Primary Contact */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Primary Contact</h2>
            {deal.contact ? (
              <Link
                to={`/contacts/${deal.contact.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-th-accent-700 font-medium">
                    {deal.contact.first_name?.[0]}
                    {deal.contact.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-th-text-primary">
                    {deal.contact.first_name} {deal.contact.last_name}
                  </p>
                  <p className="text-sm text-th-text-tertiary">{deal.contact.email}</p>
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No contact linked</p>
            )}
          </div>

          {/* Owner */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Owner</h2>
            {deal.owner_id ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-th-accent-700" />
                </div>
                <span className="text-th-text-secondary">Assigned</span>
              </div>
            ) : (
              <p className="text-th-text-tertiary">Unassigned</p>
            )}
          </div>

          {/* Key Dates */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Key Dates</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Expected Close</p>
                  <p className="text-th-text-primary">{formatDate(deal.expected_close_date)}</p>
                </div>
              </div>
              {deal.actual_close_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Actual Close</p>
                    <p className="text-th-text-primary">{formatDate(deal.actual_close_date)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatDate(deal.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDealModal
        open={showEditDeal}
        onClose={() => setShowEditDeal(false)}
        deal={deal}
        onSuccess={() => loadDeal()}
      />

      {/* Won Modal */}
      <Modal
        open={showWonModal}
        onClose={() => setShowWonModal(false)}
        title="Mark Deal as Won"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Are you sure you want to mark this deal as won?
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{deal.name}</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(deal.amount)}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowWonModal(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkWon}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm Won'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Lost Modal */}
      <Modal
        open={showLostModal}
        onClose={() => setShowLostModal(false)}
        title="Mark Deal as Lost"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Please provide a reason for losing this deal.
          </p>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Lost Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g., Competitor won, Budget constraints, No response..."
              rows={3}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowLostModal(false);
                setLostReason('');
              }}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkLost}
              disabled={saving || !lostReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm Lost'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
