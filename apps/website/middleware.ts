/**
 * Vercel Edge Middleware — per-route SEO meta tag injection.
 *
 * On every page request, this middleware:
 *   1. Looks up `seo_metadata` for the request path (Supabase PostgREST)
 *   2. Fetches the static `index.html` from the deployment
 *   3. Rewrites <title>, meta description, OG tags, Twitter tags, canonical,
 *      robots, and inserts JSON-LD structured data (if present)
 *   4. Returns the modified HTML so social-media scrapers see fresh metadata
 *
 * Editing a row in the admin SEO page takes effect on the next request
 * (subject to the s-maxage cache below). No redeploy needed.
 *
 * Configured to run only for HTML page paths — assets, API, and files with
 * extensions are skipped via the matcher.
 */

export const config = {
  matcher: '/((?!api|assets|favicon|robots\\.txt|sitemap.*\\.xml|sw-push\\.js|googlee841e5614582c23b\\.html|.*\\.[a-zA-Z0-9]+).*)',
};

interface SeoRow {
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  canonical_url: string | null;
  robots: string | null;
  structured_data: Record<string, unknown> | null;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeHtmlText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fetchSeo = async (path: string): Promise<SeoRow | null> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const params = new URLSearchParams({
    page_path: `eq.${path}`,
    select:
      'page_path,meta_title,meta_description,meta_keywords,og_title,og_description,og_image,og_type,twitter_card,twitter_title,twitter_description,twitter_image,canonical_url,robots,structured_data',
    limit: '1',
  });

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/seo_metadata?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
      // Edge fetch: cache aggressively, revalidate every 5 min
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit);

    if (!res.ok) return null;
    const rows = (await res.json()) as SeoRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
};

const replaceTitle = (html: string, value: string): string =>
  html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(value)}</title>`);

const replaceMetaName = (html: string, name: string, value: string): string => {
  const re = new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escapeHtmlAttr(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const replaceMetaProp = (html: string, prop: string, value: string): string => {
  const re = new RegExp(`<meta\\s+property="${prop}"[^>]*>`, 'i');
  const tag = `<meta property="${prop}" content="${escapeHtmlAttr(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const replaceCanonical = (html: string, value: string): string => {
  const re = /<link\s+rel="canonical"[^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const injectStructuredData = (html: string, data: Record<string, unknown>): string => {
  const jsonLd = JSON.stringify(data).replace(/</g, '\\u003c');
  const tag = `<script type="application/ld+json">${jsonLd}</script>`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
};

const applySeo = (html: string, seo: SeoRow, requestUrl: string): string => {
  let out = html;
  const title = seo.meta_title;
  const description = seo.meta_description;

  if (title) {
    out = replaceTitle(out, title);
    out = replaceMetaProp(out, 'og:title', seo.og_title ?? title);
    out = replaceMetaName(out, 'twitter:title', seo.twitter_title ?? title);
  }
  if (description) {
    out = replaceMetaName(out, 'description', description);
    out = replaceMetaProp(out, 'og:description', seo.og_description ?? description);
    out = replaceMetaName(out, 'twitter:description', seo.twitter_description ?? description);
  }
  if (seo.og_image) {
    out = replaceMetaProp(out, 'og:image', seo.og_image);
    out = replaceMetaName(out, 'twitter:image', seo.twitter_image ?? seo.og_image);
  }
  if (seo.og_type) out = replaceMetaProp(out, 'og:type', seo.og_type);
  if (seo.twitter_card) out = replaceMetaName(out, 'twitter:card', seo.twitter_card);
  if (seo.canonical_url) out = replaceCanonical(out, seo.canonical_url);
  else out = replaceCanonical(out, requestUrl);
  out = replaceMetaProp(out, 'og:url', seo.canonical_url ?? requestUrl);
  if (seo.robots) out = replaceMetaName(out, 'robots', seo.robots);
  if (seo.meta_keywords && seo.meta_keywords.length > 0) {
    out = replaceMetaName(out, 'keywords', seo.meta_keywords.join(', '));
  }
  if (seo.structured_data && Object.keys(seo.structured_data).length > 0) {
    out = injectStructuredData(out, seo.structured_data);
  }
  return out;
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname === '' ? '/' : url.pathname;

  // Only process GET requests for HTML pages
  if (request.method !== 'GET') return fetch(request);

  // Lookup + asset fetch in parallel
  const [seo, htmlRes] = await Promise.all([
    fetchSeo(path),
    fetch(new URL('/index.html', url), { headers: { Accept: 'text/html' } }),
  ]);

  if (!htmlRes.ok) return htmlRes;
  if (!seo) {
    // No row for this path — pass the static HTML through with edge caching
    return new Response(htmlRes.body, {
      status: htmlRes.status,
      headers: {
        ...Object.fromEntries(htmlRes.headers),
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600',
        'X-Seo-Source': 'static',
      },
    });
  }

  const originalHtml = await htmlRes.text();
  const transformed = applySeo(originalHtml, seo, url.toString());

  return new Response(transformed, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // 5-minute edge cache, 1-hour stale-while-revalidate. Editing a row in
      // the admin propagates within 5 min worst-case (or instantly via purge).
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'X-Seo-Source': 'middleware',
      'X-Seo-Path': path,
    },
  });
}
