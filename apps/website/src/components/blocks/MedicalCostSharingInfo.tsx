import React, { useState, useEffect } from 'react';
import { HealthSharingAccordion } from './HealthSharingAccordion';
import { ChevronDown, Play } from 'lucide-react';
import { useFAQByCategory } from '../../hooks/useFAQ';
import { siteMediaService } from '../../lib/siteMediaService';

const MedicalCostSharingInfo: React.FC = () => {
  const [isAccordionVisible, setIsAccordionVisible] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { faqItems } = useFAQByCategory('why-choose-healthsharing');
  const [videoUrl, setVideoUrl] = useState('https://player.vimeo.com/video/1135808114?h=c0bfafd29e&autoplay=1');

  useEffect(() => {
    const loadVideoUrl = async () => {
      const url = await siteMediaService.getVideoUrl('video_medical_sharing', { autoplay: true });
      setVideoUrl(url);
    };
    loadVideoUrl();
  }, []);

  useEffect(() => {
    if (faqItems.length > 0 && isAccordionVisible) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.title,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.content_html.replace(/<[^>]*>/g, '')
          }
        }))
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(faqSchema);
      script.id = 'faq-schema';

      const existingScript = document.getElementById('faq-schema');
      if (existingScript) {
        existingScript.remove();
      }

      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById('faq-schema');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [faqItems, isAccordionVisible]);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div className="order-2 md:order-1 relative h-[300px] md:h-[400px] group cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>

            {!isVideoPlaying ? (
              <>
                <img
                  src="/assets/Untitled-design89.jpg"
                  alt="Community healthcare support - diverse group of people joining hands together"
                  className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-10 h-10 text-blue-600 ml-1" fill="currentColor" />
                  </div>
                </div>
              </>
            ) : (
              <iframe
                title="Medical Cost Sharing Explanation Video"
                src={videoUrl}
                className="relative rounded-2xl shadow-2xl w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                allowFullScreen
              />
            )}
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900">
              What is Medical Cost Sharing?
            </h2>
            <div className="space-y-4 text-lg sm:text-xl text-neutral-700 leading-relaxed">
              <p>
                This is a health care sharing membership, not traditional insurance.
              </p>
              <p>
                Instead of paying premiums to an insurance company, members contribute to a shared community fund. When a member has eligible medical expenses that go beyond their chosen initial amount, they can submit those bills that are approved under the program guidelines, the community funds are used to pay the costs.
              </p>
              <p>
                It's a community-based approach, people helping people, not a profit-driven insurance model.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsAccordionVisible(!isAccordionVisible)}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 animate-pulse hover:animate-none"
              >
                Why Choose HealthSharing
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 group-hover:translate-y-1 ${
                    isAccordionVisible ? 'rotate-180' : 'animate-bounce'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isAccordionVisible
              ? 'max-h-[3000px] opacity-100 mt-8'
              : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <HealthSharingAccordion />
        </div>
      </div>
    </section>
  );
};

export { MedicalCostSharingInfo };
