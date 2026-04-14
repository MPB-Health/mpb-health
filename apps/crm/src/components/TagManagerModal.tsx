import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Tag, Plus, X, Search } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface TagManagerModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  selectedCount: number;
  currentTags: string[];
  allKnownTags: string[];
  onApply: (addTags: string[], removeTags: string[]) => Promise<void>;
}

const TAG_COLORS = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
  'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
];

export function TagManagerModal({
  open, onClose, entityType, selectedCount, currentTags, allKnownTags, onApply,
}: TagManagerModalProps) {
  const [tagsToAdd, setTagsToAdd] = useState<Set<string>>(new Set());
  const [tagsToRemove, setTagsToRemove] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState('');
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(false);

  const suggestions = useMemo(() => {
    const all = new Set([...allKnownTags, ...currentTags]);
    const arr = Array.from(all).sort();
    if (!search) return arr;
    return arr.filter((t) => t.toLowerCase().includes(search.toLowerCase()));
  }, [allKnownTags, currentTags, search]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setTagsToAdd((prev) => new Set(prev).add(trimmed));
    setTagsToRemove((prev) => {
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });
    setNewTag('');
  };

  const markForRemoval = (tag: string) => {
    if (currentTags.includes(tag)) {
      setTagsToRemove((prev) => new Set(prev).add(tag));
      setTagsToAdd((prev) => {
        const next = new Set(prev);
        next.delete(tag);
        return next;
      });
    } else {
      setTagsToAdd((prev) => {
        const next = new Set(prev);
        next.delete(tag);
        return next;
      });
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(Array.from(tagsToAdd), Array.from(tagsToRemove));
      onClose();
    } catch {
      // parent handles
    } finally {
      setApplying(false);
    }
  };

  const getTagColor = (tag: string) => TAG_COLORS[Math.abs(tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];

  const effectiveTags = [
    ...currentTags.filter((t) => !tagsToRemove.has(t)),
    ...Array.from(tagsToAdd).filter((t) => !currentTags.includes(t)),
  ];

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const hasChanges = tagsToAdd.size > 0 || tagsToRemove.size > 0;

  return (
    <Modal open={open} onClose={onClose} title="Manage Tags" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-th-accent-500/10 border border-th-accent-500/20">
          <Tag className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-xs text-th-accent-600 dark:text-th-accent-400">
            {selectedCount > 1
              ? `Manage tags for ${selectedCount} ${entityLabel.toLowerCase()}s`
              : `Manage tags for this ${entityLabel.toLowerCase()}`}
          </p>
        </div>

        {/* Current + pending tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-th-text-secondary">Active Tags</label>
          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            {effectiveTags.length === 0 ? (
              <span className="text-xs text-th-text-tertiary italic">No tags</span>
            ) : (
              effectiveTags.map((tag) => {
                const isNew = tagsToAdd.has(tag) && !currentTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                      getTagColor(tag),
                      isNew && 'ring-1 ring-green-500/40'
                    )}
                  >
                    {tag}
                    <button onClick={() => markForRemoval(tag)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Add new tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag); } }}
            placeholder="Type a new tag..."
            className="flex-1 text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
          />
          <button
            onClick={() => addTag(newTag)}
            disabled={!newTag.trim()}
            className="px-3 py-2 rounded-lg gradient-accent text-white text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Existing tags to pick from */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-th-text-secondary">Available Tags</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-th-border/50 bg-surface-secondary focus:border-th-accent-500/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
            {suggestions.map((tag) => {
              const isActive = effectiveTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => isActive ? markForRemoval(tag) : addTag(tag)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium border transition-all',
                    isActive ? getTagColor(tag) : 'border-th-border/50 text-th-text-tertiary hover:border-th-border hover:text-th-text-secondary'
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {hasChanges && (
          <div className="text-xs text-th-text-tertiary">
            {tagsToAdd.size > 0 && <span className="text-green-600 dark:text-green-400">+{tagsToAdd.size} to add</span>}
            {tagsToAdd.size > 0 && tagsToRemove.size > 0 && <span> · </span>}
            {tagsToRemove.size > 0 && <span className="text-red-600 dark:text-red-400">-{tagsToRemove.size} to remove</span>}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button
            onClick={handleApply}
            disabled={applying || !hasChanges}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            {applying ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
