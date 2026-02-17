import { ExternalLink } from 'lucide-react';

interface QuickLinkItem {
  label: string;
  url: string;
  image: string;
  description: string;
}

const quickLinks: QuickLinkItem[] = [
  {
    label: 'RX, Labs & Imaging Quote',
    url: 'https://www.cognitoforms.com/MPoweringBenefits1/RXLabsImagingCustomQuoteRequest2025',
    image: '/images/quick-links/quick-link-rx-labs-imaging.png',
    description: 'Request a custom quote for prescriptions, lab work, and imaging services.',
  },
  {
    label: 'Laboratory Assist',
    url: 'https://laboratoryassist.com/',
    image: '/images/quick-links/quick-link-lab-assist.png',
    description: 'Nationwide access to affordable diagnostic lab tests.',
  },
  {
    label: 'Find a Provider',
    url: 'https://providersearch.multiplan.com/',
    image: '/images/quick-links/quick-link-provider-search.png',
    description: 'Search the MultiPlan network for in-network healthcare providers.',
  },
  {
    label: 'Book a Doctor',
    url: 'https://www.zocdoc.com/?dd_referrer=',
    image: '/images/quick-links/quick-link-zocdoc.png',
    description: 'Find and book doctor appointments online through ZocDoc.',
  },
  {
    label: 'Prescription Savings',
    url: 'https://www.goodrx.com/',
    image: '/images/quick-links/quick-link-goodrx.png',
    description: 'Compare prescription drug prices and find discounts with GoodRx.',
  },
  {
    label: 'HealthyCare Podcast',
    url: 'https://www.youtube.com/@HealthyCarePodcast',
    image: '/images/quick-links/quick-link-healthy-care-podcast.png',
    description: 'Watch the HealthyCare Podcast for health education and tips.',
  },
  {
    label: 'MPB Health Channel',
    url: 'https://www.youtube.com/@MPBHealth_official',
    image: '/images/quick-links/quick-link-mpb-health-youtube.png',
    description: 'Visit the official MPB Health YouTube channel for updates and content.',
  },
];

export default function QuickLinks() {
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
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-surface-primary rounded-xl border border-th-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-300 hover:-translate-y-0.5"
          >
            <div className="relative w-full aspect-[16/9] overflow-hidden">
              <img
                src={link.image}
                alt={link.label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                  {link.label}
                </h3>
                <ExternalLink className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-500 transition-colors flex-shrink-0 ml-2" />
              </div>
              <p className="text-sm text-th-text-secondary leading-relaxed">
                {link.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
