// ============================================================================
// Entity Header Component
// Unified header for record pages with breadcrumbs and quick actions
// ============================================================================

import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Phone,
  Mail,
  CheckSquare,
  StickyNote,
  Paperclip,
  RefreshCw,
  MoreHorizontal,
  ArrowLeft,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Star,
  StarOff,
  Share2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

export interface EntityHeaderProps {
  // Breadcrumb configuration
  breadcrumbs: Breadcrumb[];

  // Entity information
  entityType: string; // e.g., 'Lead', 'Deal', 'Contact'
  entityName: string;
  entitySubtitle?: string;
  entityIcon?: LucideIcon;
  entityStatus?: {
    label: string;
    color: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'blue';
  };

  // Quick actions
  quickActions?: QuickAction[];
  onCall?: () => void;
  onEmail?: () => void;
  onAddTask?: () => void;
  onAddNote?: () => void;
  onAttach?: () => void;
  onConvert?: () => void;

  // Overflow menu actions
  overflowActions?: QuickAction[];
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;

  // Favorite/star
  isFavorite?: boolean;
  onToggleFavorite?: () => void;

  // Optional refresh
  onRefresh?: () => void;
  isRefreshing?: boolean;

  // Custom content slots
  headerRight?: React.ReactNode;
  belowHeader?: React.ReactNode;
}

// ============================================================================
// Status Badge Component
// ============================================================================

const statusColors = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

function StatusBadge({ label, color }: { label: string; color: keyof typeof statusColors }) {
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[color]}`}>
      {label}
    </span>
  );
}

// ============================================================================
// Quick Action Button Component
// ============================================================================

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  showLabel?: boolean;
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  showLabel = false,
}: QuickActionButtonProps) {
  const variantStyles = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
    primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Icon className="w-4 h-4" />
      {showLabel && <span className="hidden lg:inline">{label}</span>}
    </button>
  );
}

// ============================================================================
// Overflow Menu Component
// ============================================================================

interface OverflowMenuProps {
  actions: QuickAction[];
}

function OverflowMenu({ actions }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="More actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          {actions.map((action) => {
            const Icon = action.icon;
            const variantColors = {
              default: 'text-gray-700 dark:text-gray-300',
              primary: 'text-blue-600 dark:text-blue-400',
              danger: 'text-red-600 dark:text-red-400',
            };
            return (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${variantColors[action.variant || 'default']}
                `}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Entity Header Component
// ============================================================================

export function EntityHeader({
  breadcrumbs,
  entityType,
  entityName,
  entitySubtitle,
  entityIcon: EntityIcon,
  entityStatus,
  quickActions = [],
  onCall,
  onEmail,
  onAddTask,
  onAddNote,
  onAttach,
  onConvert,
  overflowActions = [],
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  isFavorite,
  onToggleFavorite,
  onRefresh,
  isRefreshing,
  headerRight,
  belowHeader,
}: EntityHeaderProps) {
  const navigate = useNavigate();

  // Build default quick actions
  const defaultQuickActions: QuickAction[] = [];
  if (onCall) defaultQuickActions.push({ id: 'call', label: 'Call', icon: Phone, onClick: onCall });
  if (onEmail) defaultQuickActions.push({ id: 'email', label: 'Email', icon: Mail, onClick: onEmail });
  if (onAddTask) defaultQuickActions.push({ id: 'task', label: 'Add Task', icon: CheckSquare, onClick: onAddTask });
  if (onAddNote) defaultQuickActions.push({ id: 'note', label: 'Add Note', icon: StickyNote, onClick: onAddNote });
  if (onAttach) defaultQuickActions.push({ id: 'attach', label: 'Attach File', icon: Paperclip, onClick: onAttach });
  if (onConvert) defaultQuickActions.push({ id: 'convert', label: 'Convert', icon: RefreshCw, onClick: onConvert, variant: 'primary' });

  const allQuickActions = [...defaultQuickActions, ...quickActions];

  // Build default overflow actions
  const defaultOverflowActions: QuickAction[] = [];
  if (onEdit) defaultOverflowActions.push({ id: 'edit', label: 'Edit', icon: Edit2, onClick: onEdit });
  if (onDuplicate) defaultOverflowActions.push({ id: 'duplicate', label: 'Duplicate', icon: Copy, onClick: onDuplicate });
  if (onShare) defaultOverflowActions.push({ id: 'share', label: 'Share', icon: Share2, onClick: onShare });
  if (onDelete) defaultOverflowActions.push({ id: 'delete', label: 'Delete', icon: Trash2, onClick: onDelete, variant: 'danger' });

  const allOverflowActions = [...defaultOverflowActions, ...overflowActions];

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Breadcrumbs */}
      <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800">
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Entity info */}
          <div className="flex items-center gap-4 min-w-0">
            {EntityIcon && (
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <EntityIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {entityType}
                </span>
                {entityStatus && (
                  <StatusBadge label={entityStatus.label} color={entityStatus.color} />
                )}
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate mt-1">
                {entityName}
              </h1>
              {entitySubtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {entitySubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
              </button>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Divider */}
            {(onToggleFavorite || onRefresh) && allQuickActions.length > 0 && (
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            )}

            {/* Quick actions */}
            <div className="hidden sm:flex items-center gap-1">
              {allQuickActions.slice(0, 5).map((action) => (
                <QuickActionButton
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  variant={action.variant}
                  disabled={action.disabled}
                />
              ))}
            </div>

            {/* Header right slot */}
            {headerRight}

            {/* Overflow menu */}
            <OverflowMenu actions={allOverflowActions} />
          </div>
        </div>
      </div>

      {/* Below header slot (for tabs, etc.) */}
      {belowHeader}
    </div>
  );
}

export default EntityHeader;
