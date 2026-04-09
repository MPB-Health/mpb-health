import { useEffect, useState } from 'react';
import { ExternalLink, X, Smartphone, ArrowRight, Video, Calendar } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseUrl } from '@mpbhealth/database';
import { navigationService, type QuickLink } from '@mpbhealth/advisor-core';

const STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public/advisor-documents`;

interface QuickLinkItem {
  label: string;
  url: string;
  image: string;
  description: string;
  popup?: boolean;
}

const fallbackQuickLinks: QuickLinkItem[] = [
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
  const queryClient = useQueryClient();

  const { data: cmsQuickLinks = [], isLoading: loading } = useQuery({
    queryKey: ['quickLinks'],
    queryFn: () => navigationService.getResourceCenterQuickLinks(),
  });

  useEffect(() => {
    const channel = navigationService.subscribeToQuickLinkChanges((all) => {
      queryClient.setQueryData(['quickLinks'], navigationService.selectResourceCenterQuickLinks(all));
    });
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  const displayQuickLinks: QuickLinkItem[] = cmsQuickLinks.length > 0
    ? cmsQuickLinks.map((link) => ({
        label: link.label,
        url: link.url,
        image: link.image_url
          ? (link.image_url.startsWith('http') ? link.image_url : `${supabaseUrl}${link.image_url}`)
          : '',
        description: link.description ?? '',
        popup: link.is_popup,
      }))
    : fallbackQuickLinks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-th-text-primary">Resource Center</h1>
        <p className="mt-1 text-th-text-secondary">
          Shortcuts to common actions and resources.
        </p>
      </div>

      {/* Secure HSA Webinar */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-200 dark:border-blue-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-th-text-primary">Secure HSA Webinar</h2>
            <p className="text-xs text-th-text-secondary mt-0.5">Live recurring sessions — click to join via Microsoft Teams</p>
          </div>
        </div>
        <div className="divide-y divide-blue-100 dark:divide-blue-900">
          {/* Tuesday sessions */}
          <div className="flex items-center justify-between px-6 py-4 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-th-text-primary text-sm">Tuesdays at 12 PM ET</p>
                <p className="text-xs text-th-text-secondary mt-0.5">1st &amp; 3rd Tuesday each month</p>
              </div>
            </div>
            <a
              href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_NzZkOTcxZWQtMTJmOC00MThlLWEwZWQtNTI3MTM4NjZkZjcx%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22790aa558-4c20-46ec-8708-30d8168cfa5d%22%7d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Join Meeting
            </a>
          </div>
          {/* Thursday sessions */}
          <div className="flex items-center justify-between px-6 py-4 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-th-text-primary text-sm">Thursdays at 4 PM ET</p>
                <p className="text-xs text-th-text-secondary mt-0.5">2nd &amp; 4th Thursday each month</p>
              </div>
            </div>
            <a
              href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_ODgxYmZiOTItZjBlMy00NWE4LWE3ZjUtMWFkZTBmYjEwZWEy%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22790aa558-4c20-46ec-8708-30d8168cfa5d%22%7d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Join Meeting
            </a>
          </div>
        </div>
      </div>

      {/* Download App Banner */}
      <a
        href="https://mpb.health/download-app/"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block rounded-xl border border-th-accent-200 dark:border-th-accent-800 bg-gradient-to-r from-th-accent-50 via-blue-50 to-blue-50 dark:from-th-accent-950/40 dark:via-blue-950/30 dark:to-blue-950/30 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-th-accent-400 hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-th-accent-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-th-text-primary">
                Download the MPB Health App
              </h2>
              <p className="text-sm text-th-text-secondary mt-0.5">
                Get the company mobile app for on-the-go access to resources, member tools, and more.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium group-hover:bg-th-accent-700 transition-colors shrink-0">
            <span>Get the App</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </a>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
              <div className="aspect-[16/9] bg-surface-tertiary" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-surface-tertiary rounded" />
                <div className="h-3 w-full bg-surface-tertiary rounded" />
                <div className="h-3 w-2/3 bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayQuickLinks.map((link) => (
            <LinkCard
              key={`${link.label}-${link.url}`}
              label={link.label}
              url={link.url}
              image={link.image}
              description={link.description}
              isPopup={link.popup}
              onPopupClick={() => setPopupLink({ label: link.label, url: link.url })}
            />
          ))}
        </div>
      )}

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
