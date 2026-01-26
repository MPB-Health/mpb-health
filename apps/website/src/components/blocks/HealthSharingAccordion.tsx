import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { sanitizeHTML } from '../../lib/sanitizer';
import { useFAQByCategory } from '../../hooks/useFAQ';

interface AccordionItemProps {
  title: string;
  contentHtml: string;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  contentHtml,
  isOpen,
  onToggle,
  itemId
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [contentHtml, isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  const sanitizedContent = sanitizeHTML(contentHtml);

  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <h3>
        <button
          type="button"
          role="button"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${itemId}`}
          id={`accordion-button-${itemId}`}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="w-full flex items-center justify-between py-5 px-6 text-left hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
        >
          <span className="text-lg font-semibold text-neutral-900 pr-4">
            {title}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-neutral-600 flex-shrink-0 transition-transform duration-500 ease-in-out ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        id={`accordion-content-${itemId}`}
        role="region"
        aria-labelledby={`accordion-button-${itemId}`}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0
        }}
        className="overflow-hidden transition-all duration-500 ease-in-out"
      >
        <div
          ref={contentRef}
          className="px-6 pb-6 prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </div>
  );
};

const HealthSharingAccordion: React.FC = () => {
  const { faqItems, loading } = useFAQByCategory('why-choose-healthsharing');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyNavigation = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = buttonRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = Math.min(currentIndex + 1, faqItems.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = Math.max(currentIndex - 1, 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = faqItems.length - 1;
    }

    buttonRefs.current[nextIndex]?.focus();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">Loading FAQ...</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-md border border-neutral-200 overflow-hidden"
      onKeyDown={handleKeyNavigation}
    >
      {faqItems.map((item, index) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          contentHtml={item.content_html}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
          itemId={`item-${item.id}`}
        />
      ))}
    </div>
  );
};

export { HealthSharingAccordion };
