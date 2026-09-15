import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mic2, Youtube, Music, UserPlus, Users, TrendingUp, Heart, ExternalLink, Check } from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './podcast.css';

const IDEAL_GUESTS = [
  'Healthcare professionals & behavioral health advocates',
  'Wellness & fitness leaders',
  'Entrepreneurs in the health space',
  'Patients with inspiring health journeys',
  'Community leaders passionate about healthcare',
];

const TOPICS = [
  { title: 'Healthcare Freedom', text: 'Exploring alternative healthcare models and patient empowerment' },
  { title: 'Nutrition & Wellness', text: 'Holistic approaches to health through nutrition and lifestyle' },
  { title: 'Behavioral Health', text: 'Addressing emotional wellness and healing strategies' },
  { title: 'Entrepreneurship', text: 'Building businesses in the health and wellness industry' },
  { title: 'Mindset & Healing', text: 'The power of mindset in health transformation' },
  { title: 'Patient Stories', text: 'Real experiences from health journeys and recoveries' },
  { title: 'Medical Innovation', text: 'Cutting-edge approaches to healthcare delivery' },
  { title: 'Community Health', text: 'Building healthier communities through shared support' },
];

const HealthyCarePodcast = () => {
  return (
    <>
      <Helmet>
        <title>HealthyCare Podcast | MPB Health</title>
        <meta
          name="description"
          content="Welcome to the HealthyCare Podcast — where wellness meets real life. Host Catherine Okubo talks with fighters, doctors, therapists, immigrants, and entrepreneurs about the true journey of health, hustle, and healing."
        />
      </Helmet>

      <div className="lr hiw pod">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="HealthyCare Podcast">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="pod-label">HealthyCare Podcast</p>
              <h1 className="hiw-hero__title">Where Wellness Meets Real Life</h1>
              <p className="hiw-hero__lede">
                Host Catherine Okubo talks with fighters, doctors, therapists, immigrants, and
                entrepreneurs about the true journey of health, hustle, and healing.
              </p>
              <div className="pod-hero__actions">
                <a
                  href="https://open.spotify.com/show/0Kwvp9GONcuOOU0l1Wuvpl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pod-btn pod-btn--spotify"
                >
                  <Music aria-hidden="true" />
                  <span>Listen on Spotify</span>
                </a>
                <a
                  href="https://www.youtube.com/@HealthyCarePodcast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pod-btn pod-btn--youtube"
                >
                  <Youtube aria-hidden="true" />
                  <span>Watch on YouTube</span>
                </a>
              </div>
            </div>
            <div className="pod-hero__media">
              <img
                className="hiw-hero__img"
                src="/assets/ac2f4013-8c50-4aa2-bae1-759215e530a9.jpg"
                alt="Catherine Okubo hosting the HealthyCare Podcast"
                fetchPriority="high"
                decoding="async"
              />
              <span className="pod-hero__badge">6,000+ Active Listeners</span>
            </div>
          </div>
        </section>

        {/* ── About the podcast ────────────────────────────────────── */}
        <section className="hiw-section" aria-label="About the podcast">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">About the Podcast</h2>
              <p className="hiw-body">
                Our HealthyCare Podcast spotlights real voices in health, wellness, and
                entrepreneurship
              </p>
            </div>

            <div className="pod-about-grid">
              <div className="pod-about-card">
                <div className="pod-about-card__icon">
                  <Heart aria-hidden="true" />
                </div>
                <h3 className="pod-about-card__title">Real Stories</h3>
                <p className="pod-about-card__text">
                  Authentic conversations with professionals and patients sharing their health
                  journeys and insights
                </p>
              </div>
              <div className="pod-about-card">
                <div className="pod-about-card__icon pod-about-card__icon--green">
                  <TrendingUp aria-hidden="true" />
                </div>
                <h3 className="pod-about-card__title">Expert Insights</h3>
                <p className="pod-about-card__text">
                  Healthcare professionals, wellness leaders, and entrepreneurs sharing practical
                  advice
                </p>
              </div>
              <div className="pod-about-card">
                <div className="pod-about-card__icon">
                  <Users aria-hidden="true" />
                </div>
                <h3 className="pod-about-card__title">Community Impact</h3>
                <p className="pod-about-card__text">
                  Reaching 6,000+ engaged MPB Health members with empowering health content
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Meet your host ───────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Meet your host">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Meet Your Host</h2>
            </div>

            <div className="pod-host">
              <div className="pod-host__media">
                <img src="/assets/Image (6) copy copy.jpg" alt="Catherine Okubo" loading="lazy" decoding="async" />
              </div>
              <div className="pod-host__body">
                <h3 className="pod-host__name">Catherine Okubo</h3>
                <p className="pod-host__role">Podcast Host</p>
                <p className="pod-host__bio">
                  Catherine brings together diverse voices from across the healthcare, wellness,
                  and entrepreneurship communities. Her engaging interview style creates meaningful
                  conversations that inspire and educate listeners on their health journeys.
                </p>
                <span className="pod-host__meta">
                  <Mic2 aria-hidden="true" />
                  Broadcasting weekly on Spotify &amp; YouTube
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Be a guest ───────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Be a guest on the podcast">
          <div className="hiw-inner">
            <div className="pod-guest">
              <img
                className="pod-guest__img"
                src="/assets/8473310a-eda8-4eb2-aeec-7c8996d9b661.jpg"
                alt="Be a Guest on the HealthyCare Podcast"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h2 className="pod-guest__title">Be a Guest on the HealthyCare Podcast!</h2>
                <p className="pod-guest__lede">
                  Share your expertise, inspire our community, and shape the future of healthcare.
                </p>

                <div className="pod-guest__panel">
                  <h3 className="pod-guest__panel-title">Ideal Guests Include:</h3>
                  <ul className="pod-guest__list">
                    {IDEAL_GUESTS.map((guest) => (
                      <li key={guest}>
                        <span className="pod-guest__check">
                          <Check aria-hidden="true" />
                        </span>
                        <span>{guest}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pod-guest__actions">
                  <a
                    href="https://joinmpb.com/healthy-care-podcast-invitation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pod-btn pod-btn--apply"
                  >
                    <UserPlus aria-hidden="true" />
                    <span>Apply to Be a Guest</span>
                  </a>
                </div>

                <p className="pod-guest__note">
                  Reach our audience of 6,000+ engaged MPB Health Members with your expertise
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Topics we cover ──────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Topics we cover">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <h2 className="hiw-title">Topics We Cover</h2>
              <p className="hiw-body">
                Practical stories and expert insights across the health and wellness spectrum
              </p>
            </div>

            <div className="pod-topics-grid">
              {TOPICS.map((topic) => (
                <div key={topic.title} className="pod-topic">
                  <h3 className="pod-topic__title">{topic.title}</h3>
                  <p className="pod-topic__text">{topic.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="pod-cta" aria-label="Start listening today">
          <div className="pod-cta__card">
            <div className="pod-cta__mic">
              <Mic2 aria-hidden="true" />
            </div>
            <h2 className="pod-cta__title">Start Listening Today</h2>
            <p className="pod-cta__text">
              Join thousands of listeners discovering inspiring health stories and expert insights
            </p>

            <div className="pod-cta__actions">
              <a
                href="https://open.spotify.com/show/0Kwvp9GONcuOOU0l1Wuvpl"
                target="_blank"
                rel="noopener noreferrer"
                className="pod-btn pod-btn--spotify"
              >
                <Music aria-hidden="true" />
                <span>Listen on Spotify</span>
                <ExternalLink aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@HealthyCarePodcast"
                target="_blank"
                rel="noopener noreferrer"
                className="pod-btn pod-btn--youtube"
              >
                <Youtube aria-hidden="true" />
                <span>Watch on YouTube</span>
                <ExternalLink aria-hidden="true" />
              </a>
            </div>

            <div className="pod-cta__divider">
              <p className="pod-cta__question">Interested in sharing your story?</p>
              <a
                href="https://joinmpb.com/healthy-care-podcast-invitation/"
                target="_blank"
                rel="noopener noreferrer"
                className="pod-cta__guest-link"
              >
                <span>Apply to Be a Guest</span>
                <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export default HealthyCarePodcast;
