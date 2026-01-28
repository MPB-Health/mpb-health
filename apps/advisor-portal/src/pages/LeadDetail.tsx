import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  Video,
  Zap,
  CheckCircle,
  Pause,
  ChevronRight,
  Send,
  Workflow,
  Inbox,
  Play,
} from 'lucide-react';
import { advisorLeadService, type LeadDetail as LeadDetailType } from '@mpbhealth/advisor-core';
import {
  priorityService,
  conversationService,
  sequenceService,
  type PriorityItemWithDetails,
  type Message,
  type Sequence,
  type SequenceEnrollment,
} from '@mpbhealth/champion-core';
import { useOrg } from '@mpbhealth/auth';
import { usePriorityActions } from '../hooks/usePriority';
import { useInboxActions, useSequences } from '../hooks/useInbox';
import { useAuth } from '../hooks/useAuth';
import { AIScoringFactors, AISuggestionsPanel, AIMessageAssistant } from '../components/ai';

type Tab = 'info' | 'messages' | 'sequences';

export default function LeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const { user } = useAuth();
  const { snoozeItem, completeItem, addToLane } = usePriorityActions();
  const { sendMessage, getOrCreateConversation, enrollInSequence } = useInboxActions();
  const { sequences } = useSequences('active');

  const [lead, setLead] = useState<LeadDetailType | null>(null);
  const [priorityItem, setPriorityItem] = useState<PriorityItemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Modal states
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showAddToLaneModal, setShowAddToLaneModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [lanes, setLanes] = useState<{ id: string; name: string; color: string }[]>([]);

  // Messaging states
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [activeEnrollments, setActiveEnrollments] = useState<SequenceEnrollment[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Quick message composer
  const [messageChannel, setMessageChannel] = useState<'sms' | 'email'>('sms');
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    if (!leadId || !activeOrg?.id) return;

    try {
      setLoading(true);
      const leadData = await advisorLeadService.getLead(leadId);
      setLead(leadData);

      // Load lanes
      const lanesData = await priorityService.getLanes(activeOrg.id);
      setLanes(lanesData.map((l) => ({ id: l.id, name: l.name, color: l.color })));

      // Get or create conversation and load messages
      try {
        const convId = await conversationService.getOrCreateForLead(activeOrg.id, leadId, 'both');
        setConversationId(convId);
        const messages = await conversationService.getMessages(convId, { limit: 10 });
        setRecentMessages(messages);
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }

      // Load active sequence enrollments
      try {
        const enrollments = await sequenceService.getLeadActiveEnrollments(leadId);
        setActiveEnrollments(enrollments);
      } catch (err) {
        console.error('Failed to load enrollments:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load lead'));
    } finally {
      setLoading(false);
    }
  }, [leadId, activeOrg?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToLane = async (laneId: string) => {
    if (!leadId) return;
    try {
      await addToLane(laneId, leadId, undefined, 'Added from lead detail');
      setShowAddToLaneModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add to lane:', err);
    }
  };

  const handleSnooze = async (hours: number) => {
    if (!priorityItem) return;
    try {
      const until = new Date();
      until.setHours(until.getHours() + hours);
      await snoozeItem(priorityItem.id, until, `Snoozed for ${hours} hours`);
      setShowSnoozeModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to snooze:', err);
    }
  };

  const handleComplete = async () => {
    if (!priorityItem) return;
    try {
      await completeItem(priorityItem.id, 'Marked complete from lead detail');
      loadData();
    } catch (err) {
      console.error('Failed to complete:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!conversationId || !messageContent.trim()) return;
    if (messageChannel === 'email' && !messageSubject.trim()) return;

    try {
      setSending(true);
      await sendMessage(conversationId, messageChannel, messageContent, {
        subject: messageSubject,
      });
      setMessageContent('');
      setMessageSubject('');
      loadData();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEnrollInSequence = async (sequenceId: string) => {
    if (!leadId) return;
    try {
      await enrollInSequence(sequenceId, leadId);
      setShowEnrollModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to enroll:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error?.message || 'Lead not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  const priorityColor =
    lead.priority === 'critical'
      ? 'bg-red-100 text-red-700'
      : lead.priority === 'high'
        ? 'bg-orange-100 text-orange-700'
        : lead.priority === 'medium'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-neutral-100 text-neutral-600';

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-sm text-neutral-500">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            <Workflow className="w-4 h-4" />
            <span>Enroll in Sequence</span>
          </button>
          {!priorityItem ? (
            <button
              onClick={() => setShowAddToLaneModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Zap className="w-4 h-4" />
              <span>Add to Power List</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowSnoozeModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
              >
                <Pause className="w-4 h-4" />
                <span>Snooze</span>
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-neutral-200">
        {[
          { id: 'info', label: 'Info', icon: User },
          { id: 'messages', label: 'Messages', icon: MessageSquare, badge: recentMessages.length },
          { id: 'sequences', label: 'Sequences', icon: Workflow, badge: activeEnrollments.length },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as Tab)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact info card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <a href={`mailto:${lead.email}`} className="text-sm text-primary-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>

                {lead.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Phone</p>
                      <a href={`tel:${lead.phone}`} className="text-sm text-primary-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                )}

                {(lead.address || lead.city || lead.state) && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Address</p>
                      <p className="text-sm text-neutral-900">
                        {[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {lead.date_of_birth && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Date of Birth</p>
                      <p className="text-sm text-neutral-900">
                        {format(new Date(lead.date_of_birth), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Notes</h2>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('messages');
                    setMessageChannel('email');
                  }}
                  className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Mail className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-neutral-700">Send Email</span>
                </button>
                {lead.phone && (
                  <button
                    onClick={() => {
                      setActiveTab('messages');
                      setMessageChannel('sms');
                    }}
                    className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-neutral-700">Send SMS</span>
                  </button>
                )}
                <button
                  onClick={() => conversationId && navigate(`/inbox/${conversationId}`)}
                  className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <Inbox className="w-6 h-6 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-neutral-700">View Inbox</span>
                </button>
                <button className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <Video className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-neutral-700">Schedule Meeting</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Status</h2>
              <div className="space-y-4">
                {lead.pipeline_stage && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Pipeline Stage</p>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: lead.pipeline_stage_color || '#6B7280' }}
                    >
                      {lead.pipeline_stage}
                    </span>
                  </div>
                )}
                {lead.priority && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Priority</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${priorityColor}`}>
                      {lead.priority}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Scoring Factors */}
            {leadId && <AIScoringFactors leadId={leadId} />}

            {/* AI Suggestions */}
            {user?.id && leadId && (
              <AISuggestionsPanel
                userId={user.id}
                leadId={leadId}
                onApplyMessage={(message) => {
                  setMessageContent(message);
                  setActiveTab('messages');
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent messages */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">Recent Messages</h2>
              {conversationId && (
                <button
                  onClick={() => navigate(`/inbox/${conversationId}`)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </button>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                  <p>No messages yet</p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.direction === 'outbound'
                          ? 'bg-primary-100 text-primary-900'
                          : 'bg-neutral-100 text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1 text-xs mb-1 opacity-60">
                        {message.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                      {message.subject && <p className="font-medium text-sm">{message.subject}</p>}
                      <p className="text-sm">{message.content || message.body_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

            {/* AI Message Assistant */}
            {user?.id && messageContent.trim() && (
              <AIMessageAssistant
                userId={user.id}
                leadName={`${lead.first_name} ${lead.last_name}`}
                originalMessage={messageContent}
                onApply={(message) => setMessageContent(message)}
              />
            )}
          </div>

          {/* Quick compose */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Quick Message</h2>
            <div className="space-y-4">
              {/* Channel toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMessageChannel('sms')}
                  disabled={!lead.phone}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messageChannel === 'sms'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  } ${!lead.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS</span>
                </button>
                <button
                  onClick={() => setMessageChannel('email')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messageChannel === 'email'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>

              {messageChannel === 'email' && (
                <input
                  type="text"
                  placeholder="Subject..."
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
              )}

              <textarea
                placeholder={messageChannel === 'sms' ? 'Type your message...' : 'Type your email...'}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none"
              />

              <button
                onClick={handleSendMessage}
                disabled={sending || !messageContent.trim() || (messageChannel === 'email' && !messageSubject.trim())}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sequences' && (
        <div className="space-y-6">
          {/* Active enrollments */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">Active Sequences</h2>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Enroll in Sequence
              </button>
            </div>
            <div className="p-4">
              {activeEnrollments.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <Workflow className="w-12 h-12 mx-auto mb-3" />
                  <p>Not enrolled in any sequences</p>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Enroll in a Sequence
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeEnrollments.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-neutral-900">
                          {enrollment.sequence?.name || 'Unknown Sequence'}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          Step {enrollment.current_step} of sequence
                          {enrollment.next_step_at && (
                            <> · Next step {formatDistanceToNow(new Date(enrollment.next_step_at), { addSuffix: true })}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <Play className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddToLaneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add to Power List</h3>
            <div className="space-y-2">
              {lanes.map((lane) => (
                <button
                  key={lane.id}
                  onClick={() => handleAddToLane(lane.id)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 rounded-lg flex items-center space-x-3"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lane.color }} />
                  <span className="font-medium">{lane.name}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddToLaneModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Enroll in Sequence</h3>
            <p className="text-sm text-neutral-600 mb-4">Select a sequence to enroll this lead:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sequences.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">No active sequences available</p>
              ) : (
                sequences.map((sequence) => (
                  <button
                    key={sequence.id}
                    onClick={() => handleEnrollInSequence(sequence.id)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 rounded-lg"
                  >
                    <p className="font-medium text-neutral-900">{sequence.name}</p>
                    {sequence.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">{sequence.description}</p>
                    )}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowEnrollModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSnoozeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Snooze Lead</h3>
            <div className="space-y-2">
              {[
                { hours: 1, label: '1 hour' },
                { hours: 4, label: '4 hours' },
                { hours: 24, label: '1 day' },
                { hours: 72, label: '3 days' },
                { hours: 168, label: '1 week' },
              ].map(({ hours, label }) => (
                <button
                  key={hours}
                  onClick={() => handleSnooze(hours)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 rounded-lg flex items-center justify-between"
                >
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSnoozeModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
