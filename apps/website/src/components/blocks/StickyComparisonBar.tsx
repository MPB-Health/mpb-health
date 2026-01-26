import React, { useEffect, useState } from 'react';
import { ArrowUp, GitCompare, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface StickyComparisonBarProps {
  selectedPlans: string[];
  onCompare: () => void;
  onClear: () => void;
  maxPlans?: number;
}

export const StickyComparisonBar: React.FC<StickyComparisonBarProps> = ({
  selectedPlans,
  onCompare,
  onClear,
  maxPlans = 3,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (selectedPlans.length === 0) return null;

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-neutral-900">
                {selectedPlans.length} plan{selectedPlans.length > 1 ? 's' : ''} selected
              </div>
              <div className="text-xs text-neutral-600">
                {maxPlans - selectedPlans.length} more available
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClear}>
                Clear
              </Button>
              <Button
                onClick={onCompare}
                disabled={selectedPlans.length < 2}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Floating Bar */}
      <div
        className={`hidden lg:block fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary p-4 min-w-[320px]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-1">
                Compare Plans
              </div>
              <div className="text-xs text-neutral-600">
                {selectedPlans.length} of {maxPlans} selected
              </div>
            </div>
            <button
              onClick={onClear}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {selectedPlans.map((plan) => (
              <div
                key={plan}
                className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg"
              >
                {plan}
              </div>
            ))}
          </div>

          <Button
            onClick={onCompare}
            disabled={selectedPlans.length < 2}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Plans
          </Button>

          {selectedPlans.length < 2 && (
            <p className="text-xs text-neutral-500 text-center mt-2">
              Select at least 2 plans to compare
            </p>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      {isVisible && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="hidden lg:block fixed bottom-6 left-6 z-40 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-neutral-200"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 text-neutral-900" />
        </button>
      )}
    </>
  );
};
