import { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { AIChatPanel } from './AIChatPanel';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Listen for the footer bar or other triggers
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.action === 'ai-chat') {
        setIsOpen(true);
        setHasUnread(false);
      }
    };
    window.addEventListener('crm:quick-action', handler);
    return () => window.removeEventListener('crm:quick-action', handler);
  }, []);

  // Mark unread when widget is closed and a notification arrives
  useEffect(() => {
    const handler = () => {
      if (!isOpen) setHasUnread(true);
    };
    window.addEventListener('crm:ai-chat-message', handler);
    return () => window.removeEventListener('crm:ai-chat-message', handler);
  }, [isOpen]);

  // Keyboard shortcut: Cmd+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        setIsOpen((v) => !v);
        setHasUnread(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed bottom-16 right-4 z-50 md:bottom-16 md:right-6">
      {isOpen && (
        <div className="mb-3">
          <AIChatPanel
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsOpen(false)}
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasUnread(false);
          }}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'shadow-lg transition-all duration-200 group',
            isOpen
              ? 'bg-surface-tertiary text-th-text-primary hover:bg-surface-secondary'
              : 'gradient-accent text-white glow-accent hover:scale-105'
          )}
          title="AI Assistant (⌘⇧A)"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default AIChatWidget;
