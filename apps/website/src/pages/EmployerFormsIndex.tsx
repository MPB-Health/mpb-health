import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuroraBand, LandingPage, PageHero, Sheet } from '../components/landing-redesign/page-kit';
import { getEmployerForms } from '../config/forms.config';

/** First sentence of a form description, used as its one-line purpose. */
const purpose = (description: string) => {
  const end = description.indexOf('. ');
  return end === -1 ? description : description.slice(0, end + 1);
};

export default function EmployerFormsIndex() {
  const employerForms = getEmployerForms();

  return (
    <>
      <Helmet>
        <title>Employer Forms | MPB Health</title>
        <meta name="description" content="Access all employer forms for managing your organization's health sharing membership with MPB Health." />
        <link rel="canonical" href="https://mpb.health/employer-forms/" />
      </Helmet>

      <LandingPage className="forms-index">
        <PageHero
          ariaLabel="Employer forms"
          align="center"
          title="Employer forms"
          lede="Manage your organization's health sharing membership with our streamlined employer forms."
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Employer forms">
            <div className="lr-inner">
              <h2 className="lr-h2">List-bill and roster forms</h2>
              <ul className="lr-ledger lr-ledger--1">
                {employerForms.map((form) => (
                  <li key={form.slug}>
                    <h3>
                      <Link to={form.slug}>{form.label}</Link>
                    </h3>
                    <p>
                      {purpose(form.description)}
                      {form.estimatedMinutes ? ` About ${form.estimatedMinutes} minutes.` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <AuroraBand
            ariaLabel="Need help with a form?"
            title="Need help with a form?"
            lede="Our support team can walk you through any employer form or answer questions about your group membership."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
                <Link className="lr-btn lr-btn--glass" to="/contact">
                  Contact us
                </Link>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
}
