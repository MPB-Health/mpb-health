import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Calendar,
  Edit2,
  Building2,
  Briefcase,
  DollarSign,
  Tag,
  User,
  Globe,
  Twitter,
  PhoneOff,
  MailX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { AddContactModal } from '../components/AddContactModal';
import { supabase } from '../lib/supabase';
import { useCRM } from '../contexts/CRMContext';
import {
  createContactService,
  formatTimeAgo,
  type ContactWithRelations,
} from '@mpbhealth/crm-core';

const contactService = createContactService(supabase);

interface ContactDeal {
  id: string;
  name: string;
  amount: number | null;
  stage?: {
    id: string;
    name: string;
    display_name: string;
    color: string;
  } | null;
  contact_role?: string;
  is_primary?: boolean;
  expected_close_date: string | null;
  created_at: string;
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activityService } = useCRM();

  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [deals, setDeals] = useState<ContactDeal[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'activities'>('overview');
  const [showEditContact, setShowEditContact] = useState(false);

  const loadContact = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [contactData, dealsData] = await Promise.all([
        contactService.getContact(id),
        contactService.getContactDeals(id),
      ]);

      setContact(contactData);
      setDeals(dealsData || []);

      // Load activities if available (uses lead_id, might need adjustment)
      if (contactData?.converted_from_lead_id) {
        const activityData = await activityService.getActivities(contactData.converted_from_lead_id);
        setActivities(activityData);
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
      toast.error('Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [id, activityService]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const formatAddress = (address: Record<string, string> | null | undefined): string => {
    if (!address || Object.keys(address).length === 0) return '-';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country,
    ].filter(Boolean);
    return parts.join(', ') || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Contact not found</p>
        <Link to="/contacts" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/contacts')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-full flex items-center justify-center">
              <span className="text-th-accent-700 font-semibold text-lg">
                {contact.first_name.charAt(0)}
                {contact.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">
                {contact.salutation ? `${contact.salutation} ` : ''}
                {contact.first_name} {contact.last_name}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                {contact.title && (
                  <span className="text-th-text-secondary text-sm">{contact.title}</span>
                )}
                {contact.account && (
                  <Link
                    to={`/accounts/${contact.account.id}`}
                    className="flex items-center text-th-accent-600 text-sm hover:underline"
                  >
                    <Building2 className="w-4 h-4 mr-1" />
                    {contact.account.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <PermissionGate permission="contacts.write">
          <button
            onClick={() => setShowEditContact(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </PermissionGate>
      </div>

      {/* Communication Preferences Badges */}
      {(contact.do_not_call || contact.do_not_email) && (
        <div className="flex items-center space-x-2">
          {contact.do_not_call && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <PhoneOff className="w-3 h-3 mr-1" />
              Do Not Call
            </span>
          )}
          {contact.do_not_email && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <MailX className="w-3 h-3 mr-1" />
              Do Not Email
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Contact info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact info card */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Contact Info</h2>
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-th-text-tertiary mr-3" />
                  <a href={`mailto:${contact.email}`} className="text-th-accent-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-th-text-tertiary mr-3" />
                  <a href={`tel:${contact.phone}`} className="text-th-accent-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.mobile && (
                <div className="flex items-center text-sm">
                  <Smartphone className="w-4 h-4 text-th-text-tertiary mr-3" />
                  <a href={`tel:${contact.mobile}`} className="text-th-accent-600 hover:underline">
                    {contact.mobile}
                  </a>
                </div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center text-sm">
                  <Globe className="w-4 h-4 text-th-text-tertiary mr-3" />
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-th-accent-600 hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {contact.twitter_handle && (
                <div className="flex items-center text-sm">
                  <Twitter className="w-4 h-4 text-th-text-tertiary mr-3" />
                  <a
                    href={`https://twitter.com/${contact.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-th-accent-600 hover:underline"
                  >
                    @{contact.twitter_handle}
                  </a>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-th-text-tertiary mr-3" />
                <span className="text-th-text-secondary">
                  Created {formatTimeAgo(contact.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-th-accent-100 text-th-accent-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lead Source */}
          {contact.lead_source && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Lead Source</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {contact.lead_source}
              </span>
              {contact.converted_at && (
                <p className="text-xs text-th-text-tertiary mt-2">
                  Converted on {new Date(contact.converted_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column - Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-surface-primary rounded-xl border border-th-border">
            {/* Tabs */}
            <div className="flex border-b border-th-border">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('deals')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  activeTab === 'deals'
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                Deals ({deals.length})
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  activeTab === 'activities'
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                Activities ({activities.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Work Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                      Work Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Title</label>
                        <p className="text-sm text-th-text-primary flex items-center">
                          <Briefcase className="w-4 h-4 mr-2 text-th-text-tertiary" />
                          {contact.title || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Department</label>
                        <p className="text-sm text-th-text-primary">{contact.department || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Reports To</label>
                        <p className="text-sm text-th-text-primary">
                          {contact.reports_to_contact
                            ? `${contact.reports_to_contact.first_name} ${contact.reports_to_contact.last_name}`
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Account</label>
                        {contact.account ? (
                          <Link
                            to={`/accounts/${contact.account.id}`}
                            className="text-sm text-th-accent-600 hover:underline flex items-center"
                          >
                            <Building2 className="w-4 h-4 mr-2" />
                            {contact.account.name}
                          </Link>
                        ) : (
                          <p className="text-sm text-th-text-primary">-</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                      Addresses
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Mailing Address</label>
                        <p className="text-sm text-th-text-primary flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-th-text-tertiary mt-0.5" />
                          {formatAddress(contact.mailing_address)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Other Address</label>
                        <p className="text-sm text-th-text-primary flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-th-text-tertiary mt-0.5" />
                          {formatAddress(contact.other_address)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {contact.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                        Description
                      </h3>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                        {contact.description}
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Owner</label>
                        <p className="text-sm text-th-text-primary flex items-center">
                          <User className="w-4 h-4 mr-2 text-th-text-tertiary" />
                          {contact.owner?.full_name || contact.owner?.email || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-th-text-tertiary mb-1">Date of Birth</label>
                        <p className="text-sm text-th-text-primary">
                          {contact.date_of_birth
                            ? new Date(contact.date_of_birth).toLocaleDateString()
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'deals' && (
                <div className="space-y-3">
                  {deals.length === 0 ? (
                    <div className="text-center py-8 text-th-text-tertiary">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No deals associated with this contact</p>
                    </div>
                  ) : (
                    deals.map((deal) => (
                      <Link
                        key={deal.id}
                        to={`/deals/${deal.id}`}
                        className="block p-4 rounded-lg border border-th-border hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-th-text-primary">{deal.name}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              {deal.stage && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${deal.stage.color}20`,
                                    color: deal.stage.color,
                                  }}
                                >
                                  {deal.stage.display_name}
                                </span>
                              )}
                              {deal.contact_role && (
                                <span className="text-xs text-th-text-tertiary">
                                  Role: {deal.contact_role}
                                </span>
                              )}
                              {deal.is_primary && (
                                <span className="text-xs font-medium text-th-accent-600">
                                  Primary Contact
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {deal.amount !== null && (
                              <p className="text-sm font-semibold text-th-text-primary">
                                ${deal.amount.toLocaleString()}
                              </p>
                            )}
                            {deal.expected_close_date && (
                              <p className="text-xs text-th-text-tertiary">
                                Close: {new Date(deal.expected_close_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-th-text-tertiary">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activities recorded for this contact</p>
                    </div>
                  ) : (
                    <div className="activity-timeline">
                      {activities.map((activity) => (
                        <div key={activity.id} className="activity-item pb-4 border-l-2 border-th-border pl-4 ml-2">
                          <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-th-accent-600" />
                          <p className="text-sm font-medium text-th-text-primary">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-th-text-tertiary mt-1">
                              {activity.description}
                            </p>
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
        </div>
      </div>

      {/* Edit Modal */}
      <AddContactModal
        open={showEditContact}
        onClose={() => setShowEditContact(false)}
        onSuccess={() => loadContact()}
        contact={contact}
      />
    </div>
  );
}
