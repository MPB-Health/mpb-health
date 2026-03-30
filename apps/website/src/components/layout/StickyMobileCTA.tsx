import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, X, TrendingDown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const StickyMobileCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4" />
              <div className="font-bold text-sm">
                Save Up to 60% on Healthcare
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <Star className="w-3 h-3 fill-current text-yellow-300" />
              <span>4.9/5 from 12,000+ families</span>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 pb-2">
          <Link to="/get-started" className="flex-1">
            <button className="w-full bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold text-sm shadow-lg hover:bg-blue-50 transition-colors active:scale-95 flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Get Free Quote
            </button>
          </Link>
          <a href="tel:8558164650" className="flex-1">
            <button className="w-full border-2 border-white text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors active:scale-95 flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              (855) 816-4650
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export { StickyMobileCTA };