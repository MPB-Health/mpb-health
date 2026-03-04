import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Lock, ArrowLeft, Users, Search, MessageSquare } from 'lucide-react';
import { useChat, useChatMessages } from '../hooks/useChat';
import { useAdvisor } from '../contexts/AdvisorContext';
import { chatService } from '@mpbhealth/advisor-core';
import type { ChatConversation, ChatMember } from '@mpbhealth/advisor-core';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageComposer from '../components/chat/MessageComposer';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const { conversations, channels, directMessages, loading: convLoading, totalUnread } = useChat();
  const { messages, loading: msgLoading, hasMore, sending, loadMore, sendMessage, deleteMessage } =
    useChatMessages(conversationId || null);

  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showNewDmSearch, setShowNewDmSearch] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  const activeConv = conversations.find((c) => c.id === conversationId) || null;

  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`);
      setShowMembers(false);
    },
    [navigate],
  );

  const handleLoadMembers = useCallback(async () => {
    if (!conversationId) return;
    setShowMembers((prev) => !prev);
    if (!showMembers) {
      setMembersLoading(true);
      try {
        const data = await chatService.listMembers(conversationId);
        setMembers(data);
      } catch {
        // silent
      } finally {
        setMembersLoading(false);
      }
    }
  }, [conversationId, showMembers]);

  const handleCreateDM = useCallback(
    async (targetUserId: string) => {
      try {
        const { conversation_id } = await chatService.createDM(targetUserId);
        navigate(`/chat/${conversation_id}`);
        setShowNewDmSearch(false);
        setDmSearchQuery('');
      } catch (err) {
        console.error('[Chat] Failed to create DM:', err);
      }
    },
    [navigate],
  );

  // Determine if user is admin/owner for the active conversation
  const isAdminOrOwner =
    activeConv?.my_role === 'admin' || activeConv?.my_role === 'owner';

  // Determine if composer should be disabled (announcement channel for non-admins)
  const composerDisabled = activeConv?.is_admin_only_posting && !isAdminOrOwner;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-th-bg-primary">
      {/* Left sidebar — conversation list */}
      <div
        className={`w-72 xl:w-80 flex-shrink-0 border-r border-th-border-primary bg-th-bg-primary ${
          conversationId ? 'hidden lg:flex' : 'flex'
        } flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
          <h2 className="text-base font-semibold text-th-text-primary">Chat</h2>
          {totalUnread > 0 && (
            <span className="bg-th-accent-600 text-white text-xs font-medium rounded-full px-2 py-0.5">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
        <ConversationList
          conversations={conversations}
          channels={channels}
          directMessages={directMessages}
          activeId={conversationId || null}
          onSelect={handleSelectConversation}
          onCreateDM={() => setShowNewDmSearch(true)}
          loading={convLoading}
        />
      </div>

      {/* Center — message thread */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          !conversationId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {conversationId && activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border-primary">
              <button
                onClick={() => navigate('/chat')}
                className="lg:hidden p-1 hover:bg-th-bg-secondary rounded"
              >
                <ArrowLeft className="w-5 h-5 text-th-text-primary" />
              </button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                {activeConv.type === 'channel' ? (
                  activeConv.is_admin_only_posting ? (
                    <Lock className="w-4 h-4 text-th-text-secondary flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-th-text-secondary flex-shrink-0" />
                  )
                ) : null}
                <h3 className="text-sm font-semibold text-th-text-primary truncate">
                  {activeConv.type === 'channel'
                    ? `#${activeConv.name}`
                    : activeConv.display_name}
                </h3>
                {activeConv.description && (
                  <span className="text-xs text-th-text-tertiary truncate hidden sm:block">
                    — {activeConv.description}
                  </span>
                )}
              </div>

              {activeConv.type !== 'direct' && (
                <button
                  onClick={handleLoadMembers}
                  className={`p-1.5 rounded hover:bg-th-bg-secondary ${
                    showMembers ? 'bg-th-bg-secondary' : ''
                  }`}
                  title="Members"
                >
                  <Users className="w-4 h-4 text-th-text-secondary" />
                </button>
              )}
            </div>

            {/* Messages + composer */}
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-w-0">
                <MessageThread
                  messages={messages}
                  loading={msgLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onDeleteMessage={deleteMessage}
                  isAdminOrOwner={isAdminOrOwner}
                />
                <MessageComposer
                  onSend={sendMessage}
                  sending={sending}
                  disabled={composerDisabled}
                  placeholder={
                    composerDisabled
                      ? 'Only admins can post here'
                      : `Message ${activeConv.type === 'channel' ? '#' + activeConv.name : activeConv.display_name}`
                  }
                />
              </div>

              {/* Members panel */}
              {showMembers && (
                <div className="w-60 border-l border-th-border-primary bg-th-bg-primary overflow-y-auto hidden md:block">
                  <div className="px-3 py-3 border-b border-th-border-primary">
                    <h4 className="text-xs font-semibold uppercase text-th-text-tertiary tracking-wider">
                      Members ({members.length})
                    </h4>
                  </div>
                  {membersLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-4 h-4 border-2 border-th-accent-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {members.map((m) => (
                        <div
                          key={m.user_id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded"
                        >
                          <div className="w-6 h-6 rounded-full bg-th-accent-100 dark:bg-th-accent-800 flex items-center justify-center flex-shrink-0">
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-medium text-th-accent-700">
                                {(m.display_name || '?')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-th-text-primary truncate block">
                              {m.display_name}
                            </span>
                          </div>
                          {m.role !== 'member' && (
                            <span className="text-[10px] text-th-accent-600 bg-th-accent-50 rounded px-1">
                              {m.role}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-th-text-tertiary">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">Choose a channel or direct message to start chatting</p>
          </div>
        )}
      </div>

      {/* New DM modal */}
      {showNewDmSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-th-bg-primary rounded-xl shadow-lg w-96 max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
              <h3 className="text-sm font-semibold text-th-text-primary">New Direct Message</h3>
              <button
                onClick={() => {
                  setShowNewDmSearch(false);
                  setDmSearchQuery('');
                }}
                className="text-th-text-tertiary hover:text-th-text-primary"
              >
                &times;
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={dmSearchQuery}
                  onChange={(e) => setDmSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm bg-th-bg-secondary rounded-lg border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-3 max-h-72">
              {/* Show all conversation members from channels that match search */}
              {conversations
                .filter((c) => c.type === 'channel')
                .length > 0 && (
                <p className="text-xs text-th-text-tertiary px-2 py-1">
                  Start typing to find a team member
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
