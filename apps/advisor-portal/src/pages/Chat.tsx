import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Lock, ArrowLeft, Users, Search, MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@mpbhealth/ui';
import { isAdmin as checkIsAdmin } from '@mpbhealth/auth';
import { useChat, useChatMessages } from '../hooks/useChat';
import { useAdvisor } from '../contexts/AdvisorContext';
import { chatService } from '@mpbhealth/advisor-core';
import type { ChatMember, ChatUserSearchResult } from '@mpbhealth/advisor-core';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageComposer from '../components/chat/MessageComposer';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const { conversations, channels, directMessages, loading: convLoading, error: convError, totalUnread, refresh: refreshConversations } = useChat();
  const { messages, loading: msgLoading, hasMore, sending, loadMore, sendMessage, deleteMessage } =
    useChatMessages(conversationId || null);

  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // DM search state
  const [showNewDmSearch, setShowNewDmSearch] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [dmSearchResults, setDmSearchResults] = useState<ChatUserSearchResult[]>([]);
  const [dmSearchLoading, setDmSearchLoading] = useState(false);
  const [dmCreating, setDmCreating] = useState<string | null>(null);
  const dmSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Channel creation state
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelAnnouncement, setNewChannelAnnouncement] = useState(false);
  const [channelCreating, setChannelCreating] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  const activeConv = conversations.find((c) => c.id === conversationId) || null;

  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin', profile?.user_id],
    queryFn: () => checkIsAdmin(profile!.user_id),
    enabled: !!profile?.user_id,
    staleTime: 5 * 60 * 1000,
  });

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

  // Debounced user search for DM creation
  useEffect(() => {
    if (dmSearchTimerRef.current) {
      clearTimeout(dmSearchTimerRef.current);
    }

    const query = dmSearchQuery.trim();
    if (query.length < 1) {
      setDmSearchResults([]);
      setDmSearchLoading(false);
      return;
    }

    setDmSearchLoading(true);
    dmSearchTimerRef.current = setTimeout(async () => {
      try {
        const results = await chatService.searchUsers(query, { limit: 15 });
        setDmSearchResults(results);
      } catch (err) {
        console.error('[Chat] User search failed:', err);
        setDmSearchResults([]);
      } finally {
        setDmSearchLoading(false);
      }
    }, 300);

    return () => {
      if (dmSearchTimerRef.current) clearTimeout(dmSearchTimerRef.current);
    };
  }, [dmSearchQuery]);

  const handleCreateDM = useCallback(
    async (targetUserId: string) => {
      setDmCreating(targetUserId);
      try {
        const { conversation_id } = await chatService.createDM(targetUserId);
        navigate(`/chat/${conversation_id}`);
        setShowNewDmSearch(false);
        setDmSearchQuery('');
        setDmSearchResults([]);
        refreshConversations();
      } catch (err) {
        console.error('[Chat] Failed to create DM:', err);
      } finally {
        setDmCreating(null);
      }
    },
    [navigate, refreshConversations],
  );

  const handleCreateChannel = useCallback(async () => {
    const name = newChannelName.trim();
    if (!name) return;

    setChannelCreating(true);
    setChannelError(null);
    try {
      const result = await chatService.createChannel({
        name,
        description: newChannelDesc.trim() || undefined,
        is_admin_only_posting: newChannelAnnouncement,
      });
      navigate(`/chat/${result.channel.id}`);
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelAnnouncement(false);
      refreshConversations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create channel';
      setChannelError(msg.includes('slug already exists') ? 'A channel with that name already exists' : msg);
    } finally {
      setChannelCreating(false);
    }
  }, [newChannelName, newChannelDesc, newChannelAnnouncement, navigate, refreshConversations]);

  const isAdminOrOwner =
    activeConv?.my_role === 'admin' || activeConv?.my_role === 'owner';

  const composerDisabled = activeConv?.is_admin_only_posting && !isAdminOrOwner;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-th-bg-primary">
      {/* Left sidebar */}
      <div
        className={`w-72 xl:w-80 flex-shrink-0 border-r border-th-border-primary bg-th-bg-primary ${
          conversationId ? 'hidden lg:flex' : 'flex'
        } flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
          <h2 className="text-base font-semibold text-th-text-primary">Chat</h2>
          <div className="flex items-center gap-1">
            {totalUnread > 0 && (
              <span className="bg-th-accent-600 text-white text-xs font-medium rounded-full px-2 py-0.5">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateChannel(true)}
                className="p-1.5 hover:bg-th-bg-secondary rounded-lg transition-colors"
                title="Create channel"
                aria-label="Create new channel"
              >
                <Plus className="w-4 h-4 text-th-text-secondary" />
              </button>
            )}
          </div>
        </div>
        <ConversationList
          conversations={conversations}
          channels={channels}
          directMessages={directMessages}
          activeId={conversationId || null}
          onSelect={handleSelectConversation}
          onCreateDM={() => setShowNewDmSearch(true)}
          loading={convLoading}
          error={convError}
          onRetry={refreshConversations}
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chat')}
                aria-label="Back to chat list"
                className="lg:hidden min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="w-5 h-5 text-th-text-primary" />
              </Button>

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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMembers}
                  title="Members"
                  aria-label="Show members"
                  className={`min-h-[44px] min-w-[44px] ${showMembers ? 'bg-th-bg-secondary' : ''}`}
                >
                  <Users className="w-4 h-4 text-th-text-secondary" />
                </Button>
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
          <div className="flex-1 flex flex-col items-center justify-center text-th-text-tertiary">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">Choose a channel or direct message to start chatting</p>
          </div>
        )}
      </div>

      {/* New DM modal */}
      {showNewDmSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowNewDmSearch(false); setDmSearchQuery(''); setDmSearchResults([]); }}>
          <div className="bg-th-bg-primary rounded-xl shadow-lg w-[420px] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
              <h3 className="text-sm font-semibold text-th-text-primary">New Direct Message</h3>
              <button
                type="button"
                onClick={() => { setShowNewDmSearch(false); setDmSearchQuery(''); setDmSearchResults([]); }}
                aria-label="Close"
                className="p-1.5 hover:bg-th-bg-secondary rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-th-text-tertiary" />
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
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-th-bg-secondary rounded-lg border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder:text-th-text-tertiary"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-3 max-h-80">
              {dmSearchLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-th-accent-500" />
                </div>
              ) : dmSearchQuery.trim().length > 0 && dmSearchResults.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-th-text-tertiary">No people found</p>
                  <p className="text-xs text-th-text-tertiary mt-1">Try a different name</p>
                </div>
              ) : dmSearchResults.length > 0 ? (
                <div className="space-y-0.5">
                  {dmSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleCreateDM(user.id)}
                      disabled={dmCreating === user.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-th-bg-secondary transition-colors text-left disabled:opacity-60"
                    >
                      <div className="w-9 h-9 rounded-full bg-th-accent-100 dark:bg-th-accent-800 flex items-center justify-center flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-th-accent-700 dark:text-th-accent-200">
                            {(user.first_name || '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-th-text-primary block truncate">
                          {user.display_name}
                        </span>
                      </div>
                      {dmCreating === user.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-th-accent-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Search className="w-8 h-8 text-th-text-tertiary opacity-30 mx-auto mb-2" />
                  <p className="text-sm text-th-text-tertiary">Search for a team member</p>
                  <p className="text-xs text-th-text-tertiary mt-1">Type a name to find someone to message</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Channel modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCreateChannel(false); setChannelError(null); }}>
          <div className="bg-th-bg-primary rounded-xl shadow-lg w-[440px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
              <h3 className="text-sm font-semibold text-th-text-primary">Create Channel</h3>
              <button
                type="button"
                onClick={() => { setShowCreateChannel(false); setChannelError(null); }}
                aria-label="Close"
                className="p-1.5 hover:bg-th-bg-secondary rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-th-text-tertiary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="channel-name" className="block text-xs font-medium text-th-text-secondary mb-1.5">
                  Channel name
                </label>
                <input
                  id="channel-name"
                  type="text"
                  placeholder="e.g. general, announcements"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  autoFocus
                  maxLength={100}
                  className="w-full px-3 py-2.5 text-sm bg-th-bg-secondary rounded-lg border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder:text-th-text-tertiary"
                />
              </div>
              <div>
                <label htmlFor="channel-desc" className="block text-xs font-medium text-th-text-secondary mb-1.5">
                  Description <span className="text-th-text-tertiary">(optional)</span>
                </label>
                <input
                  id="channel-desc"
                  type="text"
                  placeholder="What's this channel about?"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2.5 text-sm bg-th-bg-secondary rounded-lg border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder:text-th-text-tertiary"
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newChannelAnnouncement}
                  onChange={(e) => setNewChannelAnnouncement(e.target.checked)}
                  className="w-4 h-4 rounded border-th-border-primary text-th-accent-600 focus:ring-th-accent-500"
                />
                <div>
                  <span className="text-sm text-th-text-primary">Announcements only</span>
                  <p className="text-xs text-th-text-tertiary">Only admins can post messages</p>
                </div>
              </label>
              {channelError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {channelError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-th-border-primary">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowCreateChannel(false); setChannelError(null); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim() || channelCreating}
              >
                {channelCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Channel'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
