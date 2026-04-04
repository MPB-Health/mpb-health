import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '../utils';

export interface InfoTipProps {
  content: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md';
}

export function InfoTip({ content, className, iconClassName, size = 'sm' }: InfoTipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; flip: boolean } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const flip = rect.top < 120;
    setCoords({
      x: rect.left + rect.width / 2,
      y: flip ? rect.bottom + 8 : rect.top - 8,
      flip,
    });
  }, []);

  const show = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [visible, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex items-center cursor-help flex-shrink-0', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        role="note"
        aria-label={content}
      >
        <Info
          className={cn(
            iconSize,
            'text-th-text-tertiary/60 hover:text-th-accent-600 dark:hover:text-th-accent-400 transition-colors',
            iconClassName,
          )}
        />
      </span>
      {visible &&
        coords &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: coords.flip
                ? 'translate(-50%, 0)'
                : 'translate(-50%, -100%)',
            }}
          >
            <div className="w-64 px-3.5 py-2.5 text-[11px] leading-relaxed text-white bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-800 rounded-lg shadow-xl">
              {content}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent',
                  coords.flip
                    ? 'bottom-full border-b-neutral-800 dark:border-b-neutral-100'
                    : 'top-full border-t-neutral-800 dark:border-t-neutral-100',
                )}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
