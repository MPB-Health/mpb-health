import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Inbox as InboxIcon,
  Search,
  Filter,
  Mail,
  MessageSquare,
  User,
  Archive,
  MoreVertical,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { useConversations, useInboxSummary, useInboxActions } from '../hooks/useInbox';
import type { ConversationWithLead } from '@mpbhealth/champion-core';

type ChannelFilter = 'all' | 'sms' | 'email';
type StatusFilter = 'active' | 'archived';

export default function Inbox() {
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search input to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { conversations, loading, refresh } = useConversations({
    status: statusFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
    unreadOnly,
    search: debouncedSearch || undefined,
  });

  const { summary } = useInboxSummary();
  const { archiveConversation } = useInboxActions();

  const handleConversationClick = (conversation: ConversationWithLead) => {
    navigate(`/inbox/${conversation.id}`);
  };

  const handleArchive = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      await archiveConversation(conversationId);
      refresh();
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <InboxIcon className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Inbox"
        subtitle="Manage all your conversations in one place"
        icon={<InboxIcon className="w-6 h-6" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Conversations"
          value={summary?.total_conversations ?? '-'}
          icon={<InboxIcon className="w-5 h-5" />}
        />
        <MetricCard
          label="Unread"
          value={summary?.unread_conversations ?? '-'}
          icon={<Mail className="w-5 h-5" />}
        />
        <MetricCard
          label="Active Sequences"
          value={summary?.active_sequences ?? '-'}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <button onClick={refresh} className="text-left">
          <MetricCard
            label="Refresh"
            value={<RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />}
            icon={<span className="text-xs">Click to refresh</span>}
            className="hover:border-th-accent-300 cursor-pointer"
          />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-neutral-700 placeholder-neutral-400"
          />
        </div>

        {/* Channel filter */}
        <div className="flex items-center space-x-2">
          {(['all', 'sms', 'email'] as ChannelFilter[]).map((channel) => (
            <button
              key={channel}
              onClick={() => setChannelFilter(channel)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                channelFilter === channel
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {channel}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'archived'
                ? 'bg-neutral-700 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Unread toggle */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-600">Unread only</span>
        </label>
      </div>

      {/* Conversation list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <InboxIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            {search ? 'No conversations match your search' : 'No conversations yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className={`flex items-center p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                conversation.unread_count > 0 ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-neutral-500" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 ml-4">
                <div className="flex items-center space-x-2">
                  <h3
                    className={`font-medium truncate ${
                      conversation.unread_count > 0
                        ? 'text-neutral-900'
                        : 'text-neutral-700'
                    }`}
                  >
                    {conversation.participant_name}
                  </h3>
                  {getChannelIcon(conversation.channel)}
                  {conversation.unread_count > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 truncate mt-0.5">
                  {conversation.last_message_direction === 'outbound' && (
                    <span className="text-neutral-400">You: </span>
                  )}
                  {conversation.last_message_preview || 'No messages yet'}
                </p>
              </div>

              {/* Timestamp and actions */}
              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                {conversation.last_message_at && (
                  <span className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                {statusFilter === 'active' && (
                  <button
                    onClick={(e) => handleArchive(e, conversation.id)}
                    className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
