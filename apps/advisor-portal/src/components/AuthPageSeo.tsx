import { Helmet } from 'react-helmet-async';

interface AuthPageSeoProps {
  title: string;
  description?: string;
}

/** Auth flows should not compete in search results with marketing pages. */
export function AuthPageSeo({ title, description }: AuthPageSeoProps) {
  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta name="robots" content="noindex, follow" />
    </Helmet>
  );
}
