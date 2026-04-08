import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '@mpbhealth/ui';
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
  Users,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Activity,
  FileText,
  MessageSquare,
  PhoneCall,
  Video,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { AddContactModal } from '../components/AddContactModal';
import { UnifiedTimeline } from '../components/UnifiedTimeline';
import { AttachmentList } from '../components/AttachmentList';
import { RelationshipSidebar } from '../components/RelationshipSidebar';
import { supabase } from '../lib/supabase';
import { useCRM } from '../contexts/CRMContext';
import {
  createContactService,
  createFamilyService,
  formatTimeAgo,
  PLAN_TYPE_LABELS,
  TOBACCO_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  PHONE_TYPE_LABELS,
  type ContactWithRelations,
  type FamilyMember,
  type PhoneNumber,
} from '@mpbhealth/crm-core';

const contactService = createContactService(supabase);
const familyService = createFamilyService(supabase);

interface ContactDeal {
  id: string;
  name: string;
  amount: number | null;
  stage?: { id: string; name: string; display_name: string; color: string } | null;
  contact_role?: string;
  is_primary?: boolean;
  expected_close_date: string | null;
  created_at: string;
}

function SectionHeader({ icon: Icon, title, count, action }: {
  icon: typeof Users;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-th-accent-600" />
        </div>
        <h2 className="text-base font-semibold text-th-text-primary">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 text-sm font-normal text-th-text-tertiary">({count})</span>
          )}
        </h2>
      </div>
      {action}
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, href }: {
  label: string;
  value: string | null | undefined;
  icon?: typeof Mail;
  href?: string;
}) {
  if (!value) return null;
  const content = href ? (
    <a href={href} className="text-th-accent-600 hover:text-th-accent-700 hover:underline transition-colors">
      {value}
    </a>
  ) : (
    <span className="text-th-text-primary">{value}</span>
  );
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="w-4 h-4 text-th-text-tertiary mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-th-text-tertiary mb-0.5">{label}</p>
        <p className="text-sm break-words">{content}</p>
      </div>
    </div>
  );
}

function PlanTypeBadge({ planType }: { planType?: string | null }) {
  if (!planType) return null;
  const isHealthshare = planType === 'healthshare';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
      isHealthshare
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <Shield className="w-3.5 h-3.5" />
      {PLAN_TYPE_LABELS[planType as keyof typeof PLAN_TYPE_LABELS] || planType}
    </span>
  );
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activityService } = useCRM();

  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [deals, setDeals] = useState<ContactDeal[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'timeline' | 'attachments'>('overview');
  const [showEditContact, setShowEditContact] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadContact = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contactData, dealsData, familyData, phoneData] = await Promise.all([
        contactService.getContact(id),
        contactService.getContactDeals(id),
        familyService.getFamilyMembers('contact', id),
        familyService.getPhoneNumbers('contact', id),
      ]);
      setContact(contactData);
      setDeals(dealsData || []);
      setFamilyMembers(familyData);
      setPhoneNumbers(phoneData);

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
  }, [id, contactService, familyService, activityService]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleAddNote = async () => {
    if (!id || !noteTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('crm_activities').insert({
        org_id: contact?.org_id ?? '00000000-0000-4000-a000-000000000001',
        activity_type: 'note',
        subject: noteTitle.trim(),
        description: noteContent.trim() || null,
        contact_id: id,
        lead_id: contact?.converted_from_lead_id ?? null,
        status: 'completed',
        created_by: user?.id ?? '',
      });
      if (error) throw error;
      setNoteTitle('');
      setNoteContent('');
      setShowAddNote(false);
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const formatAddress = (address: Record<string, string> | null | undefined): string => {
    if (!address || Object.keys(address).length === 0) return '';
    return [address.street, address.city, address.state, address.zip, address.country].filter(Boolean).join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-tertiary rounded" />
        <div className="h-12 w-80 bg-surface-tertiary rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="h-64 bg-surface-tertiary rounded-xl" />
            <div className="h-40 bg-surface-tertiary rounded-xl" />
          </div>
          <div className="lg:col-span-2 h-96 bg-surface-tertiary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-12 h-12 text-th-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-th-text-primary mb-1">Contact not found</h2>
        <p className="text-sm text-th-text-tertiary mb-4">This contact may have been deleted or you don't have access.</p>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contacts
        </Link>
      </div>
    );
  }

  const hasFinancials = contact.premium_amount || contact.subsidy_amount || contact.member_responsibility;
  const mailingAddr = formatAddress(contact.mailing_address);
  const otherAddr = formatAddress(contact.other_address);

  return (
    <div className="space-y-8 pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Contacts', href: '/contacts' },
          { label: `${contact.first_name} ${contact.last_name}` },
        ]}
      />

      {/* ─── Hero Header ─── */}
      <div className="bg-surface-primary rounded-2xl border border-th-border p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <button
              onClick={() => navigate('/contacts')}
              aria-label="Back to contacts"
              className="p-2 -ml-2 hover:bg-surface-tertiary rounded-lg shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
            </button>
            <div className="w-14 h-14 bg-th-accent-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-th-accent-700 font-bold text-lg">
                {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-th-text-primary">
                  {contact.salutation ? `${contact.salutation} ` : ''}{contact.first_name} {contact.last_name}
                </h1>
                <PlanTypeBadge planType={contact.plan_type} />
                {contact.do_not_call && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <PhoneOff className="w-3 h-3" /> DNC
                  </span>
                )}
                {contact.do_not_email && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <MailX className="w-3 h-3" /> DNE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-th-text-secondary flex-wrap">
                {contact.title && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {contact.title}
                  </span>
                )}
                {contact.account && (
                  <Link
                    to={`/accounts/${contact.account.id}`}
                    className="flex items-center gap-1.5 text-th-accent-600 hover:underline"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {contact.account.name}
                  </Link>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-th-accent-600 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {contact.email}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-th-text-tertiary flex-wrap">
                {contact.carrier && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {contact.carrier.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created {formatTimeAgo(contact.created_at)}
                </span>
                {contact.original_effective_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Effective {new Date(contact.original_effective_date).toLocaleDateString()}
                  </span>
                )}
                {contact.lead_source && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-tertiary text-th-text-secondary text-xs font-medium">
                    {contact.lead_source}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center bg-surface-secondary rounded-xl p-1 gap-1">
              <button type="button" onClick={() => setShowAddNote(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all">
                <MessageSquare className="w-3.5 h-3.5" /> Note
              </button>
            </div>
            <PermissionGate permission="contacts.write">
              <button
                type="button"
                onClick={() => setShowEditContact(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Contact
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Status line */}
        {contact.tobacco_status && contact.tobacco_status !== 'none' && (
          <div className="mt-6 pt-6 border-t border-th-border flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {TOBACCO_STATUS_LABELS[contact.tobacco_status as keyof typeof TOBACCO_STATUS_LABELS] || contact.tobacco_status}
            </span>
          </div>
        )}
      </div>

      {/* ─── Main Content + Sidebar ─── */}
      <div className="flex gap-6">
      <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── Left Column ─── */}
        <div className="space-y-6">

          {/* Contact Info */}
          <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
            <SectionHeader icon={User} title="Contact Info" />
            <div className="space-y-0 divide-y divide-th-border-subtle">
              <DetailRow label="Phone" value={contact.phone} icon={Phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
              <DetailRow label="Mobile" value={contact.mobile} icon={Smartphone} href={contact.mobile ? `tel:${contact.mobile}` : undefined} />
              <DetailRow label="Email" value={contact.email} icon={Mail} href={contact.email ? `mailto:${contact.email}` : undefined} />
              <DetailRow label="LinkedIn" value={contact.linkedin_url ? 'LinkedIn Profile' : null} icon={Globe} href={contact.linkedin_url || undefined} />
              <DetailRow label="Twitter" value={contact.twitter_handle ? `@${contact.twitter_handle}` : null} icon={Twitter} href={contact.twitter_handle ? `https://twitter.com/${contact.twitter_handle}` : undefined} />
              <DetailRow label="Owner" value={contact.owner?.full_name || contact.owner?.email} icon={User} />
              <DetailRow label="Date of Birth" value={contact.date_of_birth ? new Date(contact.date_of_birth).toLocaleDateString() : null} icon={Calendar} />
            </div>
          </div>

          {/* Phone Numbers */}
          {phoneNumbers.length > 0 && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <SectionHeader icon={Phone} title="Phone Numbers" count={phoneNumbers.length} />
              <div className="space-y-3">
                {phoneNumbers.map((pn) => (
                  <div key={pn.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <a href={`tel:${pn.phone_number}`} className="text-sm font-medium text-th-accent-600 hover:underline">
                          {pn.phone_number}
                        </a>
                        <p className="text-xs text-th-text-tertiary">
                          {PHONE_TYPE_LABELS[pn.phone_type as keyof typeof PHONE_TYPE_LABELS] || pn.phone_type}
                          {pn.label && ` · ${pn.label}`}
                          {pn.is_primary && ' · Primary'}
                        </p>
                      </div>
                    </div>
                    {pn.do_not_call && (
                      <span className="text-xs text-red-600 font-medium">DNC</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Members */}
          <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
            <SectionHeader icon={Users} title="Family Members" count={familyMembers.length} />
            {familyMembers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
                <p className="text-sm text-th-text-tertiary">No family members on record</p>
              </div>
            ) : (
              <div className="space-y-3">
                {familyMembers.map((fm) => (
                  <div key={fm.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                    <div className="w-9 h-9 rounded-full bg-th-accent-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-th-accent-700">
                        {fm.first_name.charAt(0)}{fm.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-th-text-primary truncate">
                        {fm.first_name} {fm.last_name}
                      </p>
                      <p className="text-xs text-th-text-tertiary">
                        {RELATIONSHIP_LABELS[fm.relationship as keyof typeof RELATIONSHIP_LABELS] || fm.relationship}
                        {fm.date_of_birth && ` · DOB: ${new Date(fm.date_of_birth).toLocaleDateString()}`}
                      </p>
                    </div>
                    {fm.is_covered && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        Covered
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Address */}
          {(mailingAddr || otherAddr) && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <SectionHeader icon={MapPin} title="Addresses" />
              <div className="space-y-0 divide-y divide-th-border-subtle">
                {mailingAddr && <DetailRow label="Mailing Address" value={mailingAddr} icon={MapPin} />}
                {otherAddr && <DetailRow label="Other Address" value={otherAddr} icon={MapPin} />}
              </div>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <SectionHeader icon={Tag} title="Tags" />
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Financial Details (collapsed) */}
          {hasFinancials && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <button
                onClick={() => setShowFinancials(!showFinancials)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-th-text-tertiary" />
                  </div>
                  <h2 className="text-base font-semibold text-th-text-primary">Financial Details</h2>
                </div>
                {showFinancials ? <ChevronUp className="w-4 h-4 text-th-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-th-text-tertiary" />}
              </button>
              {showFinancials && (
                <div className="mt-4 space-y-0 divide-y divide-th-border-subtle">
                  <DetailRow label="Full Premium" value={contact.premium_amount ? `$${contact.premium_amount.toFixed(2)}` : null} icon={DollarSign} />
                  <DetailRow label="Subsidy Amount" value={contact.subsidy_amount ? `$${contact.subsidy_amount.toFixed(2)}` : null} icon={DollarSign} />
                  <DetailRow label="Member Responsibility" value={contact.member_responsibility ? `$${contact.member_responsibility.toFixed(2)}` : null} icon={DollarSign} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right Column (2/3 width) ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-th-border">
              {([
                { key: 'overview' as const, label: 'Overview', count: undefined as number | undefined },
                { key: 'deals' as const, label: 'Deals', count: deals.length },
                { key: 'timeline' as const, label: 'Timeline', count: undefined as number | undefined },
                { key: 'attachments' as const, label: 'Files', count: undefined as number | undefined },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-th-accent-600'
                      : 'text-th-text-tertiary hover:text-th-text-secondary'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs ${
                      activeTab === tab.key
                        ? 'bg-th-accent-50 text-th-accent-600'
                        : 'bg-surface-tertiary text-th-text-tertiary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-th-accent-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Work Info */}
                  <div>
                    <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-4">
                      Work Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                      <DetailRow label="Title" value={contact.title} icon={Briefcase} />
                      <DetailRow label="Department" value={contact.department} icon={Building2} />
                      <DetailRow label="Reports To" value={
                        contact.reports_to_contact
                          ? `${contact.reports_to_contact.first_name} ${contact.reports_to_contact.last_name}`
                          : null
                      } icon={User} />
                      <DetailRow label="Account" value={contact.account?.name} icon={Building2} />
                    </div>
                  </div>

                  {/* Description */}
                  {contact.description && (
                    <div>
                      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                        Description
                      </h3>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap leading-relaxed bg-surface-secondary rounded-xl p-4">
                        {contact.description}
                      </p>
                    </div>
                  )}

                  {/* Conversion info */}
                  {contact.converted_at && (
                    <div>
                      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                        Conversion
                      </h3>
                      <p className="text-sm text-th-text-secondary">
                        Converted from lead on {new Date(contact.converted_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deals' && (
                deals.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-th-text-secondary">No deals associated</p>
                    <p className="text-xs text-th-text-tertiary mt-1">Deals linked to this contact will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deals.map((deal) => (
                      <Link
                        key={deal.id}
                        to={`/deals/${deal.id}`}
                        className="block p-4 rounded-xl border border-th-border hover:border-th-accent-200 hover:bg-surface-secondary transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-th-text-primary">{deal.name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {deal.stage && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: `${deal.stage.color}20`, color: deal.stage.color }}
                                >
                                  {deal.stage.display_name}
                                </span>
                              )}
                              {deal.contact_role && (
                                <span className="text-xs text-th-text-tertiary">Role: {deal.contact_role}</span>
                              )}
                              {deal.is_primary && (
                                <span className="text-xs font-medium text-th-accent-600">Primary</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {deal.amount !== null && (
                              <p className="text-sm font-semibold text-th-text-primary">${deal.amount.toLocaleString()}</p>
                            )}
                            {deal.expected_close_date && (
                              <p className="text-xs text-th-text-tertiary mt-0.5">
                                Close: {new Date(deal.expected_close_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'timeline' && (
                <UnifiedTimeline contactId={id} />
              )}

              {activeTab === 'attachments' && (
                <AttachmentList entityType="contact" entityId={id!} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Relationship Intelligence Sidebar ─── */}
      <div className="hidden xl:block">
        <RelationshipSidebar
          entityType="contact"
          entityId={contact.id}
          entityName={`${contact.first_name} ${contact.last_name}`}
          advisorId={contact.owner_id}
          accountId={contact.account_id}
          accountName={(contact as any).account?.name ?? null}
          planType={(contact as unknown as Record<string, unknown>).plan_type as string ?? null}
        />
      </div>
      </div>

      {/* Edit Modal */}
      <AddContactModal
        open={showEditContact}
        onClose={() => setShowEditContact(false)}
        onSuccess={() => loadContact()}
        contact={contact}
      />

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => !savingNote && setShowAddNote(false)}>
          <div className="bg-surface-primary rounded-2xl border border-th-border shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-th-text-primary">Add Note</h3>
              <button type="button" onClick={() => setShowAddNote(false)} title="Close" className="text-th-text-tertiary hover:text-th-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                autoFocus
                className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-surface-primary text-th-text-primary"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Details (optional)"
                rows={4}
                className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none bg-surface-primary text-th-text-primary"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary rounded-lg">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                disabled={savingNote || !noteTitle.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white text-sm font-medium rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
