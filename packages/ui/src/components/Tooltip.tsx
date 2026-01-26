import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  delayDuration: number;
}>({
  open: false,
  setOpen: () => {},
  delayDuration: 200,
});

function TooltipProvider({ children, delayDuration = 200 }: TooltipProviderProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

function Tooltip({ children }: TooltipProps) {
  return <div className="relative inline-block">{children}</div>;
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ children, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const { setOpen, delayDuration } = React.useContext(TooltipContext);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
      }, delayDuration);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setOpen(false);
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      setOpen(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      setOpen(false);
      onBlur?.(e);
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <button
        ref={ref}
        type="button"
        className={cn('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TooltipTrigger.displayName = 'TooltipTrigger';

function TooltipContent({ children, className, side = 'bottom' }: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext);

  if (!open) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      role="tooltip"
      className={cn(
        'absolute z-50 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
        className
      )}
    >
      {children}
    </div>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
