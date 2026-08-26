import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Star, TrendingUp, Users } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import { TestimonialShowcase } from '../components/blocks/TestimonialShowcase';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './member-stories.css';

interface VideoTestimonial {
  youtubeId: string;
  member: string;
  title: string;
  description: string;
  thumbnail?: string;
}

const YOUTUBE_THUMB_FALLBACKS = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];

const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    youtubeId: 'nu4KS8IyTmM',
    member: 'James Lee',
    title: 'Member Testimonial',
    description: 'James shares his firsthand experience as an MPB Health member.',
  },
  {
    youtubeId: 'R18V5bhSOEo',
    member: 'Brandee Poland',
    title: 'Member Experience',
    description: 'Brandee talks about how MPB Health made a difference for her.',
  },
];

const VideoCard: React.FC<{ video: VideoTestimonial }> = ({ video }) => {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailUrl = video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/${YOUTUBE_THUMB_FALLBACKS[0]}.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`;

  return (
    <div className="ms-video-card">
      <div className="ms-video-card__media">
        {playing ? (
          <iframe
            src={embedUrl}
            title={`${video.member} — ${video.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {!thumbnailFailed && (
              <img
                src={thumbnailUrl}
                alt={`${video.member} — ${video.title}`}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (video.thumbnail) {
                    setThumbnailFailed(true);
                    return;
                  }
                  const target = e.currentTarget;
                  const currentRes = YOUTUBE_THUMB_FALLBACKS.find((r) => target.src.includes(r));
                  const nextIdx = currentRes ? YOUTUBE_THUMB_FALLBACKS.indexOf(currentRes) + 1 : YOUTUBE_THUMB_FALLBACKS.length;
                  if (nextIdx < YOUTUBE_THUMB_FALLBACKS.length) {
                    target.src = `https://img.youtube.com/vi/${video.youtubeId}/${YOUTUBE_THUMB_FALLBACKS[nextIdx]}.jpg`;
                  } else {
                    setThumbnailFailed(true);
                  }
                }}
              />
            )}
            <div className="ms-video-card__overlay" />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${video.member} testimonial video`}
              className="ms-video-card__play"
            >
              <span className="ms-video-card__play-circle">
                <Play aria-hidden="true" />
              </span>
            </button>
          </>
        )}
      </div>

      <div className="ms-video-card__body">
        <p className="ms-video-card__kicker">{video.title}</p>
        <p className="ms-video-card__name">{video.member}</p>
        <p className="ms-video-card__desc">{video.description}</p>
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

      <div className="lr hiw ms">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="Member stories">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="ms-label">Member Stories</p>
              <h1 className="hiw-hero__title">Real Families. Real Savings.</h1>
              <p className="hiw-hero__lede">
                Hear directly from members whose lives have been changed by community health
                sharing.
              </p>
              <div className="ms-hero__stats">
                <span className="ms-stat">
                  <Star aria-hidden="true" style={{ fill: 'currentColor' }} />
                  4.9/5 Rating
                </span>
                <span className="ms-stat">
                  <TrendingUp aria-hidden="true" />
                  $3,400 Avg. Savings
                </span>
                <span className="ms-stat">
                  <Users aria-hidden="true" />
                  12K+ Members
                </span>
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="MPB Health members sharing their stories"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Testimonial carousel + stats + CTA ───────────────────── */}
        <TestimonialShowcase />

        {/* ── Customer review videos ───────────────────────────────── */}
        <section className="hiw-section" aria-label="Video reviews">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="ms-label">Video Reviews</p>
              <h2 className="hiw-title">Hear It Directly From Our Members</h2>
              <p className="hiw-body">Real members, real experiences — in their own words.</p>
            </div>

            <div className="ms-videos">
              {VIDEO_TESTIMONIALS.map((video) => (
                <VideoCard key={video.youtubeId} video={video} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { MemberStories };
export default MemberStories;
