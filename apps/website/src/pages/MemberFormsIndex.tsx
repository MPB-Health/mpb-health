import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuroraBand, LandingPage, PageHero, Sheet } from '../components/landing-redesign/page-kit';
import { MEMBER_FORM_CATEGORIES, getFormBySlug } from '../config/forms.config';

/** First sentence of a form description, used as its one-line purpose. */
const purpose = (description: string) => {
  const end = description.indexOf('. ');
  return end === -1 ? description : description.slice(0, end + 1);
};

/** Category titles in the config are title-cased; the design system uses sentence case. */
const sentenceCase = (title: string) =>
  title.charAt(0).toUpperCase() + title.slice(1).toLowerCase().replace(/ & /g, ' and ');

export default function MemberFormsIndex() {
  const categories = MEMBER_FORM_CATEGORIES.map((category) => ({
    ...category,
    forms: category.formSlugs.map((slug) => getFormBySlug(slug)).filter((form) => form !== undefined),
  })).filter((category) => category.forms.length > 0);

  return (
    <>
      <Helmet>
        <title>Member Forms | MPB Health</title>
        <meta name="description" content="Access all member forms to manage your MPB Health membership, healthcare needs, and account settings." />
        <link rel="canonical" href="https://mpb.health/member-forms/" />
      </Helmet>

      <LandingPage className="forms-index">
        <PageHero
          ariaLabel="Member forms"
          align="center"
          title="Member forms"
          lede="Manage your membership, healthcare needs, and account settings all in one place."
        />

        <Sheet>
          {categories.map((category, idx) => (
            <section
              key={category.title}
              className={`lr-sec${idx === 0 ? ' lr-sec--top' : ' lr-sec--hair'}`}
              aria-label={sentenceCase(category.title)}
            >
              <div className="lr-inner">
                <h2 className="lr-h2">{sentenceCase(category.title)}</h2>
                <p className="lr-body">{category.description}.</p>
                <ul className="lr-ledger lr-ledger--1">
                  {category.forms.map((form) => (
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
          ))}

          <AuroraBand
            ariaLabel="Need help with a form?"
            title="Need help with a form?"
            lede="Our support team can walk you through any member form or answer questions about your membership."
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
