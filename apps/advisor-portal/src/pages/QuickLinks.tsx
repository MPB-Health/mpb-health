import { useState, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon, AlertCircle, X } from 'lucide-react';
import { navigationService, type QuickLink } from '@mpbhealth/advisor-core';

interface FallbackQuickLink {
  label: string;
  url: string;
  image: string;
  description: string;
  is_external?: boolean;
  popup?: boolean;
}

const fallbackQuickLinks: FallbackQuickLink[] = [
  {
    label: 'RX, Labs & Imaging Quote',
    url: 'https://www.cognitoforms.com/MPoweringBenefits1/RXLabsImagingCustomQuoteRequest2025',
    image: '/images/quick-links/quick-link-rx-labs-imaging.png',
    description: 'Request a custom quote for prescriptions, lab work, and imaging services.',
    is_external: true,
    popup: true,
  },
  {
    label: 'Laboratory Assist',
    url: 'https://laboratoryassist.com/',
    image: '/images/quick-links/quick-link-lab-assist.png',
    description: 'Nationwide access to affordable diagnostic lab tests.',
    is_external: true,
  },
  {
    label: 'Find a Provider',
    url: 'https://providersearch.multiplan.com/',
    image: '/images/quick-links/quick-link-provider-search.png',
    description: 'Search the MultiPlan network for in-network healthcare providers.',
    is_external: true,
  },
  {
    label: 'Book a Doctor',
    url: 'https://www.zocdoc.com/?dd_referrer=',
    image: '/images/quick-links/quick-link-zocdoc.png',
    description: 'Find and book doctor appointments online through ZocDoc.',
    is_external: true,
  },
  {
    label: 'Prescription Savings',
    url: 'https://www.goodrx.com/',
    image: '/images/quick-links/quick-link-goodrx.png',
    description: 'Compare prescription drug prices and find discounts with GoodRx.',
    is_external: true,
  },
  {
    label: 'HealthyCare Podcast',
    url: 'https://www.youtube.com/@HealthyCarePodcast',
    image: '/images/quick-links/quick-link-healthy-care-podcast.png',
    description: 'Watch the HealthyCare Podcast for health education and tips.',
    is_external: true,
  },
  {
    label: 'MPB Health Channel',
    url: 'https://www.youtube.com/@MPBHealth_official',
    image: '/images/quick-links/quick-link-mpb-health-youtube.png',
    description: 'Visit the official MPB Health YouTube channel for updates and content.',
    is_external: true,
  },
  {
    label: 'Preventive Care',
    url: 'https://www.healthcare.gov/coverage/preventive-care-benefits/',
    image: '/images/quick-links/quick-link-preventive-care.png',
    description: 'Learn about preventive health services covered at no cost, including screenings and immunizations.',
    is_external: true,
  },
];

const fallbackImageMap: Record<string, string> = {
  'RX, Labs & Imaging Quote': '/images/quick-links/quick-link-rx-labs-imaging.png',
  'Laboratory Assist': '/images/quick-links/quick-link-lab-assist.png',
  'Find a Provider': '/images/quick-links/quick-link-provider-search.png',
  'Book a Doctor': '/images/quick-links/quick-link-zocdoc.png',
  'Prescription Savings': '/images/quick-links/quick-link-goodrx.png',
  'HealthyCare Podcast': '/images/quick-links/quick-link-healthy-care-podcast.png',
  'MPB Health Channel': '/images/quick-links/quick-link-mpb-health-youtube.png',
  'Preventive Care': '/images/quick-links/quick-link-preventive-care.png',
};

// Links that should open in a popup modal instead of a new tab
const POPUP_LABELS = new Set(['RX, Labs & Imaging Quote']);

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-primary rounded-xl border border-th-border overflow-hidden animate-pulse"
        >
          <div className="w-full aspect-[16/9] bg-th-border/40" />
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-th-border/40 rounded w-3/4" />
              <div className="h-4 w-4 bg-th-border/40 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-th-border/40 rounded w-full" />
              <div className="h-3 bg-th-border/40 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-th-border/20 p-4 mb-4">
        <LinkIcon className="w-8 h-8 text-th-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-th-text-primary mb-1">No quick links available</h3>
      <p className="text-sm text-th-text-secondary max-w-sm">
        Quick links will appear here once they are configured. Check back later.
      </p>
    </div>
  );
}

function LinkCard({
  label,
  url,
  image,
  description,
  isExternal,
  isPopup,
  onPopupClick,
}: {
  label: string;
  url: string;
  image?: string | null;
  description?: string | null;
  isExternal?: boolean;
  isPopup?: boolean;
  onPopupClick: () => void;
}) {
  const cardContent = (
    <>
      {image && (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <img
            src={image}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
            {label}
          </h3>
          {isExternal ? (
            <ExternalLink className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0 ml-2" />
          ) : (
            <LinkIcon className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0 ml-2" />
          )}
        </div>
        {description && (
          <p className="text-sm text-th-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </>
  );

  if (isPopup) {
    return (
      <button
        onClick={onPopupClick}
        className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5 text-left"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <a
      href={url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5"
    >
      {cardContent}
    </a>
  );
}

export default function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popupLink, setPopupLink] = useState<{ label: string; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLinks() {
      try {
        setLoading(true);
        setError(null);
        const data = await navigationService.getQuickLinks();
        if (!cancelled) {
          setLinks(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch quick links:', err);
          setError('Failed to load quick links.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = navigationService.subscribeToQuickLinkChanges((updatedLinks) => {
      setLinks(updatedLinks);
      setError(null);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const hasCmsLinks = links.length > 0;
  const showFallback = !loading && !hasCmsLinks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-th-text-primary">Quick Links</h1>
        <p className="mt-1 text-th-text-secondary">
          Shortcuts to common actions and resources.
        </p>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="text-sm text-red-600 mt-0.5">Showing default links instead.</p>
          </div>
        </div>
      )}

      {!loading && (hasCmsLinks || showFallback || error) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {hasCmsLinks
            ? links.map((link) => (
                <LinkCard
                  key={link.id}
                  label={link.label}
                  url={link.url}
                  image={fallbackImageMap[link.label] || '/images/quick-links/quick-link-default.png'}
                  description={link.description}
                  isExternal={link.is_external}
                  isPopup={POPUP_LABELS.has(link.label)}
                  onPopupClick={() => setPopupLink({ label: link.label, url: link.url })}
                />
              ))
            : (error ? fallbackQuickLinks : fallbackQuickLinks).map((link) => (
                <LinkCard
                  key={link.url}
                  label={link.label}
                  url={link.url}
                  image={link.image}
                  description={link.description}
                  isExternal={link.is_external}
                  isPopup={link.popup}
                  onPopupClick={() => setPopupLink({ label: link.label, url: link.url })}
                />
              ))}
        </div>
      )}

      {showFallback && !error && <EmptyState />}

      {/* Popup modal for iframe links */}
      {popupLink && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setPopupLink(null)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {popupLink.label}
                </h2>
                <button
                  onClick={() => setPopupLink(null)}
                  className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary"
                >
                  <span className="sr-only">Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <iframe
                  src={popupLink.url}
                  className="w-full h-full border-0"
                  title={popupLink.label}
                  allow="payment"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
