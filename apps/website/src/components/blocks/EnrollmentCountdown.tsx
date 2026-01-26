import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface EnrollmentCountdownProps {
  variant?: 'banner' | 'inline' | 'card';
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const getEnrollmentDates = () => {
  const startDate = import.meta.env.VITE_OPEN_ENROLLMENT_START || '2025-11-01';
  const endDate = import.meta.env.VITE_OPEN_ENROLLMENT_END || '2026-01-15';
  const enabled = import.meta.env.VITE_OPEN_ENROLLMENT_ENABLED === 'true';

  return {
    start: new Date(startDate),
    end: new Date(endDate),
    enabled
  };
};

const calculateTimeRemaining = (): TimeRemaining => {
  const { end, enabled } = getEnrollmentDates();

  if (!enabled) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const now = new Date();
  const difference = end.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false
  };
};

export function EnrollmentCountdown({ variant = 'inline', className = '' }: EnrollmentCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining());
  const { end, enabled } = getEnrollmentDates();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  if (!enabled || timeRemaining.isExpired) {
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-lg px-3 py-2 shadow-md min-w-[60px] border-2 border-blue-200">
        <div className="text-2xl md:text-3xl font-bold text-blue-600 tabular-nums">
          {value.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="text-xs md:text-sm font-medium text-neutral-600 mt-1">
        {label}
      </div>
    </div>
  );

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white py-3 ${className}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <Calendar className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-lg">Open Enrollment Ends {formatDate(end)}</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center gap-2 font-mono font-semibold">
                <span>{timeRemaining.days}d</span>
                <span>:</span>
                <span>{timeRemaining.hours.toString().padStart(2, '0')}h</span>
                <span>:</span>
                <span>{timeRemaining.minutes.toString().padStart(2, '0')}m</span>
                <span>:</span>
                <span>{timeRemaining.seconds.toString().padStart(2, '0')}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-2 border-red-200 rounded-xl p-6 ${className}`}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold mb-3">
            <Calendar className="w-4 h-4" />
            Open Enrollment Period
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            Enrollment Deadline Approaching
          </h3>
          <p className="text-sm text-neutral-600">
            Enroll by {formatDate(end)} to start Membership
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <TimeUnit value={timeRemaining.days} label="Days" />
          <div className="text-2xl font-bold text-neutral-400 pb-6">:</div>
          <TimeUnit value={timeRemaining.hours} label="Hours" />
          <div className="text-2xl font-bold text-neutral-400 pb-6">:</div>
          <TimeUnit value={timeRemaining.minutes} label="Minutes" />
          <div className="text-2xl font-bold text-neutral-400 pb-6">:</div>
          <TimeUnit value={timeRemaining.seconds} label="Seconds" />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Clock className="w-5 h-5 text-red-600 animate-pulse" />
      <div className="flex items-center gap-2">
        <span className="font-semibold text-neutral-900">Enrollment ends in:</span>
        <div className="flex items-center gap-1 font-mono font-bold text-red-600">
          <span>{timeRemaining.days}d</span>
          <span>:</span>
          <span>{timeRemaining.hours.toString().padStart(2, '0')}h</span>
          <span>:</span>
          <span>{timeRemaining.minutes.toString().padStart(2, '0')}m</span>
        </div>
      </div>
    </div>
  );
}
