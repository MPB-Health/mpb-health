import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { getGeoLocationFromIP } from '../../lib/geoLocation';

export function StateEligibilityBanner() {
  const [isRestricted, setIsRestricted] = useState(false);
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      const dismissed = sessionStorage.getItem('eligibilityBannerDismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }

      const geoData = await getGeoLocationFromIP();

      if (geoData.isRestricted && geoData.message) {
        setIsRestricted(true);
        setMessage(geoData.message);
      }
    };

    checkEligibility();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('eligibilityBannerDismissed', 'true');
  };

  if (!isRestricted || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900">
              <span className="font-semibold">Service Availability Notice: </span>
              {message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
