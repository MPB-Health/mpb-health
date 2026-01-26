import React from 'react';

interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current
              ? 'w-8 bg-blue-600'
              : i === current
              ? 'w-10 bg-blue-400'
              : 'w-2 bg-gray-300'
          }`}
          aria-label={`Step ${i + 1}${i < current ? ' completed' : i === current ? ' current' : ''}`}
        />
      ))}
    </div>
  );
}
