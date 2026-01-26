import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePricingCarouselProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const MobilePricingCarousel: React.FC<MobilePricingCarouselProps> = ({
  children,
  currentIndex,
  onIndexChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth;
    container.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth',
    });
  }, [currentIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth;
    const newIndex = Math.round(container.scrollLeft / cardWidth);
    onIndexChange(Math.max(0, Math.min(newIndex, children.length - 1)));
  };

  const goToPrevious = () => {
    onIndexChange(Math.max(0, currentIndex - 1));
  };

  const goToNext = () => {
    onIndexChange(Math.min(children.length - 1, currentIndex + 1));
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full snap-center px-4"
            style={{ scrollSnapAlign: 'center' }}
          >
            {child}
          </div>
        ))}
      </div>

      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-neutral-100 transition-colors"
          aria-label="Previous plan"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-900" />
        </button>
      )}

      {currentIndex < children.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-neutral-100 transition-colors"
          aria-label="Next plan"
        >
          <ChevronRight className="w-5 h-5 text-neutral-900" />
        </button>
      )}

      <div className="flex justify-center gap-2 mt-6">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-neutral-300'
            }`}
            aria-label={`Go to plan ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
