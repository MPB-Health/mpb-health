import { useState, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  sending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageComposer({
  onSend,
  sending,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending || disabled) return;

    try {
      await onSend(trimmed);
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('[MessageComposer] Send failed:', err);
    }
  }, [content, sending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-th-border-primary px-4 py-3">
      {disabled && (
        <div className="text-xs text-th-text-tertiary text-center py-1 mb-2">
          Only admins can post in this channel
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none bg-th-bg-secondary rounded-lg px-3 py-2.5 text-sm text-th-text-primary placeholder:text-th-text-tertiary border border-th-border-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:opacity-50"
          style={{ maxHeight: 160 }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending || disabled}
          className="flex-shrink-0 p-2.5 rounded-lg bg-th-accent-600 text-white hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-th-text-tertiary mt-1">
        Press <kbd className="px-1 py-0.5 bg-th-bg-secondary rounded text-[10px]">Enter</kbd> to send,{' '}
        <kbd className="px-1 py-0.5 bg-th-bg-secondary rounded text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
