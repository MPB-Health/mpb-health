import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Phone, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface ExitIntentModalProps {
  onClose: () => void;
  variant?: 'quote' | 'contact' | 'compare';
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  onClose,
  variant = 'quote'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const content = {
    quote: {
      title: 'Wait! Before You Go...',
      subtitle: 'See How Much You Could Save',
      description: 'Get your personalized quote in under 2 minutes. Most families save $300-$500 per month.',
      cta: 'Get My Free Quote',
      ctaLink: '/get-started',
      icon: Calculator,
    },
    contact: {
      title: 'Have Questions?',
      subtitle: 'Talk to a Health Sharing Expert',
      description: 'Our advisors are here to help you understand your options and find the perfect plan for your family.',
      cta: 'Schedule a Call',
      ctaLink: '/contact',
      icon: Phone,
    },
    compare: {
      title: 'Compare Plans Before You Leave',
      subtitle: 'Find Your Perfect Match',
      description: 'See side-by-side comparisons of all plans with transparent pricing and coverage details.',
      cta: 'Compare Plans',
      ctaLink: '/compare-plans',
      icon: ArrowRight,
    },
  };

  const currentContent = content[variant];
  const Icon = currentContent.icon;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all duration-300',
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl">
            <Icon className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-2">
            {currentContent.title}
          </h2>
          <p className="text-lg font-semibold text-blue-600 text-center mb-4">
            {currentContent.subtitle}
          </p>
          <p className="text-neutral-600 text-center mb-8">
            {currentContent.description}
          </p>

          <div className="space-y-3">
            <Link to={currentContent.ctaLink} onClick={handleClose}>
              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2">
                {currentContent.cta}
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>

            <button
              onClick={handleClose}
              className="w-full py-3 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
            >
              No thanks, I'll browse more
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No commitment</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free quote</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useExitIntent = (enabled: boolean = true, delay: number = 3000) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || hasShown) return;

    const hasSeenModal = sessionStorage.getItem('exit_intent_shown');
    if (hasSeenModal) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setShouldShow(true);
          setHasShown(true);
          sessionStorage.setItem('exit_intent_shown', 'true');
        }, 300);
      }
    };

    setTimeout(() => {
      document.addEventListener('mouseout', handleMouseLeave);
    }, delay);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, hasShown, delay]);

  const close = () => {
    setShouldShow(false);
  };

  return { shouldShow, close };
};
