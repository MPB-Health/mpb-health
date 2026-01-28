import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Edit2,
  Plus,
  Users,
  DollarSign,
  Activity,
  Mail,
  Linkedin,
  Twitter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { AddAccountModal } from '../components/AddAccountModal';
import { useOrg } from '../contexts/OrgContext';
import {
  createAccountService,
  createActivityService,
  formatTimeAgo,
  type AccountWithRelations,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Types for related data
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
  created_at: string;
}

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: {
    id: string;
    name: string;
    display_name: string;
    color: string;
  } | null;
  probability: number;
  expected_close_date: string | null;
  created_at: string;
}

interface AccountActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
}

// Get rating badge colors
function getRatingColors(rating: string | null) {
  switch (rating) {
    case 'hot':
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Hot' };
    case 'warm':
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Warm' };
    case 'cold':
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Cold' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unrated' };
  }
}

// Get account type badge colors
function getTypeColors(type: string) {
  switch (type) {
    case 'customer':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'prospect':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    case 'partner':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'vendor':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Format address object to string
function formatAddress(address: Record<string, string> | null): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

// Format currency
function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId, can } = useOrg();

  // Initialize services
  const [accountService] = useState(() => createAccountService(supabase));
  const [activityService] = useState(() => createActivityService(supabase));

  // State
  const [account, setAccount] = useState<AccountWithRelations | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'activities'>('overview');
  const [showEditAccount, setShowEditAccount] = useState(false);

  // Load account data
  const loadAccount = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [accountData, contactsData, dealsData] = await Promise.all([
        accountService.getAccount(id),
        accountService.getAccountContacts(id),
        accountService.getAccountDeals(id),
      ]);

      setAccount(accountData);
      setContacts(contactsData);
      setDeals(dealsData);

      // Load activities (from leads/generic activity service if account has activities)
      // For now, we'll show a placeholder
      setActivities([]);
    } catch (error) {
      console.error('Failed to load account:', error);
      toast.error('Failed to load account');
    } finally {
      setLoading(false);
    }
  }, [id, accountService]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Account not found</p>
        <Link to="/accounts" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to accounts
        </Link>
      </div>
    );
  }

  const typeColors = getTypeColors(account.account_type);
  const ratingColors = getRatingColors(account.rating);
  const addressStr = formatAddress(account.address);
  const totalDealsValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const openDeals = deals.filter((d) => d.stage?.name !== 'closed_won' && d.stage?.name !== 'closed_lost');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/accounts')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{account.name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                >
                  {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ratingColors.bg} ${ratingColors.text}`}
                >
                  {ratingColors.label}
                </span>
              </div>
              <p className="text-th-text-tertiary text-sm">{account.industry || 'No industry specified'}</p>
            </div>
          </div>
        </div>
        <PermissionGate permission="accounts.write">
          <button
            onClick={() => setShowEditAccount(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{contacts.length}</p>
              <p className="text-xs text-th-text-tertiary">Contacts</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{deals.length}</p>
              <p className="text-xs text-th-text-tertiary">Deals</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(totalDealsValue)}</p>
              <p className="text-xs text-th-text-tertiary">Total Deal Value</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{openDeals.length}</p>
              <p className="text-xs text-th-text-tertiary">Open Deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex border-b border-th-border">
          {(['overview', 'contacts', 'deals', 'activities'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {tab}
              {tab === 'contacts' && ` (${contacts.length})`}
              {tab === 'deals' && ` (${deals.length})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Account Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Account Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Account Name
                      </label>
                      <p className="text-sm text-th-text-primary">{account.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Account Type
                      </label>
                      <p className="text-sm text-th-text-primary capitalize">{account.account_type}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Industry
                      </label>
                      <p className="text-sm text-th-text-primary">{account.industry || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Rating
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ratingColors.bg} ${ratingColors.text}`}
                      >
                        {ratingColors.label}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Annual Revenue
                      </label>
                      <p className="text-sm text-th-text-primary">{formatCurrency(account.annual_revenue)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Employees
                      </label>
                      <p className="text-sm text-th-text-primary">{account.employee_count || '-'}</p>
                    </div>
                  </div>
                  {account.description && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <p className="text-sm text-th-text-secondary">{account.description}</p>
                    </div>
                  )}
                  {account.tags && account.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {account.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-th-accent-100 text-th-accent-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Contact Information</h3>
                <div className="space-y-4">
                  {account.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Phone</label>
                        <a
                          href={`tel:${account.phone}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {account.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.fax && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Fax</label>
                        <p className="text-sm text-th-text-primary">{account.fax}</p>
                      </div>
                    </div>
                  )}
                  {account.website && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Website</label>
                        <a
                          href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {account.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {addressStr && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Address</label>
                        <p className="text-sm text-th-text-primary">{addressStr}</p>
                      </div>
                    </div>
                  )}
                  {account.linkedin_url && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Linkedin className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">LinkedIn</label>
                        <a
                          href={account.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {account.linkedin_url}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.twitter_handle && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Twitter className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Twitter</label>
                        <a
                          href={`https://twitter.com/${account.twitter_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {account.twitter_handle}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                      <p className="text-sm text-th-text-primary">{formatTimeAgo(account.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-th-text-primary">
                  Contacts ({contacts.length})
                </h3>
                <PermissionGate permission="contacts.write">
                  <button
                    onClick={() => navigate(`/contacts/new?account_id=${account.id}`)}
                    className="flex items-center space-x-2 px-3 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                </PermissionGate>
              </div>
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No contacts yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Add contacts to this account to keep track of your relationships
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-th-border">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="py-4 flex items-center justify-between hover:bg-surface-secondary px-4 -mx-4 rounded-lg cursor-pointer"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                          <span className="text-th-accent-700 font-medium text-sm">
                            {contact.first_name.charAt(0)}
                            {contact.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-th-text-primary">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.is_primary && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-th-text-tertiary">{contact.title || contact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-surface-tertiary rounded-lg"
                          >
                            <Mail className="w-4 h-4 text-th-text-tertiary" />
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-surface-tertiary rounded-lg"
                          >
                            <Phone className="w-4 h-4 text-th-text-tertiary" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deals Tab */}
          {activeTab === 'deals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-th-text-primary">Deals ({deals.length})</h3>
                <PermissionGate permission="deals.write">
                  <button
                    onClick={() => navigate(`/deals/new?account_id=${account.id}`)}
                    className="flex items-center space-x-2 px-3 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Deal</span>
                  </button>
                </PermissionGate>
              </div>
              {deals.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No deals yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Create deals to track opportunities with this account
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-th-border">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="py-4 flex items-center justify-between hover:bg-surface-secondary px-4 -mx-4 rounded-lg cursor-pointer"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-th-text-primary">{deal.name}</p>
                          <p className="text-xs text-th-text-tertiary">
                            {deal.expected_close_date
                              ? `Expected close: ${new Date(deal.expected_close_date).toLocaleDateString()}`
                              : 'No close date set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(deal.amount)}
                        </span>
                        {deal.stage && (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${deal.stage.color}20`,
                              color: deal.stage.color,
                            }}
                          >
                            {deal.stage.display_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-th-text-primary">Activity Timeline</h3>
              </div>
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No activities yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Activities from contacts and deals will appear here
                  </p>
                </div>
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
        </div>
      </div>

      {/* Edit Account Modal */}
      <AddAccountModal
        open={showEditAccount}
        onClose={() => setShowEditAccount(false)}
        account={account}
        onSuccess={() => {
          setShowEditAccount(false);
          loadAccount();
        }}
      />
    </div>
  );
}
