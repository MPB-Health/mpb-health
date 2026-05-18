import { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripHorizontal, Save, Pin, PinOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';

interface StickyNoteProps {
  open: boolean;
  onClose: () => void;
  leadId?: string | null;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'crm-sticky-note';
const POSITION_KEY = 'crm-sticky-note-pos';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function StickyNote({ open, onClose, leadId }: StickyNoteProps) {
  const { activityService } = useCRM();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<Position>({ x: -1, y: -1 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // Restore draft + position from localStorage
  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || '');
        setContent(parsed.content || '');
      }
      const pos = localStorage.getItem(POSITION_KEY);
      if (pos) {
        setPosition(JSON.parse(pos));
      } else {
        setPosition({ x: window.innerWidth - 360, y: 100 });
      }
    } catch {
      setPosition({ x: window.innerWidth - 360, y: 100 });
    }
  }, [open]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, content }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [title, content, open]);

  // Save position to localStorage
  useEffect(() => {
    if (!open || position.x === -1) return;
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }, [position, open]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    isDragging.current = true;
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - 320);
      const newY = clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - 100);
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Touch drag support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    isDragging.current = true;
    const touch = e.touches[0];
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }, []);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const newX = clamp(touch.clientX - dragOffset.current.x, 0, window.innerWidth - 320);
      const newY = clamp(touch.clientY - dragOffset.current.y, 0, window.innerHeight - 100);
      setPosition({ x: newX, y: newY });
    };
    const handleTouchEnd = () => { isDragging.current = false; };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleSaveToLead = async () => {
    if (!leadId || !content.trim()) return;
    setSaving(true);
    try {
      const result = await activityService.addNote(leadId, title.trim() || 'Sticky Note', content.trim());
      if (result.success) {
        toast.success('Note saved to lead');
        setTitle('');
        setContent('');
        localStorage.removeItem(STORAGE_KEY);
        if (!pinned) onClose();
      } else {
        toast.error(result.error || 'Failed to save note');
      }
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (content.trim() || title.trim()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, content }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    onClose();
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!open) return null;

  return (
    <div
      ref={dragRef}
      className="fixed z-[9999] animate-scale-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 320,
      }}
    >
      <div className="rounded-xl shadow-2xl border border-yellow-400/30 overflow-hidden bg-yellow-50 dark:bg-yellow-950/80 backdrop-blur-sm">
        {/* Drag handle / header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-yellow-200/60 dark:bg-yellow-900/50 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
              Sticky Note
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPinned(!pinned)}
              className="p-1 rounded-md hover:bg-yellow-300/50 dark:hover:bg-yellow-800/50 transition-colors"
              title={pinned ? 'Unpin (close after save)' : 'Pin (stay open after save)'}
            >
              {pinned
                ? <Pin className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400" />
                : <PinOff className="w-3.5 h-3.5 text-yellow-600/60 dark:text-yellow-500/60" />
              }
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-yellow-300/50 dark:hover:bg-yellow-800/50 transition-colors"
              title="Close (draft is preserved)"
            >
              <X className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full px-2 py-1.5 text-sm font-medium bg-transparent border-b border-yellow-300/50 dark:border-yellow-700/50 text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-500/50 focus:outline-none focus:border-yellow-500 transition-colors"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your note here..."
            rows={5}
            className="w-full px-2 py-1.5 text-sm bg-transparent text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-500/50 resize-y focus:outline-none min-h-[80px]"
            autoFocus
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-yellow-300/30 dark:border-yellow-700/30">
          <button
            onClick={handleClear}
            disabled={!title && !content}
            className="text-[11px] text-yellow-600/70 dark:text-yellow-400/70 hover:text-yellow-800 dark:hover:text-yellow-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            {content.trim() && (
              <span className="text-[10px] text-yellow-600/50 dark:text-yellow-400/50">
                Draft saved
              </span>
            )}
            {leadId && (
              <button
                onClick={handleSaveToLead}
                disabled={saving || !content.trim()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-yellow-400/80 dark:bg-yellow-600/80 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-500 dark:hover:bg-yellow-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save to Lead'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StickyNote;
