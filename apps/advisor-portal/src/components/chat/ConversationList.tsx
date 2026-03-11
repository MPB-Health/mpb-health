import { useState, memo } from 'react';
import { Hash, Lock, MessageSquare, Search, Plus, Users } from 'lucide-react';
import type { ChatConversation } from '@mpbhealth/advisor-core';

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ConversationItem = memo(function ConversationItem({
  conv,
  isActive,
  onSelect,
}: {
  conv: ChatConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const hasUnread = (conv.unread_count || 0) > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-th-accent-50 dark:bg-th-accent-900/20'
          : 'hover:bg-th-bg-secondary'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {conv.type === 'channel' ? (
          conv.is_admin_only_posting ? (
            <Lock className="w-4 h-4 text-th-text-secondary" />
          ) : (
            <Hash className="w-4 h-4 text-th-text-secondary" />
          )
        ) : (
          <div className="w-8 h-8 rounded-full bg-th-accent-100 dark:bg-th-accent-800 flex items-center justify-center">
            <span className="text-xs font-medium text-th-accent-700 dark:text-th-accent-200">
              {(conv.display_name || '?')[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm truncate ${
              hasUnread ? 'font-semibold text-th-text-primary' : 'text-th-text-primary'
            }`}
          >
            {conv.type === 'channel' ? `#${conv.name}` : conv.display_name}
          </span>
          {conv.last_message_at && (
            <span className="text-xs text-th-text-tertiary ml-2 flex-shrink-0">
              {formatTime(conv.last_message_at)}
            </span>
          )}
        </div>
        {conv.last_message_preview && (
          <p className="text-xs text-th-text-secondary truncate mt-0.5">
            {conv.last_message_preview}
          </p>
        )}
      </div>

      {hasUnread && (
        <span className="flex-shrink-0 mt-1 bg-th-accent-600 text-white text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {conv.unread_count > 99 ? '99+' : conv.unread_count}
        </span>
      )}
    </button>
  );
});

interface ConversationListProps {
  conversations: ChatConversation[];
  channels: ChatConversation[];
  directMessages: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateDM?: () => void;
  loading: boolean;
}

export default function ConversationList({
  channels,
  directMessages,
  activeId,
  onSelect,
  onCreateDM,
  loading,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filteredChannels = channels.filter((c) =>
    (c.display_name || c.name || '').toLowerCase().includes(search.toLowerCase()),
  );
  const filteredDMs = directMessages.filter((c) =>
    (c.display_name || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-th-border-primary">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-th-bg-secondary rounded-lg border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder:text-th-text-tertiary"
          />
        </div>
      </div>

      {/* Conversation lists */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-th-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Channels */}
            {filteredChannels.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 mb-1">
                  <span className="text-xs font-semibold uppercase text-th-text-tertiary tracking-wider">
                    Channels
                  </span>
                  <Users className="w-3.5 h-3.5 text-th-text-tertiary" />
                </div>
                <div className="space-y-0.5">
                  {filteredChannels.map((c) => (
                    <ConversationItem key={c.id} conv={c} isActive={c.id === activeId} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-semibold uppercase text-th-text-tertiary tracking-wider">
                  Direct Messages
                </span>
                {onCreateDM && (
                  <button
                    type="button"
                    onClick={onCreateDM}
                    className="p-2.5 hover:bg-th-bg-secondary rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="New message"
                    aria-label="New direct message"
                  >
                    <Plus className="w-3.5 h-3.5 text-th-text-tertiary" />
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {filteredDMs.length > 0 ? (
                  filteredDMs.map((c) => (
                    <ConversationItem key={c.id} conv={c} isActive={c.id === activeId} onSelect={onSelect} />
                  ))
                ) : (
                  <p className="text-xs text-th-text-tertiary px-3 py-2">
                    No direct messages yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
