import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import {
  AuroraBand,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

interface Task {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

interface Audience {
  id: string;
  title: string;
  lede: string;
  tasks: ReadonlyArray<Task>;
}

const AUDIENCES: ReadonlyArray<Audience> = [
  {
    id: 'employers',
    title: 'Employers and membership administrators',
    lede: 'Manage your group, your billing, and your paperwork.',
    tasks: [
      {
        title: 'Add or remove employees',
        description: 'Manage eligibility changes and terminations.',
        href: '/employee-removal',
      },
      {
        title: 'Update billing information',
        description: 'Change your payment method or list-bill details.',
        href: '/list-bill-update',
      },
      {
        title: 'Access compliance forms',
        description: 'Download required notices and regulatory documents.',
        href: '/state-notices',
      },
      {
        title: 'View group reports',
        description: 'Log in to the employer portal for analytics and summaries.',
        href: 'https://app.mpb.health/',
        external: true,
      },
      {
        title: 'Request support',
        description: 'Contact our employer support team.',
        href: '/contact',
      },
    ],
  },
  {
    id: 'members',
    title: 'Members and families',
    lede: 'Share a need, keep your details current, and get care.',
    tasks: [
      {
        title: 'Submit a medical need',
        description: 'Upload bills and documentation for sharing.',
        href: 'https://app.mpb.health/',
        external: true,
      },
      {
        title: 'Update personal information',
        description: 'Change your address, add dependents, or update payment.',
        href: 'https://app.mpb.health/',
        external: true,
      },
      {
        title: 'Access telehealth',
        description: 'Schedule a virtual visit with a licensed provider.',
        href: 'https://mpb.health/telehealth',
        external: true,
      },
      {
        title: 'Find a provider',
        description: 'Search the nationwide PPO network.',
        href: 'https://mpb.health/find-provider',
        external: true,
      },
      {
        title: 'Contact your advisor',
        description: 'Schedule a call or send a message.',
        href: '/review-or-change-advisor',
      },
    ],
  },
  {
    id: 'advisors',
    title: 'Advisors and brokers',
    lede: 'Everything you need to sell, enroll, and get paid.',
    tasks: [
      {
        title: 'Access marketing materials',
        description: 'Download pitch decks, one-pagers, and co-branded assets.',
        href: '/resources?audience=Advisors&type=Marketing',
      },
      {
        title: 'Submit a new group',
        description: 'Start enrollment for a new employer client.',
        href: '/contact',
      },
      {
        title: 'Request a commission statement',
        description: 'View or download commission reports.',
        href: '/contact',
      },
      {
        title: 'Get product training',
        description: 'Access recorded webinars and certification courses.',
        href: '/resources?audience=Advisors&type=Webinar',
      },
      {
        title: 'Partner support',
        description: 'Contact your dedicated partnership manager.',
        href: '/contact',
      },
    ],
  },
] as const;

function TaskLink({ task }: { task: Task }) {
  if (task.external) {
    return (
      <a href={task.href} target="_blank" rel="noopener noreferrer">
        {task.title}
      </a>
    );
  }
  return <Link to={task.href}>{task.title}</Link>;
}

const Support: React.FC = () => {
  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage className="spt">
        <PageHero
          ariaLabel="Support"
          align="center"
          title="How can we help?"
          lede="Get task-based support tailored to your role. Contact us directly or explore our knowledge base."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/contact">
                Contact support
              </Link>
              <Link className="lr-btn lr-btn--glass" to="/faq">
                Browse the FAQ
              </Link>
            </>
          }
        />

        <Sheet>
          {AUDIENCES.map((audience, i) => (
            <section
              key={audience.id}
              id={audience.id}
              className={`lr-sec ${i === 0 ? 'lr-sec--top' : 'lr-sec--hair'}`}
              aria-label={audience.title}
            >
              <div className="lr-inner">
                <SectionHead title={audience.title} lede={audience.lede} align="left" />
                <Reveal>
                  <ul className="lr-ledger">
                    {audience.tasks.map((task) => (
                      <li key={`${task.title}-${task.href}`}>
                        <h3>
                          <TaskLink task={task} />
                        </h3>
                        <p>{task.description}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </section>
          ))}

          <section className="lr-sec lr-sec--soft" aria-label="Still need help">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <h2 className="lr-h2">Still need help?</h2>
                  <p className="lr-body">
                    Our team is here to assist you. Call or email us during business hours, or send a
                    message and we will get back to you.
                  </p>
                  <p style={{ margin: '1.6rem 0 0' }}>
                    <Link className="lr-btn lr-btn--navy" to="/contact">
                      Contact us
                    </Link>
                  </p>
                </Reveal>
                <Reveal>
                  <div className="lr-panel lr-panel--soft">
                    <div className="lr-contact">
                      <div>
                        <div>
                          <h3>Phone</h3>
                          <a href="tel:8558164650">(855) 816-4650</a>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h3>Email</h3>
                          <a href="mailto:info@mympb.com">info@mympb.com</a>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h3>Hours</h3>
                          <p>Monday to Friday, 8am to 6pm EST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <AuroraBand
            title="Talk to a real person."
            lede="Our support team answers calls and emails Monday to Friday. Tell us what you need and we will point you to the right place."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/contact">
                  Contact support
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:8558164650">
                  Call (855) 816-4650
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

export { Support };
export default Support;
