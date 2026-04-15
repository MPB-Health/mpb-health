import { useRef, useEffect, useMemo } from 'react';
import { Trash2, Reply, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../../contexts/AdvisorContext';

interface MessageThreadProps {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDeleteMessage: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  isAdminOrOwner: boolean;
}

export default function MessageThread({
  messages,
  loading,
  hasMore,
  onLoadMore,
  onDeleteMessage,
  onReply,
  isAdminOrOwner,
}: MessageThreadProps) {
  const { profile } = useAdvisor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAutoScrollRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Track scroll position for auto-scroll behavior
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }

    return groups;
  }, [messages]);

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-3"
    >
      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center py-2 mb-3">
          <button
            type="button"
            onClick={onLoadMore}
            className="text-xs text-th-accent-600 hover:text-th-accent-700 font-medium px-3 py-1.5 rounded-full border border-th-border-primary hover:bg-th-bg-secondary transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {loading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-th-accent-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-th-text-tertiary">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Be the first to say something!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-th-border-primary" />
                <span className="text-xs font-medium text-th-text-tertiary">{group.date}</span>
                <div className="flex-1 h-px bg-th-border-primary" />
              </div>

              {/* Messages */}
              {group.messages.map((msg, idx) => {
                const isOwnMessage = msg.sender_id === profile?.id;
                const showSender =
                  idx === 0 || group.messages[idx - 1].sender_id !== msg.sender_id;

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-2.5 py-1 ${
                      showSender ? 'mt-3' : 'mt-0'
                    }`}
                  >
                    {/* Avatar */}
                    {showSender ? (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-th-accent-100 dark:bg-th-accent-800 flex items-center justify-center overflow-hidden">
                        {msg.sender_avatar ? (
                          <img
                            src={msg.sender_avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <span className={`text-xs font-medium text-th-accent-700 dark:text-th-accent-200 ${msg.sender_avatar ? 'hidden' : ''}`}>
                          {(msg.sender_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      {showSender && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-th-text-primary">
                            {msg.sender_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-th-text-tertiary">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {msg.is_deleted ? (
                        <p className="text-sm italic text-th-text-tertiary">
                          This message was deleted
                        </p>
                      ) : (
                        <p className="text-sm text-th-text-primary whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}
                    </div>

                    {/* Actions (on hover) */}
                    {!msg.is_deleted && (
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onReply && (
                          <button
                            type="button"
                            onClick={() => onReply(msg.id)}
                            className="p-1.5 rounded hover:bg-th-bg-secondary text-th-text-tertiary hover:text-th-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Reply"
                            aria-label="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isOwnMessage || isAdminOrOwner) && (
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(msg.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-th-text-tertiary hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Delete message"
                            aria-label="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
