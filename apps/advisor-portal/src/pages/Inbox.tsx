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
import { Button, GradientHeader, MetricCard, SkeletonAvatar, SkeletonLine } from '@mpbhealth/ui';
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
        return <InboxIcon className="w-4 h-4 text-th-text-secondary" />;
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
        <button type="button" onClick={refresh} className="text-left">
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
        <div className="flex items-center bg-surface-primary border border-th-border rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>

        {/* Channel filter */}
        <div className="flex items-center space-x-2">
          {(['all', 'sms', 'email'] as ChannelFilter[]).map((channel) => (
            <Button
              type="button"
              key={channel}
              variant={channelFilter === channel ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setChannelFilter(channel)}
              className="capitalize"
            >
              {channel}
            </Button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={statusFilter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Active
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'archived' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </Button>
        </div>

        {/* Unread toggle */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-th-border text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-th-text-secondary">Unread only</span>
        </label>
      </div>

      {/* Conversation list */}
      {loading ? (
        <div className="bg-surface-primary rounded-xl border border-th-border divide-y divide-th-border-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center p-4">
              <SkeletonAvatar size="w-12 h-12" />
              <div className="flex-1 min-w-0 ml-4 space-y-2">
                <SkeletonLine width="w-1/3" />
                <SkeletonLine width="w-2/3" className="h-3" />
              </div>
              <div className="ml-4 flex-shrink-0">
                <SkeletonLine width="w-16" className="h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border">
          <InboxIcon className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
          <p className="text-th-text-secondary">
            {search ? 'No conversations match your search' : 'No conversations yet'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border divide-y divide-th-border-subtle">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className={`flex items-center p-4 hover:bg-surface-secondary cursor-pointer transition-colors ${
                conversation.unread_count > 0 ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-surface-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-th-text-secondary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 ml-4">
                <div className="flex items-center space-x-2">
                  <h3
                    className={`font-medium truncate ${
                      conversation.unread_count > 0
                        ? 'text-th-text-primary'
                        : 'text-th-text-primary'
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
                <p className="text-sm text-th-text-secondary truncate mt-0.5">
                  {conversation.last_message_direction === 'outbound' && (
                    <span className="text-th-text-tertiary">You: </span>
                  )}
                  {conversation.last_message_preview || 'No messages yet'}
                </p>
              </div>

              {/* Timestamp and actions */}
              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                {conversation.last_message_at && (
                  <span className="text-xs text-th-text-tertiary">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                {statusFilter === 'active' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleArchive(e, conversation.id)}
                    title="Archive"
                    aria-label="Archive conversation"
                    className="min-h-[44px] min-w-[44px] text-th-text-tertiary"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                )}
                <ChevronRight className="w-5 h-5 text-th-text-tertiary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
