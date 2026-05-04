import React, { useRef, useState } from 'react';
import { Star, Quote, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

// Google Reviews configuration
const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=MPBHealth+Reviews';

type Testimonial = {
  name: string;
  location: string;
  family: string;
  rating: number;
  quote: string;
  source: string;
};

const QUOTE_READ_MORE_MIN_CHARS = 140;

function TestimonialCarouselCard({ testimonial }: { testimonial: Testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const longQuote = testimonial.quote.length >= QUOTE_READ_MORE_MIN_CHARS;

  return (
    <Card hover className="animate-slide-up bg-white h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center mb-3">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
          ))}
        </div>

        <div className="mb-4 pb-4 border-b border-neutral-100">
          <div className="font-semibold text-neutral-900">{testimonial.name}</div>
          <div className="text-sm text-neutral-600">
            {testimonial.location} • {testimonial.family}
          </div>
        </div>

        <div className="relative mb-4 flex-1 min-h-0">
          <Quote className="absolute -top-2 -left-1 h-6 w-6 text-neutral-300 shrink-0" />
          <p
            className={cn(
              'text-neutral-700 italic pl-6 leading-relaxed',
              longQuote && !expanded && 'line-clamp-4'
            )}
          >
            "{testimonial.quote}"
          </p>
          {longQuote && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 pl-6 text-sm font-medium text-primary hover:text-primary/80 hover:underline text-left"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>

        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mt-auto"
        >
          <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-xs text-neutral-500 font-medium">Google Review</span>
        </a>
      </CardContent>
    </Card>
  );
}

const SocialProof: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      name: "Patrick Dittoe",
      location: "United States",
      family: "Member",
      rating: 5,
      quote: "Adam at concierge services is my hero. He ended an hour of frustration trying to get Dr. visits scheduled. He was patient and informative.",
      source: "Google Review"
    },
    {
      name: "Ryan Donovan",
      location: "United States",
      family: "Member",
      rating: 5,
      quote:
        "MPB have been rockstars all the way around. Getting set up was easy, payment was prompt and customer service has been excellent through and through. There is a learning curve coming from traditional insurance but they've been with me the whole way to make it easy and they've made sure I get what I'm looking for. Can't recommend highly enough.",
      source: "Google Review"
    },
    {
      name: "Charlotte Cadieux",
      location: "Portland, OR",
      family: "Individual",
      rating: 5,
      quote:
        "I've cried tears of joy over how functional this system is. By far the easiest, most transparent and affordable coverage I've experienced. As an independent contractor, MPB beats anything the marketplace ever had to offer!",
      source: "Google Review"
    },
    {
      name: "Laura Pascoe",
      location: "Seattle, WA",
      family: "Individual",
      rating: 5,
      quote:
        "In a healthcare landscape where it's easy to feel like just a number, MPB stands out by making me feel heard, respected, and human. They have been responsive, kind, and genuinely compassionate.",
      source: "Google Review"
    },
    {
      name: "Katie Burke",
      location: "Charlotte, NC",
      family: "Individual",
      rating: 5,
      quote:
        "I didn't know things could ever be this easy! Angie and Adam clearly communicated and provided the assistance I needed quickly and efficiently. MPB is a refreshing change from our old BCBS coverage!",
      source: "Google Review"
    },
    {
      name: "Gina Corsini Mattern",
      location: "San Diego, CA",
      family: "Individual",
      rating: 5,
      quote:
        "I greatly appreciate Christine introducing me to MPB Health. She did an excellent job explaining the plan and has been available to answer questions whenever they come up. Very happy with the coverage!",
      source: "Google Review"
    }
  ];

  const stats = [
    { value: "4.9/5", label: "Average Rating", subtext: "Google Reviews" },
    { value: "96%", label: "Would Recommend", subtext: "To friends and family" },
    { value: "50,000+", label: "Families Served", subtext: "Historical enrollment" },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByViewport = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.92, behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-gradient-to-br from-white via-primary/5 to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-display-md font-bold text-neutral-900 mb-4">
            What Our Members Say
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Join thousands of satisfied families who've discovered a better way to manage healthcare costs.
          </p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            View all Google Reviews
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl font-bold text-primary tabular-nums mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-neutral-900 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-neutral-600">
                {stat.subtext}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials carousel: ~3 cards visible on lg; horizontal scroll / swipe */}
        <div className="relative">
          <button
            type="button"
            aria-label="Show previous testimonials"
            onClick={() => scrollByViewport(-1)}
            className="hidden lg:flex absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Show next testimonials"
            onClick={() => scrollByViewport(1)}
            className="hidden lg:flex absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Member testimonials"
            className={cn(
              'flex gap-8 overflow-x-auto overflow-y-visible pb-4 scroll-smooth snap-x snap-mandatory',
              '[-webkit-overflow-scrolling:touch] [scrollbar-width:thin]',
              'lg:px-12'
            )}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={cn(
                  'snap-start shrink-0 w-[min(88vw,22rem)] sm:w-[min(85vw,24rem)]',
                  'lg:w-[calc((100%-4rem)/3)] lg:max-w-none'
                )}
              >
                <TestimonialCarouselCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { SocialProof };
