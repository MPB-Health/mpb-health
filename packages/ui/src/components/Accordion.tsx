import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils';

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  className?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  defaultValue?: string[];
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

const AccordionContext = React.createContext<{
  openItems: string[];
  toggle: (value: string) => void;
  open: (value: string) => void;
} | null>(null);

const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  className,
  value: controlledValue,
  onValueChange,
  defaultValue = [],
}) => {
  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const openItems = isControlled ? controlledValue : internalOpenItems;

  const toggle = useCallback((value: string) => {
    const compute = (prev: string[]) => {
      if (type === 'single') return prev.includes(value) ? [] : [value];
      return prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value];
    };

    if (isControlled) {
      onValueChange?.(compute(openItems));
    } else {
      setInternalOpenItems((prev) => compute(prev));
    }
  }, [type, isControlled, openItems, onValueChange]);

  const open = useCallback((value: string) => {
    if (openItems.includes(value)) return;

    const newOpenItems = type === 'single' ? [value] : [...openItems, value];

    if (isControlled) {
      onValueChange?.(newOpenItems);
    } else {
      setInternalOpenItems(newOpenItems);
    }
  }, [type, isControlled, openItems, onValueChange]);

  const ctxValue = useMemo(() => ({ openItems, toggle, open }), [openItems, toggle, open]);

  return (
    <AccordionContext.Provider value={ctxValue}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

const AccordionItemContext = React.createContext<string>('');

const AccordionItem: React.FC<AccordionItemProps> = ({ value, children, id, className }) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <div id={id} className={cn('border border-neutral-200 rounded-lg overflow-hidden', className)}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  className,
}) => {
  const context = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);

  if (!context) return null;

  const isOpen = context.openItems.includes(value);

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between p-4 text-left font-medium hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors',
        className
      )}
      onClick={() => context.toggle(value)}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
};

const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  className,
}) => {
  const context = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);

  if (!context) return null;

  const isOpen = context.openItems.includes(value);

  if (!isOpen) return null;

  return (
    <div className="overflow-hidden">
      <div className={cn('p-4 pt-0 text-sm text-neutral-600', className)}>
        {children}
      </div>
    </div>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
