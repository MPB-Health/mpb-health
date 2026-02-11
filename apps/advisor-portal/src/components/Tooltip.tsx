// ============================================================================
// Tooltip — Reusable hover tooltip component
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Text to display in the tooltip */
  content: string;
  /** Preferred placement (auto-flips if not enough space) */
  placement?: Placement;
  /** Delay before showing (ms) */
  delay?: number;
  /** Max width of the tooltip */
  maxWidth?: number;
  /** Additional className for the wrapper */
  className?: string;
  children: React.ReactNode;
}

export function Tooltip({
  content,
  placement = 'bottom',
  delay = 200,
  maxWidth = 320,
  className = '',
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Position the tooltip when it becomes visible
  useEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;
    let place = placement;

    // Calculate position, flip if needed
    if (placement === 'bottom') {
      top = wrapperRect.bottom + gap;
      left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
      if (top + tooltipRect.height > window.innerHeight) {
        place = 'top';
        top = wrapperRect.top - tooltipRect.height - gap;
      }
    } else if (placement === 'top') {
      top = wrapperRect.top - tooltipRect.height - gap;
      left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
      if (top < 0) {
        place = 'bottom';
        top = wrapperRect.bottom + gap;
      }
    } else if (placement === 'right') {
      top = wrapperRect.top + wrapperRect.height / 2 - tooltipRect.height / 2;
      left = wrapperRect.right + gap;
      if (left + tooltipRect.width > window.innerWidth) {
        place = 'left';
        left = wrapperRect.left - tooltipRect.width - gap;
      }
    } else {
      top = wrapperRect.top + wrapperRect.height / 2 - tooltipRect.height / 2;
      left = wrapperRect.left - tooltipRect.width - gap;
      if (left < 0) {
        place = 'right';
        left = wrapperRect.right + gap;
      }
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

    setCoords({ top, left });
    setActualPlacement(place);
  }, [visible, placement]);

  if (!content) return <>{children}</>;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}

      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] px-3 py-2.5 text-sm text-white bg-neutral-800 dark:bg-neutral-700 rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: coords.top,
            left: coords.left,
            maxWidth,
            whiteSpace: 'pre-line',
          }}
          data-placement={actualPlacement}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
