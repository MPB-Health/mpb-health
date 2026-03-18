import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Video } from 'lucide-react';
import { TestimonialShowcase } from '../components/blocks/TestimonialShowcase';

interface VideoTestimonial {
  youtubeId: string;
  member: string;
  title: string;
  description: string;
}

const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    youtubeId: 'jCnSANDcmFM',
    member: 'James Lee',
    title: 'Member Testimonial',
    description: 'James shares his firsthand experience as an MPB Health member.',
  },
  {
    youtubeId: 'BRANDEE_POLAND_VIDEO_ID',
    member: 'Brandee Poland',
    title: 'Member Experience',
    description: 'Brandee talks about how MPB Health made a difference for her.',
  },
];

const VideoCard: React.FC<{ video: VideoTestimonial }> = ({ video }) => {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Video area */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-900 to-neutral-900">
        {playing ? (
          <iframe
            src={embedUrl}
            title={`${video.member} — ${video.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            {!thumbnailFailed && (
              <img
                src={thumbnailUrl}
                alt={`${video.member} — ${video.title}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('maxresdefault')) {
                    target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                  } else {
                    setThumbnailFailed(true);
                  }
                }}
              />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/20" />
            {/* Play button */}
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${video.member} testimonial video`}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-16 h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                <Play className="w-7 h-7 text-blue-600 ml-1 fill-current" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            {video.title}
          </span>
        </div>
        <p className="text-base font-bold text-gray-900">{video.member}</p>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{video.description}</p>
      </div>
    </div>
  );
};

const MemberStories: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Member Stories - Real Families, Real Savings | MPB Health</title>
        <meta
          name="description"
          content="Read inspiring stories from MPB Health members who have saved thousands on healthcare costs. Discover how community health sharing has transformed their lives."
        />
        <meta name="keywords" content="health sharing testimonials, member stories, healthcare savings, MPB Health reviews, real savings stories" />

        {/* Open Graph */}
        <meta property="og:title" content="Member Stories - Real Families, Real Savings | MPB Health" />
        <meta property="og:description" content="Read inspiring stories from MPB Health members who have saved thousands on healthcare costs." />
        <meta property="og:type" content="website" />
      </Helmet>

      <TestimonialShowcase />

      {/* Customer Review Videos */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <Video className="w-4 h-4" />
              Video Reviews
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Hear It Directly From Our Members
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Real members, real experiences — in their own words.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {VIDEO_TESTIMONIALS.map((video) => (
              <VideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export { MemberStories };
export default MemberStories;
