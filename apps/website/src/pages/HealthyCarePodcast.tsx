import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

const SPOTIFY_URL = 'https://open.spotify.com/show/0Kwvp9GONcuOOU0l1Wuvpl';
const YOUTUBE_URL = 'https://www.youtube.com/@HealthyCarePodcast';
/** Channel uploads playlist (UC → UU): the embed always opens on the latest episode. */
const YOUTUBE_EMBED_URL =
  'https://www.youtube-nocookie.com/embed/videoseries?list=UUvmr45dwOiJ0CuTsSojLdgw&rel=0';
const GUEST_APPLY_URL = 'https://joinmpb.com/healthy-care-podcast-invitation/';

const ABOUT = [
  {
    title: 'Real stories',
    text: 'Authentic conversations with professionals and patients sharing their health journeys and insights.',
  },
  {
    title: 'Expert insights',
    text: 'Healthcare professionals, wellness leaders, and entrepreneurs sharing practical advice.',
  },
  {
    title: 'Community impact',
    text: 'Reaching 6,000+ engaged MPB Health members with empowering health content.',
  },
] as const;

const HOST = [
  {
    title: 'Catherine Okubo, podcast host',
    text: 'Catherine brings together diverse voices from across the healthcare, wellness, and entrepreneurship communities. Her interview style creates meaningful conversations that inspire and educate listeners on their health journeys.',
  },
  {
    title: 'New episodes weekly',
    text: 'Listen on Spotify or watch on YouTube, wherever you already follow your shows.',
  },
] as const;

const TOPICS = [
  { title: 'Healthcare freedom', text: 'Exploring alternative healthcare models and patient empowerment.' },
  { title: 'Nutrition and wellness', text: 'Holistic approaches to health through nutrition and lifestyle.' },
  { title: 'Behavioral health', text: 'Addressing emotional wellness and healing strategies.' },
  { title: 'Entrepreneurship', text: 'Building businesses in the health and wellness industry.' },
  { title: 'Mindset and healing', text: 'The power of mindset in health transformation.' },
  { title: 'Patient stories', text: 'Real experiences from health journeys and recoveries.' },
  { title: 'Medical innovation', text: 'New approaches to healthcare delivery.' },
  { title: 'Community health', text: 'Building healthier communities through shared support.' },
] as const;

const IDEAL_GUESTS = [
  'Healthcare professionals and behavioral health advocates',
  'Wellness and fitness leaders',
  'Entrepreneurs in the health space',
  'Patients with inspiring health journeys',
  'Community leaders passionate about healthcare',
] as const;

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

      <LandingPage className="lr-podcast">
        <PageHero
          ariaLabel="HealthyCare podcast"
          kicker="HealthyCare podcast"
          title="Where wellness meets real life."
          lede="Host Catherine Okubo talks with fighters, doctors, therapists, immigrants, and entrepreneurs about the true journey of health, hustle, and healing."
          actions={
            <>
              <a className="lr-btn lr-btn--white" href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer">
                Listen on Spotify
              </a>
              <a className="lr-btn lr-btn--glass" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                Watch on YouTube
              </a>
            </>
          }
          micro="New episodes weekly, reaching 6,000+ MPB Health members."
          panel={
            <div className="lr-panel lr-podcast__player">
              <iframe
                title="Latest HealthyCare Podcast episodes on YouTube"
                src={YOUTUBE_EMBED_URL}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="About the podcast">
            <div className="lr-inner">
              <SectionHead
                title="Real voices in health, wellness, and entrepreneurship."
                lede="The HealthyCare Podcast spotlights the people doing the work,"
                ledeMuted="and the lessons they learned along the way."
              />
              <ul className="lr-ledger lr-ledger--3">
                {ABOUT.map(({ title, text }) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Meet your host">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/ac2f4013-8c50-4aa2-bae1-759215e530a9.jpg"
                      alt="Catherine Okubo, host of the HealthyCare Podcast"
                      width={532}
                      height={800}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="lr-h2">Meet your host.</h2>
                  <ul className="lr-ledger lr-ledger--1">
                    {HOST.map(({ title, text }) => (
                      <li key={title}>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec" aria-label="Topics we cover">
            <div className="lr-inner">
              <SectionHead
                title="Topics we cover."
                lede="Practical stories and expert insights"
                ledeMuted="across the health and wellness spectrum."
              />
              <ul className="lr-ledger lr-ledger--3 lr-ledger--tight">
                {TOPICS.map(({ title, text }) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lr-sec lr-sec--hair" aria-label="Be a guest">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <h2 className="lr-h2">Be a guest on the show.</h2>
                  <p className="lr-body">
                    Share your expertise, inspire our community, and help shape the future of
                    healthcare. Guests reach an audience of 6,000+ engaged MPB Health members.
                  </p>
                  <p style={{ margin: '1.6rem 0 0' }}>
                    <a
                      className="lr-btn lr-btn--navy"
                      href={GUEST_APPLY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply to be a guest
                    </a>
                  </p>
                </Reveal>
                <Reveal>
                  <div className="lr-panel lr-panel--soft">
                    <h3 className="lr-panel__title">Who we're looking for</h3>
                    <ul className="lr-checks" style={{ marginTop: 0 }}>
                      {IDEAL_GUESTS.map((item) => (
                        <li key={item}>
                          <Check strokeWidth={3} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <AuroraBand
            ariaLabel="Subscribe"
            title="Start listening today."
            lede="Join thousands of listeners discovering inspiring health stories and expert insights. Subscribe wherever you listen."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer">
                  Subscribe on Spotify
                </a>
                <a className="lr-btn lr-btn--glass" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                  Subscribe on YouTube
                </a>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export default HealthyCarePodcast;
