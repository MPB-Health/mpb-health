import React from 'react';
import { useMediaSetting } from '../../lib/siteMediaService';

const ExplainerVideo: React.FC = () => {
  const { url: videoUrl, loading } = useMediaSetting('video_explainer');

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            How MPB Health Works
          </h2>
          <p className="text-lg sm:text-xl text-neutral-700 max-w-3xl mx-auto">
            Watch this short video to understand how our community health sharing model can help you save on healthcare costs.
          </p>
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <iframe
              src={videoUrl}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
              title="MPB Health Explainer Video"
            ></iframe>
          )}
        </div>
        <script src="https://player.vimeo.com/api/player.js"></script>
      </div>
    </section>
  );
};

export { ExplainerVideo };
