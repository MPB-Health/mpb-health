// ============================================================================
// Connected Inbox - Multi-account unified inbox with dynamic folders
// Three-pane layout: folders | message list | reading pane
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Inbox, Send, File, Star, Archive, Trash2, AlertTriangle,
  RefreshCw, Search, MailOpen, Mail, Flag, Reply, ReplyAll,
  Forward, MoreHorizontal, ChevronDown, Paperclip, Clock,
  CheckCheck, Eye, Folder, Tag, X, Maximize2, Minimize2,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type {
  MailAccount, MailFolder, MailMessage,
  MailMessageFilters, UnifiedInboxStats,
} from '@mpbhealth/crm-core';
import toast from 'react-hot-toast';

// ============================================================================
// Folder icon mapping
// ============================================================================

const FOLDER_ICONS: Record<string, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: File,
  trash: Trash2,
  junk: AlertTriangle,
  starred: Star,
  archive: Archive,
  important: Flag,
  custom: Folder,
};

const FOLDER_ORDER = ['inbox', 'starred', 'sent', 'drafts', 'archive', 'junk', 'trash'];

// ============================================================================
// Component
// ============================================================================

export default function ConnectedInbox() {
  const { mailAccountService, mailSyncService } = useCRM();
  const { activeOrgId } = useOrg();

  // State
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderType, setSelectedFolderType] = useState<string>('inbox');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [messageBody, setMessageBody] = useState<string>('');
  const [stats, setStats] = useState<UnifiedInboxStats | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [readingPaneExpanded, setReadingPaneExpanded] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // Data Loading
  // ========================================================================

  const loadAccounts = useCallback(async () => {
    if (!activeOrgId) return;
    const data = await mailAccountService.getAccounts(activeOrgId);
    setAccounts(data);
    return data;
  }, [mailAccountService, activeOrgId]);

  const loadFolders = useCallback(async (accountIds: string[]) => {
    const allFolders: MailFolder[] = [];
    for (const id of accountIds) {
      const f = await mailAccountService.getFolders(id);
      allFolders.push(...f);
    }
    setFolders(allFolders);
    return allFolders;
  }, [mailAccountService]);

  const loadMessages = useCallback(async (filters: MailMessageFilters = {}) => {
    setLoadingMessages(true);
    try {
      const accountIds = selectedAccountId === 'all'
        ? accounts.map(a => a.id)
        : [selectedAccountId];

      const result = await mailSyncService.getMessages(
        {
          account_ids: accountIds,
          folder_id: selectedFolderId || undefined,
          search: searchQuery || undefined,
          ...filters,
        },
        { page, per_page: 25 }
      );

      setMessages(result.messages);
      setTotalMessages(result.total);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [mailSyncService, accounts, selectedAccountId, selectedFolderId, searchQuery, page]);

  const loadStats = useCallback(async (accountIds: string[]) => {
    if (!accountIds.length) return;
    const data = await mailSyncService.getUnifiedStats(accountIds);
    setStats(data);
  }, [mailSyncService]);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      const accts = await loadAccounts();
      if (accts && accts.length > 0) {
        const ids = accts.map(a => a.id);
        await Promise.all([loadFolders(ids), loadStats(ids)]);
      }
      setLoading(false);
    })();
  }, [loadAccounts, loadFolders, loadStats]);

  // Load messages when filters change
  useEffect(() => {
    if (!loading && accounts.length > 0) {
      loadMessages();
    }
  }, [loadMessages, loading, accounts.length, selectedFolderType, selectedFolderId, page]);

  // ========================================================================
  // Actions
  // ========================================================================

  const handleSync = async () => {
    setSyncing(true);
    try {
      const accountIds = selectedAccountId === 'all'
        ? accounts.map(a => a.id)
        : [selectedAccountId];

      for (const id of accountIds) {
        await mailSyncService.triggerSync(id);
      }
      toast.success('Sync complete');
      await loadMessages();
      await loadStats(accountIds);
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectMessage = async (msg: MailMessage) => {
    setSelectedMessage(msg);
    setMessageBody('');

    // Mark as read
    if (!msg.is_read) {
      await mailSyncService.markRead(msg.account_id, msg.id, true);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }

    // Fetch body if not cached
    if (!msg.body_fetched || !msg.body_html) {
      setLoadingBody(true);
      try {
        const { body_html } = await mailSyncService.fetchMessageBody(msg.account_id, msg.id);
        setMessageBody(body_html);
      } catch {
        setMessageBody('<p>Failed to load message body</p>');
      } finally {
        setLoadingBody(false);
      }
    } else {
      setMessageBody(msg.body_html || '');
    }
  };

  const handleToggleFlag = async (msg: MailMessage) => {
    const newValue = !msg.is_flagged;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_flagged: newValue } : m));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(prev => prev ? { ...prev, is_flagged: newValue } : null);
    }
    await mailSyncService.toggleFlag(msg.account_id, msg.id, newValue);
  };

  const handleDelete = async (msg: MailMessage) => {
    await mailSyncService.deleteMessage(msg.account_id, msg.id);
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(null);
    }
    toast.success('Moved to trash');
  };

  const handleFolderClick = (folderType: string, folderId?: string) => {
    setSelectedFolderType(folderType);
    setSelectedFolderId(folderId || null);
    setSelectedMessage(null);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMessages();
  };

  // ========================================================================
  // Computed
  // ========================================================================

  // Deduplicate folders by type for the sidebar
  const foldersByType = new Map<string, { type: string; unread: number; total: number; ids: string[] }>();
  for (const f of folders) {
    const type = f.folder_type || 'custom';
    const existing = foldersByType.get(type);
    if (existing) {
      existing.unread += f.unread_count;
      existing.total += f.total_count;
      existing.ids.push(f.id);
    } else {
      foldersByType.set(type, {
        type,
        unread: f.unread_count,
        total: f.total_count,
        ids: [f.id],
      });
    }
  }

  const sortedFolderTypes = Array.from(foldersByType.values()).sort((a, b) => {
    const ai = FOLDER_ORDER.indexOf(a.type);
    const bi = FOLDER_ORDER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Custom folders
  const customFolders = folders.filter(f => f.folder_type === 'custom' || !f.folder_type);

  // ========================================================================
  // Render
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <Inbox className="w-16 h-16 text-th-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-th-text-primary mb-2">No mail accounts connected</h2>
          <p className="text-sm text-th-text-secondary mb-6">
            Connect your Microsoft 365 or Gmail account to see your emails here
          </p>
          <a
            href="/email/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
          >
            Connect Account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* ================================================================ */}
      {/* Folder Sidebar */}
      {/* ================================================================ */}
      <div className="w-56 border-r border-neutral-200 flex flex-col bg-neutral-50/50">
        {/* Account Selector */}
        <div className="p-3 border-b border-neutral-200">
          <select
            value={selectedAccountId}
            onChange={e => {
              setSelectedAccountId(e.target.value);
              setPage(1);
              setSelectedMessage(null);
            }}
            className="w-full text-sm px-2 py-1.5 border border-neutral-200 rounded-lg bg-white"
          >
            <option value="all">All Accounts ({accounts.length})</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.email_address}</option>
            ))}
          </select>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto py-2">
          {sortedFolderTypes.map(folder => {
            const Icon = FOLDER_ICONS[folder.type] || Folder;
            const isActive = selectedFolderType === folder.type;
            const displayName = folder.type.charAt(0).toUpperCase() + folder.type.slice(1);

            return (
              <button
                key={folder.type}
                onClick={() => handleFolderClick(folder.type)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-th-accent-50 text-th-accent-700 font-medium'
                    : 'text-th-text-secondary hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{displayName}</span>
                </div>
                {folder.unread > 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-th-accent-600 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {folder.unread}
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom folders */}
          {customFolders.length > 0 && (
            <>
              <div className="px-4 py-2 mt-2">
                <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Labels</span>
              </div>
              {customFolders.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleFolderClick('custom', f.id)}
                  className={`w-full flex items-center justify-between px-4 py-1.5 text-sm transition-colors ${
                    selectedFolderId === f.id
                      ? 'bg-th-accent-50 text-th-accent-700 font-medium'
                      : 'text-th-text-secondary hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {f.label_color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: f.label_color }}
                      />
                    )}
                    <Tag className="w-3.5 h-3.5" />
                    <span className="truncate">{f.display_name || f.name}</span>
                  </div>
                  {f.unread_count > 0 && (
                    <span className="text-xs text-neutral-500">{f.unread_count}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Unread summary */}
        {stats && (
          <div className="p-3 border-t border-neutral-200 text-xs text-th-text-tertiary">
            {stats.total_unread} unread &middot; {stats.total_flagged} flagged
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Message List */}
      {/* ================================================================ */}
      <div className={`flex flex-col border-r border-neutral-200 ${
        readingPaneExpanded ? 'w-0 hidden' : selectedMessage ? 'w-96' : 'flex-1'
      }`}>
        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2 p-3 border-b border-neutral-200">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg"
            />
          </form>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 rounded-lg"
            title="Sync"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Message List */}
        <div ref={messageListRef} className="flex-1 overflow-y-auto">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-th-text-tertiary">
              <MailOpen className="w-10 h-10 mb-2" />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            messages.map(msg => {
              const isSelected = selectedMessage?.id === msg.id;
              const account = accounts.find(a => a.id === msg.account_id);

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`px-4 py-3 border-b border-neutral-100 cursor-pointer transition-colors ${
                    isSelected ? 'bg-th-accent-50' : msg.is_read ? 'bg-white hover:bg-neutral-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="mt-2 flex-shrink-0">
                      {!msg.is_read ? (
                        <div className="w-2 h-2 rounded-full bg-th-accent-600" />
                      ) : (
                        <div className="w-2 h-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* From + date */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!msg.is_read ? 'font-semibold text-th-text-primary' : 'text-th-text-secondary'}`}>
                          {msg.from_name || msg.from_address || 'Unknown'}
                        </span>
                        <span className="text-xs text-th-text-tertiary flex-shrink-0">
                          {msg.received_at ? formatDate(msg.received_at) : ''}
                        </span>
                      </div>

                      {/* Subject */}
                      <div className={`text-sm truncate ${!msg.is_read ? 'font-medium text-th-text-primary' : 'text-th-text-secondary'}`}>
                        {msg.subject || '(no subject)'}
                      </div>

                      {/* Snippet + icons */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-th-text-tertiary truncate flex-1">
                          {msg.snippet}
                        </span>
                        {msg.has_attachments && (
                          <Paperclip className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        )}
                        {msg.is_flagged && (
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        )}
                        {msg.importance === 'high' && (
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Account badge (when viewing all) */}
                      {selectedAccountId === 'all' && account && (
                        <span className="inline-block mt-1 text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                          {account.email_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalMessages > 25 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-200 text-xs text-th-text-tertiary">
            <span>
              {(page - 1) * 25 + 1}-{Math.min(page * 25, totalMessages)} of {totalMessages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 hover:bg-neutral-100 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 25 >= totalMessages}
                className="px-2 py-1 hover:bg-neutral-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Reading Pane */}
      {/* ================================================================ */}
      {selectedMessage && (
        <div className={`flex flex-col ${readingPaneExpanded ? 'flex-1' : 'flex-1'} bg-white`}>
          {/* Message Header */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-th-text-primary truncate">
                  {selectedMessage.subject || '(no subject)'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-th-text-primary">
                    {selectedMessage.from_name || selectedMessage.from_address}
                  </span>
                  {selectedMessage.from_name && (
                    <span className="text-xs text-th-text-tertiary">
                      &lt;{selectedMessage.from_address}&gt;
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-th-text-tertiary">
                  <span>
                    To: {(selectedMessage.to_addresses || []).map(a => a.name || a.email).join(', ')}
                  </span>
                  {selectedMessage.received_at && (
                    <>
                      <span>&middot;</span>
                      <span>{new Date(selectedMessage.received_at).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => handleToggleFlag(selectedMessage)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedMessage.is_flagged
                      ? 'text-yellow-500 bg-yellow-50'
                      : 'text-th-text-tertiary hover:text-yellow-500 hover:bg-yellow-50'
                  }`}
                  title={selectedMessage.is_flagged ? 'Unflag' : 'Flag'}
                >
                  <Star className={`w-4 h-4 ${selectedMessage.is_flagged ? 'fill-yellow-400' : ''}`} />
                </button>
                <button
                  onClick={() => handleDelete(selectedMessage)}
                  className="p-2 text-th-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setReadingPaneExpanded(!readingPaneExpanded)}
                  className="p-2 text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 rounded-lg"
                >
                  {readingPaneExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setSelectedMessage(null); setReadingPaneExpanded(false); }}
                  className="p-2 text-th-text-tertiary hover:text-th-text-primary hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attachment bar */}
            {selectedMessage.has_attachments && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-neutral-50 rounded-lg text-xs text-th-text-secondary">
                <Paperclip className="w-3.5 h-3.5" />
                <span>This message has attachments</span>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingBody ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
              </div>
            ) : messageBody ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(messageBody) }}
              />
            ) : (
              <p className="text-sm text-th-text-tertiary italic">No content available</p>
            )}
          </div>

          {/* Quick Reply Bar */}
          <div className="p-3 border-t border-neutral-200 flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-neutral-100 rounded-lg border border-neutral-200">
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-neutral-100 rounded-lg border border-neutral-200">
              <ReplyAll className="w-3.5 h-3.5" />
              Reply All
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-neutral-100 rounded-lg border border-neutral-200">
              <Forward className="w-3.5 h-3.5" />
              Forward
            </button>
          </div>
        </div>
      )}

      {/* No message selected */}
      {!selectedMessage && messages.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-th-text-tertiary">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a message to read</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function sanitizeHtml(html: string): string {
  // Basic sanitization: remove script tags, event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
