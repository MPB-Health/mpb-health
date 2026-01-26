import React, { useEffect, useState } from 'react';

export function StickyHeaderMVP() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">
          HealthShare Plans Built for You
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#quote"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Get My Quote
          </a>
          <a
            href="/advisors"
            className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
          >
            Find an Agent
          </a>
        </div>
      </div>
    </div>
  );
}
