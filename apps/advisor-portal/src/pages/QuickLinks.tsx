import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

const STORAGE_BASE = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents';

interface QuickLinkItem {
  label: string;
  url: string;
  image: string;
  description: string;
  popup?: boolean;
}

const quickLinks: QuickLinkItem[] = [
  {
    label: 'RX, Labs & Imaging Quote',
    url: 'https://www.cognitoforms.com/MPoweringBenefits1/RXLabsImagingCustomQuoteRequest2026',
    image: `${STORAGE_BASE}/quick-link-rx-labs-imaging.png`,
    description: 'Request a custom quote for prescriptions, lab work, and imaging services.',
    popup: true,
  },
  {
    label: 'Laboratory Assist',
    url: 'https://laboratoryassist.com/',
    image: `${STORAGE_BASE}/quick-link-lab-assist.png`,
    description: 'Nationwide access to affordable diagnostic lab tests.',
  },
  {
    label: 'Find a Provider',
    url: 'https://providersearch.multiplan.com/',
    image: `${STORAGE_BASE}/quick-link-provider-search.png`,
    description: 'Search the MultiPlan network for in-network healthcare providers.',
  },
  {
    label: 'Book a Doctor',
    url: 'https://www.zocdoc.com/?dd_referrer=',
    image: `${STORAGE_BASE}/quick-link-zocdoc.png`,
    description: 'Find and book doctor appointments online through ZocDoc.',
  },
  {
    label: 'Prescription Savings',
    url: 'https://www.goodrx.com/',
    image: `${STORAGE_BASE}/quick-link-goodrx.png`,
    description: 'Compare prescription drug prices and find discounts with GoodRx.',
  },
  {
    label: 'HealthyCare Podcast',
    url: 'https://www.youtube.com/@HealthyCarePodcast',
    image: `${STORAGE_BASE}/quick-link-healthy-care-podcast.png`,
    description: 'Watch the HealthyCare Podcast for health education and tips.',
  },
  {
    label: 'MPB Health Channel',
    url: 'https://www.youtube.com/@MPBHealth_official',
    image: `${STORAGE_BASE}/quick-link-mpb-health-youtube.png`,
    description: 'Visit the official MPB Health YouTube channel for updates and content.',
  },
  {
    label: 'Preventive Care',
    url: 'https://www.healthcare.gov/coverage/preventive-care-benefits/',
    image: `${STORAGE_BASE}/quick-link-preventive-care.png`,
    description: 'Learn about preventive health services covered at no cost, including screenings and immunizations.',
  },
];

function LinkCard({
  label,
  url,
  image,
  description,
  isPopup,
  onPopupClick,
}: {
  label: string;
  url: string;
  image: string;
  description: string;
  isPopup?: boolean;
  onPopupClick: () => void;
}) {
  const cardContent = (
    <>
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
            {label}
          </h3>
          <ExternalLink className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0 ml-2" />
        </div>
        <p className="text-sm text-th-text-secondary leading-relaxed">
          {description}
        </p>
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
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5"
    >
      {cardContent}
    </a>
  );
}

export default function QuickLinks() {
  const [popupLink, setPopupLink] = useState<{ label: string; url: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-th-text-primary">Quick Links</h1>
        <p className="mt-1 text-th-text-secondary">
          Shortcuts to common actions and resources.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {quickLinks.map((link) => (
          <LinkCard
            key={link.url}
            label={link.label}
            url={link.url}
            image={link.image}
            description={link.description}
            isPopup={link.popup}
            onPopupClick={() => setPopupLink({ label: link.label, url: link.url })}
          />
        ))}
      </div>

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
