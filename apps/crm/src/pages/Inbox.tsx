// ============================================================================
// Inbox Page — Enterprise-grade three-pane email client
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Inbox as InboxIcon,
  Send,
  FileEdit,
  Star,
  Archive,
  Mail,
  ChevronDown,
  ChevronRight,
  Loader2,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  MailOpen,
  MailX,
  CheckSquare,
  Square,
  MinusSquare,
  RefreshCw,
  MoreHorizontal,
  ArrowDownToLine,
  X,
  AlertCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { EmailComposerModal } from '../components/email/EmailComposerModal';
import type {
  EnhancedEmailLog,
  EmailDraft,
  InboxFolder,
  InboxStats,
  EnhancedEmailFilters,
} from '@mpbhealth/crm-core';
import { sanitizeHtml } from '@mpbhealth/utils';
import { HelpBanner } from '../components/help';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 25;

const FOLDER_CONFIG: Record<
  InboxFolder,
  { label: string; icon: typeof InboxIcon; countKey: keyof InboxStats }
> = {
  inbox: { label: 'Inbox', icon: InboxIcon, countKey: 'total_inbox' },
  sent: { label: 'Sent', icon: Send, countKey: 'total_sent' },
  drafts: { label: 'Drafts', icon: FileEdit, countKey: 'total_drafts' },
  starred: { label: 'Starred', icon: Star, countKey: 'total_starred' },
  archived: { label: 'Archived', icon: Archive, countKey: 'total_archived' },
  all: { label: 'All Mail', icon: Mail, countKey: 'total_inbox' },
};

// ============================================================================
// Helper utilities
// ============================================================================

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return '??';
}

function avatarColor(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-blue-500',
    'bg-orange-500',
    'bg-blue-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Types
// ============================================================================

/** A unified list item that can be either an email or a draft */
type ListItem =
  | { kind: 'email'; data: EnhancedEmailLog }
  | { kind: 'draft'; data: EmailDraft };

function itemId(item: ListItem): string {
  return item.data.id;
}

// Composer state for reply/forward
interface ComposerState {
  open: boolean;
  mode: 'compose' | 'reply' | 'forward';
  replyToEmailId?: string;
  forwardFromEmailId?: string;
  threadId?: string;
  initialTo?: string[];
  initialSubject?: string;
  initialBody?: string;
  draftId?: string;
}

// ============================================================================
// Folder Sidebar
// ============================================================================

function FolderSidebar({
  activeFolder,
  stats,
  onFolderChange,
  onCompose,
  collapsed,
  onToggleCollapse,
}: {
  activeFolder: InboxFolder;
  stats: InboxStats | null;
  onFolderChange: (f: InboxFolder) => void;
  onCompose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const folders: InboxFolder[] = ['inbox', 'sent', 'drafts', 'starred', 'archived', 'all'];

  return (
    <aside
      className={`shrink-0 border-r border-th-border bg-surface-primary flex flex-col transition-all duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Compose button */}
      <div className="p-3">
        <button
          onClick={onCompose}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-th-accent-600 text-white font-medium text-sm hover:bg-th-accent-700 transition-colors shadow-sm ${
            collapsed ? 'px-0' : 'px-4'
          }`}
          title="Compose"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Compose</span>}
        </button>
      </div>

      {/* Folder list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {folders.map((folder) => {
          const config = FOLDER_CONFIG[folder];
          const Icon = config.icon;
          const count = stats ? stats[config.countKey] : 0;
          const isActive = activeFolder === folder;
          const unread =
            folder === 'inbox' && stats ? stats.unread_count : 0;

          return (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              title={config.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-th-accent-100 text-th-accent-700'
                  : 'text-th-text-secondary hover:bg-surface-secondary'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{config.label}</span>
                  {folder === 'inbox' && unread > 0 ? (
                    <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-th-accent-600 text-white text-[11px] font-bold px-1.5">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  ) : count > 0 ? (
                    <span className="text-xs text-th-text-tertiary">{count}</span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-th-border p-2">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-secondary transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

// ============================================================================
// Email List Toolbar
// ============================================================================

function ListToolbar({
  selectedCount,
  totalCount,
  allSelected,
  someSelected,
  onToggleSelectAll,
  onRefresh,
  onMarkRead,
  onMarkUnread,
  onStar,
  onArchive,
  onDelete,
  refreshing,
}: {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  onRefresh: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-th-border bg-surface-secondary/50">
      {/* Select all checkbox */}
      <button
        onClick={onToggleSelectAll}
        className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
        title={allSelected ? 'Deselect all' : 'Select all'}
      >
        {allSelected ? (
          <CheckSquare className="w-4 h-4 text-th-accent-600" />
        ) : someSelected ? (
          <MinusSquare className="w-4 h-4 text-th-accent-600" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>

      {selectedCount > 0 ? (
        <>
          <span className="text-xs text-th-text-tertiary ml-1 mr-2">
            {selectedCount} selected
          </span>
          <div className="w-px h-4 bg-th-border" />
          <button
            onClick={onMarkRead}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Mark as read"
          >
            <MailOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onMarkUnread}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Mark as unread"
          >
            <MailX className="w-4 h-4" />
          </button>
          <button
            onClick={onStar}
            className="p-1.5 text-th-text-tertiary hover:text-amber-500 hover:bg-surface-secondary rounded transition-colors"
            title="Toggle star"
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={onArchive}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-th-text-tertiary hover:text-red-500 hover:bg-surface-secondary rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors ml-1"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Email List Item
// ============================================================================

function EmailListItem({
  item,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleStar,
  folder,
}: {
  item: ListItem;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  onToggleStar: () => void;
  folder: InboxFolder;
}) {
  const isDraft = item.kind === 'draft';
  const email = item.kind === 'email' ? item.data : null;
  const draft = item.kind === 'draft' ? item.data : null;

  // Display fields
  const displayName = isDraft
    ? (draft!.to_addresses?.[0] || 'No recipient')
    : folder === 'sent'
      ? (email!.to_email || email!.to_addresses?.[0] || 'Unknown')
      : (email!.from_name || email!.from_address || 'Unknown');

  const subject = isDraft
    ? (draft!.subject || '(no subject)')
    : (email!.subject || '(no subject)');

  const preview = isDraft
    ? (draft!.body_html ? stripHtml(draft!.body_html) : '')
    : (email!.body_preview || (email!.body_html ? stripHtml(email!.body_html) : ''));

  const date = isDraft
    ? draft!.updated_at
    : email!.sent_at;

  const isUnread = !isDraft && email && !email.is_read;
  const isStarred = !isDraft && email?.is_starred;
  const hasAttachments = isDraft
    ? (draft!.attachments && draft!.attachments.length > 0)
    : email?.has_attachments;

  const avatarKey = isDraft
    ? (draft!.to_addresses?.[0] || 'draft')
    : (email!.from_address || email!.from_name || 'unknown');

  return (
    <div
      onClick={onSelect}
      className={`group flex items-start gap-3 px-3 py-2.5 cursor-pointer border-b border-th-border/50 transition-colors ${
        isSelected
          ? 'bg-th-accent-50 border-l-2 border-l-th-accent-600'
          : isUnread
            ? 'bg-surface-primary hover:bg-surface-secondary'
            : 'bg-surface-primary/60 hover:bg-surface-secondary'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck();
        }}
        className="pt-0.5 shrink-0 text-th-text-tertiary hover:text-th-accent-600 transition-colors"
      >
        {isChecked ? (
          <CheckSquare className="w-4 h-4 text-th-accent-600" />
        ) : (
          <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className="pt-0.5 shrink-0 transition-colors"
        title="Star"
      >
        <Star
          className={`w-4 h-4 ${
            isStarred
              ? 'fill-amber-400 text-amber-400'
              : 'text-th-text-tertiary opacity-0 group-hover:opacity-100 hover:text-amber-400'
          } transition-all`}
        />
      </button>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${avatarColor(
          avatarKey
        )}`}
      >
        {getInitials(
          isDraft ? null : email!.from_name,
          isDraft ? draft!.to_addresses?.[0] || null : email!.from_address
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm truncate ${
              isUnread ? 'font-semibold text-th-text-primary' : 'text-th-text-secondary'
            }`}
          >
            {isDraft && (
              <span className="text-red-500 mr-1">[Draft]</span>
            )}
            {displayName}
          </span>
          <span className="ml-auto text-[11px] text-th-text-tertiary whitespace-nowrap shrink-0">
            {formatRelativeDate(date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-sm truncate ${
              isUnread ? 'font-medium text-th-text-primary' : 'text-th-text-secondary'
            }`}
          >
            {subject}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-th-text-tertiary truncate flex-1">
            {preview}
          </span>
          {hasAttachments && (
            <Paperclip className="w-3 h-3 text-th-text-tertiary shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Reading Pane — Single Email View
// ============================================================================

function ReadingPane({
  email,
  threadMessages,
  threadLoading,
  onReply,
  onReplyAll,
  onForward,
  onToggleStar,
  onArchive,
  onDelete,
  onClose,
}: {
  email: EnhancedEmailLog;
  threadMessages: EnhancedEmailLog[];
  threadLoading: boolean;
  onReply: (email: EnhancedEmailLog) => void;
  onReplyAll: (email: EnhancedEmailLog) => void;
  onForward: (email: EnhancedEmailLog) => void;
  onToggleStar: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const messages =
    threadMessages.length > 0 ? threadMessages : [email];

  // Track which messages are expanded (latest expanded by default)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const last = messages[messages.length - 1];
    return new Set(last ? [last.id] : []);
  });

  // Update expanded when thread changes
  useEffect(() => {
    const last = messages[messages.length - 1];
    setExpandedIds(new Set(last ? [last.id] : []));
  }, [email.id, threadMessages.length]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isThread = messages.length > 1;

  return (
    <div className="flex flex-col h-full bg-surface-primary">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-th-border bg-surface-secondary/50 shrink-0">
        {/* Mobile back button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors mr-1"
          title="Back to list"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-semibold text-th-text-primary truncate flex-1">
          {email.subject || '(no subject)'}
          {isThread && (
            <span className="ml-2 text-xs font-normal text-th-text-tertiary">
              ({messages.length} messages)
            </span>
          )}
        </h2>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onReply(email)}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReplyAll(email)}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Reply All"
          >
            <ReplyAll className="w-4 h-4" />
          </button>
          <button
            onClick={() => onForward(email)}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Forward"
          >
            <Forward className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-th-border mx-0.5" />
          <button
            onClick={() => onToggleStar(email.id)}
            className="p-1.5 transition-colors rounded hover:bg-surface-secondary"
            title="Star"
          >
            <Star
              className={`w-4 h-4 ${
                email.is_starred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-th-text-tertiary hover:text-amber-400'
              }`}
            />
          </button>
          <button
            onClick={() => onArchive(email.id)}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(email.id)}
            className="p-1.5 text-th-text-tertiary hover:text-red-500 hover:bg-surface-secondary rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {threadLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-th-accent-600" />
          </div>
        ) : (
          <div className="divide-y divide-th-border/50">
            {messages.map((msg) => {
              const expanded = expandedIds.has(msg.id);
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  expanded={expanded}
                  onToggle={() => toggleExpand(msg.id)}
                  isThread={isThread}
                  onReply={onReply}
                  onReplyAll={onReplyAll}
                  onForward={onForward}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Reading Pane — Draft View
// ============================================================================

function DraftReadingPane({
  draft,
  onEdit,
  onDelete,
  onClose,
}: {
  draft: EmailDraft;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-surface-primary">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-th-border bg-surface-secondary/50 shrink-0">
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded transition-colors mr-1"
          title="Back to list"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-th-text-primary truncate flex-1">
          <span className="text-red-500 mr-1">[Draft]</span>
          {draft.subject || '(no subject)'}
        </h2>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
        >
          Edit Draft
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-th-text-tertiary hover:text-red-500 hover:bg-surface-secondary rounded transition-colors"
          title="Delete draft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header info */}
        <div className="space-y-1 mb-4">
          {draft.to_addresses?.length > 0 && (
            <p className="text-sm text-th-text-secondary">
              <span className="font-medium text-th-text-tertiary">To: </span>
              {draft.to_addresses.join(', ')}
            </p>
          )}
          {draft.cc_addresses?.length > 0 && (
            <p className="text-sm text-th-text-secondary">
              <span className="font-medium text-th-text-tertiary">Cc: </span>
              {draft.cc_addresses.join(', ')}
            </p>
          )}
        </div>

        {/* Body */}
        {draft.body_html ? (
          <div
            className="prose prose-sm max-w-none text-th-text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(draft.body_html) }}
          />
        ) : (
          <p className="text-sm text-th-text-tertiary italic">No content</p>
        )}

        {/* Attachments */}
        {draft.attachments && draft.attachments.length > 0 && (
          <div className="mt-6 border-t border-th-border pt-4">
            <p className="text-xs font-medium text-th-text-tertiary mb-2">
              Attachments ({draft.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-xs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-th-text-tertiary" />
                  <span className="text-th-text-secondary">{att.file_name}</span>
                  <span className="text-th-text-tertiary">
                    ({(att.file_size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Individual Message (within thread or standalone)
// ============================================================================

function MessageItem({
  message,
  expanded,
  onToggle,
  isThread,
  onReply,
  onReplyAll,
  onForward,
}: {
  message: EnhancedEmailLog;
  expanded: boolean;
  onToggle: () => void;
  isThread: boolean;
  onReply: (email: EnhancedEmailLog) => void;
  onReplyAll: (email: EnhancedEmailLog) => void;
  onForward: (email: EnhancedEmailLog) => void;
}) {
  const isOutbound = message.direction === 'outbound';
  const senderName = message.from_name || message.from_address || 'Unknown';

  return (
    <div className="group">
      {/* Collapsible header (only clickable as toggle in thread view) */}
      <div
        onClick={isThread ? onToggle : undefined}
        className={`flex items-start gap-3 px-6 py-4 ${
          isThread ? 'cursor-pointer hover:bg-surface-secondary/50' : ''
        } ${!expanded && isThread ? '' : ''}`}
      >
        {/* Direction + Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${avatarColor(
              message.from_address || ''
            )}`}
          >
            {getInitials(message.from_name, message.from_address)}
          </div>
          {isOutbound && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-th-accent-600 flex items-center justify-center">
              <Send className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Sender + metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-th-text-primary truncate">
              {senderName}
              {isOutbound && (
                <span className="ml-1.5 text-[10px] font-medium text-th-accent-600 bg-th-accent-100 px-1.5 py-0.5 rounded">
                  Sent
                </span>
              )}
            </span>
            <span className="ml-auto text-[11px] text-th-text-tertiary whitespace-nowrap">
              {formatFullDate(message.sent_at)}
            </span>
            {isThread && (
              <ChevronDown
                className={`w-4 h-4 text-th-text-tertiary transition-transform ${
                  expanded ? '' : '-rotate-90'
                }`}
              />
            )}
          </div>
          {!expanded && isThread && (
            <p className="text-xs text-th-text-tertiary truncate mt-0.5">
              {message.body_preview || (message.body_html ? stripHtml(message.body_html).substring(0, 120) : '')}
            </p>
          )}
          {(expanded || !isThread) && (
            <div className="text-xs text-th-text-tertiary mt-0.5 space-y-0.5">
              <p>
                <span className="font-medium">To: </span>
                {message.to_addresses?.length
                  ? message.to_addresses.join(', ')
                  : message.to_email}
              </p>
              {message.cc_addresses?.length > 0 && (
                <p>
                  <span className="font-medium">Cc: </span>
                  {message.cc_addresses.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body (expanded) */}
      {(expanded || !isThread) && (
        <div className="px-6 pb-4">
          {/* HTML body */}
          {message.body_html ? (
            <div
              className="prose prose-sm max-w-none text-th-text-primary [&_a]:text-th-accent-600 [&_img]:max-w-full [&_img]:h-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.body_html) }}
            />
          ) : (
            <p className="text-sm text-th-text-tertiary italic whitespace-pre-wrap">
              {message.body_preview || 'No content'}
            </p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-4 border-t border-th-border/50 pt-3">
              <p className="text-xs font-medium text-th-text-tertiary mb-2">
                <Paperclip className="w-3 h-3 inline mr-1" />
                {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.public_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-xs hover:bg-surface-secondary/80 transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-th-text-tertiary" />
                    <span className="text-th-text-secondary">{att.file_name}</span>
                    <span className="text-th-text-tertiary">
                      ({(att.file_size / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quick reply actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onReply(message)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
            <button
              onClick={() => onReplyAll(message)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <ReplyAll className="w-3.5 h-3.5" />
              Reply All
            </button>
            <button
              onClick={() => onForward(message)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <Forward className="w-3.5 h-3.5" />
              Forward
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({
  folder,
  hasSearch,
}: {
  folder: InboxFolder;
  hasSearch: boolean;
}) {
  const Icon = FOLDER_CONFIG[folder].icon;

  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <Search className="w-12 h-12 text-th-text-tertiary/40 mb-4" />
        <p className="text-sm font-medium text-th-text-secondary">No results found</p>
        <p className="text-xs text-th-text-tertiary mt-1">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  const messages: Record<InboxFolder, { title: string; sub: string }> = {
    inbox: { title: 'Your inbox is empty', sub: 'New emails will appear here' },
    sent: { title: 'No sent emails', sub: 'Emails you send will appear here' },
    drafts: { title: 'No drafts', sub: 'Saved drafts will appear here' },
    starred: { title: 'No starred emails', sub: 'Star important emails to find them here' },
    archived: { title: 'No archived emails', sub: 'Archived emails will appear here' },
    all: { title: 'No emails yet', sub: 'Your email activity will appear here' },
  };

  const msg = messages[folder];

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-th-text-tertiary/50" />
      </div>
      <p className="text-sm font-medium text-th-text-secondary">{msg.title}</p>
      <p className="text-xs text-th-text-tertiary mt-1">{msg.sub}</p>
    </div>
  );
}

// ============================================================================
// No Selection Placeholder
// ============================================================================

function NoSelectionPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-20 h-20 rounded-full bg-surface-secondary flex items-center justify-center mb-5">
        <Mail className="w-10 h-10 text-th-text-tertiary/40" />
      </div>
      <p className="text-base font-medium text-th-text-secondary">
        Select an email to read
      </p>
      <p className="text-sm text-th-text-tertiary mt-1 max-w-xs">
        Choose an email from the list to view its contents here
      </p>
    </div>
  );
}

// ============================================================================
// Main Inbox Component
// ============================================================================

export default function Inbox() {
  const { composerService, draftService, supabase: sb } = useCRM();
  const { activeOrgId } = useOrg();

  // ---- State ----
  const [folder, setFolder] = useState<InboxFolder>('inbox');
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EnhancedEmailLog | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Thread view
  const [threadMessages, setThreadMessages] = useState<EnhancedEmailLog[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Composer
  const [composer, setComposer] = useState<ComposerState>({
    open: false,
    mode: 'compose',
  });

  // UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showReadingPane, setShowReadingPane] = useState(false); // for mobile

  // Refs
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ---- Debounced search ----
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchDebounced(search);
      setPage(0);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // ---- Load inbox stats ----
  const loadStats = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const s = await composerService.getInboxStats(activeOrgId);
      setStats(s);
    } catch (err) {
      console.error('Failed to load inbox stats:', err);
    }
  }, [activeOrgId, composerService]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ---- Build filters from folder + search ----
  const buildFilters = useCallback((): EnhancedEmailFilters => {
    const filters: EnhancedEmailFilters = {};
    if (searchDebounced) filters.search = searchDebounced;

    switch (folder) {
      case 'inbox':
        filters.direction = 'inbound';
        filters.is_archived = false;
        break;
      case 'sent':
        filters.direction = 'outbound';
        break;
      case 'starred':
        filters.is_starred = true;
        break;
      case 'archived':
        filters.is_archived = true;
        break;
      case 'all':
        // no extra filters
        break;
      // 'drafts' handled separately
    }

    return filters;
  }, [folder, searchDebounced]);

  // ---- Load emails / drafts ----
  const loadItems = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);

    try {
      if (folder === 'drafts') {
        const drafts = await draftService.getUserDrafts(activeOrgId);
        const filtered = searchDebounced
          ? drafts.filter(
              (d) =>
                d.subject?.toLowerCase().includes(searchDebounced.toLowerCase()) ||
                d.to_addresses?.some((a) =>
                  a.toLowerCase().includes(searchDebounced.toLowerCase())
                )
            )
          : drafts;
        setItems(filtered.map((d) => ({ kind: 'draft' as const, data: d })));
        setTotal(filtered.length);
      } else {
        const filters = buildFilters();
        const { data, total: t } = await composerService.queryEmails(filters, {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });
        setItems(data.map((e) => ({ kind: 'email' as const, data: e })));
        setTotal(t);
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, folder, page, searchDebounced, buildFilters, composerService, draftService]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ---- Real-time updates ----
  useEffect(() => {
    if (!activeOrgId) return;

    const channel = sb
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_email_log',
          filter: `direction=eq.inbound`,
        },
        () => {
          // Refresh inbox list and stats on new inbound email
          if (folder === 'inbox' || folder === 'all') {
            loadItems();
          }
          loadStats();
          toast('New email received', { icon: '📧' });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crm_email_log',
        },
        () => {
          // Refresh on updates (read status, stars, archives)
          loadItems();
          loadStats();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [activeOrgId, sb, folder, loadItems, loadStats]);

  // ---- Clear selection on folder/search change ----
  useEffect(() => {
    setSelectedId(null);
    setSelectedEmail(null);
    setSelectedDraft(null);
    setCheckedIds(new Set());
    setThreadMessages([]);
    setShowReadingPane(false);
  }, [folder, searchDebounced]);

  // ---- Select an item ----
  const handleSelectItem = useCallback(
    async (item: ListItem) => {
      const id = itemId(item);
      setSelectedId(id);
      setShowReadingPane(true);

      if (item.kind === 'draft') {
        setSelectedDraft(item.data);
        setSelectedEmail(null);
        setThreadMessages([]);
        return;
      }

      const email = item.data;
      setSelectedEmail(email);
      setSelectedDraft(null);

      // Mark as read
      if (!email.is_read) {
        sb.from('crm_email_log')
          .update({ is_read: true })
          .eq('id', email.id)
          .then(() => {
            // Update local state
            setItems((prev) =>
              prev.map((i) =>
                i.kind === 'email' && i.data.id === email.id
                  ? { ...i, data: { ...i.data, is_read: true } }
                  : i
              )
            );
            loadStats();
          });
      }

      // Load thread if applicable
      if (email.thread_id) {
        setThreadLoading(true);
        try {
          const msgs = await composerService.getThreadMessages(email.thread_id);
          setThreadMessages(msgs);
        } catch {
          setThreadMessages([]);
        } finally {
          setThreadLoading(false);
        }
      } else {
        setThreadMessages([]);
      }
    },
    [sb, composerService, loadStats]
  );

  // ---- Bulk actions ----
  const handleToggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(items.map(itemId)));
    }
  }, [checkedIds, items]);

  const handleBulkMarkRead = useCallback(async () => {
    const ids = Array.from(checkedIds);
    try {
      await sb
        .from('crm_email_log')
        .update({ is_read: true })
        .in('id', ids);
      toast.success(`Marked ${ids.length} as read`);
      setCheckedIds(new Set());
      loadItems();
      loadStats();
    } catch {
      toast.error('Failed to mark as read');
    }
  }, [checkedIds, sb, loadItems, loadStats]);

  const handleBulkMarkUnread = useCallback(async () => {
    const ids = Array.from(checkedIds);
    try {
      await sb
        .from('crm_email_log')
        .update({ is_read: false })
        .in('id', ids);
      toast.success(`Marked ${ids.length} as unread`);
      setCheckedIds(new Set());
      loadItems();
      loadStats();
    } catch {
      toast.error('Failed to mark as unread');
    }
  }, [checkedIds, sb, loadItems, loadStats]);

  const handleBulkStar = useCallback(async () => {
    const ids = Array.from(checkedIds);
    try {
      await sb
        .from('crm_email_log')
        .update({ is_starred: true })
        .in('id', ids);
      toast.success(`Starred ${ids.length} emails`);
      setCheckedIds(new Set());
      loadItems();
      loadStats();
    } catch {
      toast.error('Failed to star emails');
    }
  }, [checkedIds, sb, loadItems, loadStats]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(checkedIds);
    try {
      await sb
        .from('crm_email_log')
        .update({ is_archived: true })
        .in('id', ids);
      toast.success(`Archived ${ids.length} emails`);
      setCheckedIds(new Set());
      setSelectedId(null);
      setSelectedEmail(null);
      loadItems();
      loadStats();
    } catch {
      toast.error('Failed to archive emails');
    }
  }, [checkedIds, sb, loadItems, loadStats]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(checkedIds);
    if (!window.confirm(`Delete ${ids.length} email(s)? This cannot be undone.`)) return;
    try {
      await sb.from('crm_email_log').delete().in('id', ids);
      toast.success(`Deleted ${ids.length} emails`);
      setCheckedIds(new Set());
      if (selectedId && ids.includes(selectedId)) {
        setSelectedId(null);
        setSelectedEmail(null);
      }
      loadItems();
      loadStats();
    } catch {
      toast.error('Failed to delete emails');
    }
  }, [checkedIds, sb, selectedId, loadItems, loadStats]);

  // ---- Single-item actions ----
  const handleToggleStar = useCallback(
    async (id: string) => {
      try {
        await composerService.toggleEmailStar(id);
        // Update local
        setItems((prev) =>
          prev.map((i) =>
            i.kind === 'email' && i.data.id === id
              ? { ...i, data: { ...i.data, is_starred: !i.data.is_starred } }
              : i
          )
        );
        if (selectedEmail?.id === id) {
          setSelectedEmail((prev) =>
            prev ? { ...prev, is_starred: !prev.is_starred } : prev
          );
        }
        loadStats();
      } catch {
        toast.error('Failed to toggle star');
      }
    },
    [composerService, selectedEmail, loadStats]
  );

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await composerService.toggleEmailArchive(id);
        toast.success('Email archived');
        if (selectedId === id) {
          setSelectedId(null);
          setSelectedEmail(null);
          setShowReadingPane(false);
        }
        loadItems();
        loadStats();
      } catch {
        toast.error('Failed to archive');
      }
    },
    [composerService, selectedId, loadItems, loadStats]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this email? This cannot be undone.')) return;
      try {
        await sb.from('crm_email_log').delete().eq('id', id);
        toast.success('Email deleted');
        if (selectedId === id) {
          setSelectedId(null);
          setSelectedEmail(null);
          setShowReadingPane(false);
        }
        loadItems();
        loadStats();
      } catch {
        toast.error('Failed to delete');
      }
    },
    [sb, selectedId, loadItems, loadStats]
  );

  const handleDeleteDraft = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this draft?')) return;
      try {
        await draftService.deleteDraft(id);
        toast.success('Draft deleted');
        setSelectedId(null);
        setSelectedDraft(null);
        setShowReadingPane(false);
        loadItems();
        loadStats();
      } catch {
        toast.error('Failed to delete draft');
      }
    },
    [draftService, loadItems, loadStats]
  );

  // ---- Composer handlers ----
  const openCompose = useCallback(() => {
    setComposer({ open: true, mode: 'compose' });
  }, []);

  const openReply = useCallback((email: EnhancedEmailLog) => {
    setComposer({
      open: true,
      mode: 'reply',
      replyToEmailId: email.id,
      threadId: email.thread_id || undefined,
      initialTo: email.direction === 'inbound' ? [email.from_address || ''] : [email.to_email || ''],
      initialSubject: `Re: ${(email.subject || '').replace(/^Re:\s*/i, '')}`,
    });
  }, []);

  const openReplyAll = useCallback((email: EnhancedEmailLog) => {
    const allRecipients = [
      ...(email.direction === 'inbound' ? [email.from_address || ''] : []),
      ...(email.to_addresses || []),
      ...(email.cc_addresses || []),
    ].filter(Boolean);
    // Remove duplicates
    const unique = [...new Set(allRecipients)];

    setComposer({
      open: true,
      mode: 'reply',
      replyToEmailId: email.id,
      threadId: email.thread_id || undefined,
      initialTo: unique,
      initialSubject: `Re: ${(email.subject || '').replace(/^Re:\s*/i, '')}`,
    });
  }, []);

  const openForward = useCallback((email: EnhancedEmailLog) => {
    setComposer({
      open: true,
      mode: 'forward',
      forwardFromEmailId: email.id,
      threadId: email.thread_id || undefined,
      initialSubject: `Fwd: ${(email.subject || '').replace(/^Fwd:\s*/i, '')}`,
      initialBody: email.body_html || '',
    });
  }, []);

  const openDraftInComposer = useCallback((draft: EmailDraft) => {
    setComposer({
      open: true,
      mode: 'compose',
      draftId: draft.id,
      threadId: draft.thread_id || undefined,
      initialTo: draft.to_addresses || [],
      initialSubject: draft.subject || '',
      initialBody: draft.body_html || '',
    });
  }, []);

  const closeComposer = useCallback(() => {
    setComposer({ open: false, mode: 'compose' });
  }, []);

  const handleComposerSent = useCallback(() => {
    closeComposer();
    loadItems();
    loadStats();
  }, [closeComposer, loadItems, loadStats]);

  // ---- Refresh ----
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadItems(), loadStats()]);
    setRefreshing(false);
  }, [loadItems, loadStats]);

  // ---- Pagination ----
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  // ---- Render ----
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-primary overflow-hidden">
      <HelpBanner
        pageKey="email-inbox"
        title="Welcome to Your Inbox"
        tip="Manage all your CRM emails in one place. Compose new messages, reply to conversations, and use templates for quick responses. Connect your email account in Settings for full sync."
      />
      <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <FolderSidebar
        activeFolder={folder}
        stats={stats}
        onFolderChange={(f) => {
          setFolder(f);
          setPage(0);
        }}
        onCompose={openCompose}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Middle Pane — Email List */}
      <div
        className={`flex flex-col border-r border-th-border bg-surface-primary transition-all ${
          showReadingPane ? 'hidden lg:flex' : 'flex'
        } flex-1 lg:flex-none lg:w-[380px] xl:w-[420px] min-w-0`}
      >
        {/* Search bar */}
        <div className="px-3 py-2.5 border-b border-th-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${FOLDER_CONFIG[folder].label.toLowerCase()}...`}
              className="w-full pl-9 pr-8 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-th-text-tertiary hover:text-th-text-secondary rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk actions toolbar */}
        <ListToolbar
          selectedCount={checkedIds.size}
          totalCount={items.length}
          allSelected={items.length > 0 && checkedIds.size === items.length}
          someSelected={checkedIds.size > 0 && checkedIds.size < items.length}
          onToggleSelectAll={handleToggleSelectAll}
          onRefresh={handleRefresh}
          onMarkRead={handleBulkMarkRead}
          onMarkUnread={handleBulkMarkUnread}
          onStar={handleBulkStar}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          refreshing={refreshing}
        />

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState folder={folder} hasSearch={!!searchDebounced} />
          ) : (
            items.map((item) => (
              <EmailListItem
                key={itemId(item)}
                item={item}
                isSelected={selectedId === itemId(item)}
                isChecked={checkedIds.has(itemId(item))}
                onSelect={() => handleSelectItem(item)}
                onToggleCheck={() => handleToggleCheck(itemId(item))}
                onToggleStar={() => {
                  if (item.kind === 'email') handleToggleStar(item.data.id);
                }}
                folder={folder}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {folder !== 'drafts' && totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-th-border bg-surface-secondary/50 text-xs text-th-text-tertiary">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                className="p-1 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="p-1 rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane — Reading Pane */}
      <div
        className={`flex-1 min-w-0 ${
          showReadingPane ? 'flex' : 'hidden lg:flex'
        } flex-col`}
      >
        {selectedEmail ? (
          <ReadingPane
            email={selectedEmail}
            threadMessages={threadMessages}
            threadLoading={threadLoading}
            onReply={openReply}
            onReplyAll={openReplyAll}
            onForward={openForward}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onClose={() => {
              setShowReadingPane(false);
              setSelectedId(null);
              setSelectedEmail(null);
            }}
          />
        ) : selectedDraft ? (
          <DraftReadingPane
            draft={selectedDraft}
            onEdit={() => openDraftInComposer(selectedDraft)}
            onDelete={() => handleDeleteDraft(selectedDraft.id)}
            onClose={() => {
              setShowReadingPane(false);
              setSelectedId(null);
              setSelectedDraft(null);
            }}
          />
        ) : (
          <NoSelectionPlaceholder />
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposerModal
        open={composer.open}
        onClose={closeComposer}
        mode={composer.mode}
        draftId={composer.draftId}
        replyToEmailId={composer.replyToEmailId}
        forwardFromEmailId={composer.forwardFromEmailId}
        threadId={composer.threadId}
        initialTo={composer.initialTo}
        initialSubject={composer.initialSubject}
        initialBody={composer.initialBody}
        onSent={handleComposerSent}
        onSaved={() => {
          loadItems();
          loadStats();
        }}
      />
      </div>
    </div>
  );
}
