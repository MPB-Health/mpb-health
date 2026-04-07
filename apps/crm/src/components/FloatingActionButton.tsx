import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  UserPlus,
  Phone,
  Mail,
  CheckSquare,
  MessageSquare,
  Kanban,
} from 'lucide-react';

interface FloatingActionButtonProps {
  onNavigate: (path: string) => void;
  hasOverdueTasks?: boolean;
}

interface FabAction {
  id: string;
  label: string;
  icon: typeof Plus;
  color: string;
  action: () => void;
}

export function FloatingActionButton({
  onNavigate,
  hasOverdueTasks = false,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  const executeAndClose = useCallback(
    (fn: () => void) => {
      fn();
      close();
    },
    [close],
  );

  const actions: FabAction[] = [
    {
      id: 'new-lead',
      label: 'New Lead',
      icon: UserPlus,
      color: 'text-violet-600',
      action: () => onNavigate('/leads?action=create'),
    },
    {
      id: 'log-call',
      label: 'Log Call',
      icon: Phone,
      color: 'text-green-600',
      action: () => window.dispatchEvent(new CustomEvent('fab:log-call')),
    },
    {
      id: 'send-email',
      label: 'Send Email',
      icon: Mail,
      color: 'text-blue-600',
      action: () => onNavigate('/email/inbox'),
    },
    {
      id: 'new-task',
      label: 'New Task',
      icon: CheckSquare,
      color: 'text-amber-600',
      action: () => window.dispatchEvent(new CustomEvent('fab:add-task')),
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: MessageSquare,
      color: 'text-pink-600',
      action: () => window.dispatchEvent(new CustomEvent('fab:add-note')),
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Kanban,
      color: 'text-indigo-600',
      action: () => onNavigate('/pipeline'),
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-200 z-[9998] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 z-[9999] md:bottom-6 md:right-6 max-md:bottom-4 max-md:right-4"
      >
        {/* Sub-action buttons */}
        <div className="absolute bottom-full right-0 mb-3 flex flex-col-reverse items-end gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const reverseIndex = actions.length - 1 - index;
            const delay = reverseIndex * 50;

            return (
              <div
                key={action.id}
                className="group flex items-center gap-2"
                style={{
                  transitionDelay: isOpen ? `${delay}ms` : '0ms',
                  transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)',
                  opacity: isOpen ? 1 : 0,
                  transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
                  pointerEvents: isOpen ? 'auto' : 'none',
                }}
              >
                {/* Label tooltip */}
                <span
                  className="
                    whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white
                    shadow-lg opacity-0 transition-opacity duration-150
                    group-hover:opacity-100
                  "
                >
                  {action.label}
                </span>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => executeAndClose(action.action)}
                  className="
                    flex h-11 w-11 items-center justify-center rounded-full
                    bg-white shadow-md shadow-black/10
                    transition-transform duration-150
                    hover:scale-110 hover:shadow-lg
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
                  "
                  aria-label={action.label}
                >
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Main FAB */}
        <button
          type="button"
          onClick={toggle}
          className={`
            relative flex items-center justify-center rounded-full
            bg-gradient-to-br from-violet-500 to-blue-500
            shadow-lg shadow-violet-500/30
            transition-all duration-200
            hover:shadow-xl hover:shadow-violet-500/40 hover:brightness-110
            focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
            h-14 w-14 max-md:h-12 max-md:w-12
            ${hasOverdueTasks && !isOpen ? 'animate-fab-pulse' : ''}
          `}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={isOpen}
        >
          <Plus
            className={`h-6 w-6 text-white transition-transform duration-200 ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
        }
        .animate-fab-pulse {
          animation: fab-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
