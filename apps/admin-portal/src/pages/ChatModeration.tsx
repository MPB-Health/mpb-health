import { useState, useEffect, useCallback } from 'react';
import {
  Search, MessageSquare, Hash, Users, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  chatAdminService,
  type ChatConversationAdmin,
  type ChatMessageAdmin,
  type ChatAdminStats,
} from '@mpbhealth/admin-core';

const TYPE_LABELS: Record<string, string> = {
  direct: 'DM',
  group: 'Group',
  channel: 'Channel',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  direct: MessageSquare,
  group: Users,
  channel: Hash,
};

export default function ChatModeration() {
  const [conversations, setConversations] = useState<ChatConversationAdmin[]>([]);
  const [stats, setStats] = useState<ChatAdminStats | null>(null);
  const [messages, setMessages] = useState<ChatMessageAdmin[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const [convos, chatStats] = await Promise.all([
        chatAdminService.getConversations({
          type: typeFilter || undefined,
          search: searchQuery || undefined,
        }),
        chatAdminService.getStats(),
      ]);
      setConversations(convos);
      setStats(chatStats);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = async (convoId: string) => {
    setSelectedConvo(convoId);
    setLoadingMessages(true);
    try {
      const msgs = await chatAdminService.getMessages(convoId);
      setMessages(msgs);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatAdminService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, content: '[Message removed by admin]', is_deleted: true } : m)
      );
      toast.success('Message removed');
    } catch {
      toast.error('Failed to remove message');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-th-text-primary">Chat Moderation</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Conversations" value={stats.total_conversations} />
          <StatCard label="Messages" value={stats.total_messages} />
          <StatCard label="Active Today" value={stats.active_today} />
          <StatCard label="Channels" value={stats.total_channels} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
        >
          <option value="">All Types</option>
          <option value="direct">DMs</option>
          <option value="group">Groups</option>
          <option value="channel">Channels</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations list */}
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-4 border-b border-th-border">
            <h2 className="font-semibold text-th-text-primary">Conversations</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-th-border-subtle max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => {
                const Icon = TYPE_ICONS[conv.type] || MessageSquare;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left p-4 hover:bg-surface-tertiary transition-colors ${
                      selectedConvo === conv.id ? 'bg-surface-tertiary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-th-text-tertiary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-th-text-primary truncate">
                          {conv.name || `${TYPE_LABELS[conv.type]} conversation`}
                        </p>
                        <p className="text-xs text-th-text-tertiary">
                          {conv.member_count} members, {conv.message_count} messages
                        </p>
                      </div>
                      {conv.last_message_at && (
                        <span className="text-xs text-th-text-tertiary shrink-0">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-th-text-tertiary" />
              <p className="text-th-text-tertiary">No conversations found</p>
            </div>
          )}
        </div>

        {/* Messages panel */}
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="p-4 border-b border-th-border">
            <h2 className="font-semibold text-th-text-primary">Messages</h2>
          </div>
          {selectedConvo ? (
            loadingMessages ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
              </div>
            ) : messages.length > 0 ? (
              <div className="divide-y divide-th-border-subtle max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 hover:bg-surface-tertiary">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-th-text-tertiary mb-1">
                          {msg.sender_name || msg.sender_id.slice(0, 8)} &middot;{' '}
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                        <p className={`text-sm ${msg.is_deleted ? 'text-th-text-tertiary italic' : 'text-th-text-primary'}`}>
                          {msg.content}
                        </p>
                      </div>
                      {!msg.is_deleted && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 text-th-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                          title="Remove message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-th-text-tertiary">No messages in this conversation</p>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-th-text-tertiary" />
              <p className="text-th-text-tertiary">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <span className="text-xs text-th-text-tertiary">{label}</span>
      <p className="text-2xl font-bold text-th-text-primary">{value.toLocaleString()}</p>
    </div>
  );
}
