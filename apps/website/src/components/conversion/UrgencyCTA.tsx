import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface UrgencyCTAProps {
  variant?: 'countdown' | 'spots' | 'price' | 'views';
  className?: string;
}

export const UrgencyCTA: React.FC<UrgencyCTAProps> = ({
  variant = 'countdown',
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (variant === 'countdown') {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const updateCountdown = () => {
        const diff = endOfMonth.getTime() - new Date().getTime();

        if (diff > 0) {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [variant]);

  const renderCountdown = () => (
    <div className={cn('bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-8 shadow-xl', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-6 w-6" />
        <p className="text-sm font-bold uppercase tracking-wider">Limited Time Offer</p>
      </div>

      <h3 className="text-2xl font-bold mb-2">
        Start Saving Today
      </h3>
      <p className="text-white/90 mb-6">
        Join thousands of families saving on healthcare. Get your personalized quote now.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-2">
              <p className="text-3xl font-bold">{String(item.value).padStart(2, '0')}</p>
            </div>
            <p className="text-xs font-medium text-white/80">{item.label}</p>
          </div>
        ))}
      </div>

      <Link to="/get-started">
        <button className="w-full py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Get Your Quote Now
          <ArrowRight className="h-5 w-5" />
        </button>
      </Link>
    </div>
  );

  const renderSpots = () => {
    const spotsLeft = 7;
    return (
      <div className={cn('bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl p-8 shadow-xl', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6" />
          <p className="text-sm font-bold uppercase tracking-wider">Limited Availability</p>
        </div>

        <h3 className="text-2xl font-bold mb-2">
          Only {spotsLeft} Spots Left This Month
        </h3>
        <p className="text-white/90 mb-6">
          High demand for our health sharing plans. Secure your spot before enrollment closes.
        </p>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Enrollment Progress</span>
            <span className="text-sm font-bold">{spotsLeft} left</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${100 - (spotsLeft / 15) * 100}%` }}
            ></div>
          </div>
        </div>

        <Link to="/get-started">
          <button className="w-full py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
            Reserve Your Spot
            <ArrowRight className="h-5 w-5" />
          </button>
        </Link>
      </div>
    );
  };

  const renderPrice = () => (
    <div className={cn('bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl p-8 shadow-xl', className)}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-6 w-6" />
        <p className="text-sm font-bold uppercase tracking-wider">Price Increase Alert</p>
      </div>

      <h3 className="text-2xl font-bold mb-2">
        Current Rates Ending Soon
      </h3>
      <p className="text-white/90 mb-6">
        Rates are increasing next month. Lock in today's pricing and save an average of $420/year.
      </p>

      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">Current Rate</p>
            <p className="text-3xl font-bold">$295</p>
            <p className="text-xs text-white/70">per month</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">Next Month</p>
            <p className="text-3xl font-bold line-through opacity-60">$330</p>
            <p className="text-xs text-red-200 font-bold">+12% increase</p>
          </div>
        </div>
      </div>

      <Link to="/get-started">
        <button className="w-full py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Lock In Current Rate
          <ArrowRight className="h-5 w-5" />
        </button>
      </Link>
    </div>
  );

  const renderViews = () => (
    <div className={cn('bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden', className)}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-sm font-bold">127 people viewing this page</p>
        </div>

        <h3 className="text-2xl font-bold mb-2">
          Don't Miss Out on This Opportunity
        </h3>
        <p className="text-white/90 mb-6">
          Join thousands of families who are saving on healthcare. Get your personalized quote in minutes.
        </p>

        <Link to="/get-started">
          <button className="w-full py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </button>
        </Link>
      </div>
    </div>
  );

  switch (variant) {
    case 'countdown':
      return renderCountdown();
    case 'spots':
      return renderSpots();
    case 'price':
      return renderPrice();
    case 'views':
      return renderViews();
    default:
      return renderCountdown();
  }
};

interface FloatingCTAProps {
  message: string;
  buttonText: string;
  buttonLink: string;
  onClose?: () => void;
}

export const FloatingCTA: React.FC<FloatingCTAProps> = ({
  message,
  buttonText,
  buttonLink,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-from-right">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 p-4 max-w-sm">
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <Clock className="h-4 w-4" />
          </button>
        )}

        <p className="text-sm text-neutral-700 mb-3 pr-6">
          {message}
        </p>

        <Link to={buttonLink}>
          <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            {buttonText}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
};
