import { useState, useRef, useEffect } from 'react';
import { Bookmark, Plus, Star, Trash2, Share2, X, Sparkles } from 'lucide-react';
import type { SavedView } from '@mpbhealth/crm-core';
import type { SmartView } from '../hooks/useSavedViews';

interface SavedViewsBarProps {
  views: SavedView[];
  smartViews?: SmartView[];
  activeViewId: string | null;
  loading: boolean;
  onApplyView: (view: SavedView | SmartView) => void;
  onSaveView: (name: string, isShared: boolean) => Promise<any>;
  onDeleteView: (id: string) => void;
  onSetDefault: (id: string) => void;
  onClearView: () => void;
}

export function SavedViewsBar({
  views,
  smartViews = [],
  activeViewId,
  loading,
  onApplyView,
  onSaveView,
  onDeleteView,
  onSetDefault,
  onClearView,
}: SavedViewsBarProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [menuViewId, setMenuViewId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus name input when form opens
  useEffect(() => {
    if (showForm && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showForm]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuViewId(null);
      }
    }
    if (menuViewId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [menuViewId]);

  const handleSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await onSaveView(trimmed, isShared);
    setNewName('');
    setIsShared(false);
    setShowForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setShowForm(false);
      setNewName('');
    }
  };

  return (
    <div className="flex items-center gap-2 px-1 py-2 overflow-x-auto">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-xs font-medium th-text-secondary shrink-0">
        <Bookmark className="w-3.5 h-3.5" />
        <span>Views</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 th-border bg-current opacity-20 shrink-0" />

      {/* Smart view pills */}
      {smartViews.map((sv) => (
        <button
          key={sv.id}
          onClick={() => onApplyView(sv)}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            transition-colors duration-150 border shrink-0
            ${
              activeViewId === sv.id
                ? 'bg-th-accent-500/10 text-th-accent-700 dark:text-th-accent-400 border-th-accent-500/30'
                : 'surface-primary th-text-secondary th-border hover:th-accent-bg/10'
            }
          `}
        >
          <Sparkles className="w-3 h-3 opacity-60" />
          <span>{sv.name}</span>
        </button>
      ))}

      {smartViews.length > 0 && views.length > 0 && (
        <div className="w-px h-5 th-border bg-current opacity-10 shrink-0" />
      )}

      {/* Custom view pills */}
      {views.map((view) => (
        <div key={view.id} className="relative shrink-0">
          <button
            onClick={() => onApplyView(view)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuViewId(menuViewId === view.id ? null : view.id);
            }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-colors duration-150 border
              ${
                activeViewId === view.id
                  ? 'th-accent-bg th-accent-text border-transparent'
                  : 'surface-primary th-text-primary th-border hover:th-accent-bg/10'
              }
            `}
          >
            {view.is_default && (
              <Star className="w-3 h-3 fill-current opacity-70" />
            )}
            {view.is_shared && <Share2 className="w-3 h-3 opacity-50" />}
            <span>{view.name}</span>
          </button>

          {/* Context menu */}
          {menuViewId === view.id && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 mt-1 z-50 min-w-[140px] surface-primary th-border border rounded-lg shadow-lg py-1"
            >
              <button
                onClick={() => {
                  onSetDefault(view.id);
                  setMenuViewId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs th-text-primary hover:th-accent-bg/10 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Set as Default
              </button>
              <button
                onClick={() => {
                  onDeleteView(view.id);
                  setMenuViewId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Clear active view */}
      {activeViewId && (
        <button
          onClick={onClearView}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs th-text-secondary hover:th-text-primary transition-colors shrink-0"
          title="Clear active view"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Divider before save */}
      {views.length > 0 && (
        <div className="w-px h-5 th-border bg-current opacity-20 shrink-0" />
      )}

      {/* Save view form / button */}
      {showForm ? (
        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={nameInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="View name..."
            className="w-36 px-2.5 py-1.5 text-xs rounded-md th-border border surface-primary th-text-primary placeholder:th-text-secondary focus:outline-none focus:ring-1 focus:th-accent-ring"
          />
          <label className="flex items-center gap-1 text-xs th-text-secondary cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="w-3.5 h-3.5 rounded th-border"
            />
            Shared
          </label>
          <button
            onClick={handleSave}
            disabled={!newName.trim() || loading}
            className="px-3 py-1.5 text-xs font-medium rounded-md th-accent-bg th-accent-text disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setNewName('');
            }}
            aria-label="Cancel save view"
            className="p-1.5 rounded-md th-text-secondary hover:th-text-primary transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium th-text-secondary hover:th-text-primary border th-border border-dashed hover:border-solid transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Save View
        </button>
      )}
    </div>
  );
}
