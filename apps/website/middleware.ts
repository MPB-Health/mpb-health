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

interface BlogArticleRow {
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  author: string | null;
  published_date: string | null;
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

const fetchBlogArticle = async (slug: string): Promise<BlogArticleRow | null> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    is_published: 'eq.true',
    select: 'title,slug,excerpt,featured_image_url,category,author,published_date',
    limit: '1',
  });

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_articles?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit);

    if (!res.ok) return null;
    const rows = (await res.json()) as BlogArticleRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
};

/** Convert a blog_articles row into the SeoRow shape expected by applySeo. */
const blogArticleToSeo = (a: BlogArticleRow, pagePath: string, requestUrl: string): SeoRow => {
  const title = `${a.title} | MPB Health Blog`;
  const description = (a.excerpt && a.excerpt.trim()) || `Read "${a.title}" on the MPB Health blog.`;
  const image = a.featured_image_url && a.featured_image_url.trim() ? a.featured_image_url : null;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description,
    image: image ? [image] : undefined,
    datePublished: a.published_date ?? undefined,
    author: { '@type': 'Person', name: a.author || 'MPB Health' },
    publisher: { '@type': 'Organization', name: 'MPB Health' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': requestUrl },
    articleSection: a.category ?? undefined,
  };
  return {
    page_path: pagePath,
    meta_title: title,
    meta_description: description,
    meta_keywords: null,
    og_title: title,
    og_description: description,
    og_image: image,
    og_type: 'article',
    twitter_card: 'summary_large_image',
    twitter_title: title,
    twitter_description: description,
    twitter_image: image,
    canonical_url: requestUrl,
    robots: 'index,follow',
    structured_data: articleSchema as unknown as Record<string, unknown>,
  };
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

/**
 * Resolve the SEO row for a path. Lookup chain:
 *   1. seo_metadata table — admin override always wins
 *   2. /blog/:slug → blog_articles table — auto-derived from the post itself
 *      so each blog post has correct meta without manual entry
 *   3. null — caller falls back to static index.html
 */
const resolveSeo = async (path: string, requestUrl: string): Promise<{ seo: SeoRow; source: string } | null> => {
  const override = await fetchSeo(path);
  if (override) return { seo: override, source: 'seo_metadata' };

  const blogMatch = path.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    const article = await fetchBlogArticle(slug);
    if (article) {
      return { seo: blogArticleToSeo(article, path, requestUrl), source: 'blog_articles' };
    }
  }

  return null;
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname === '' ? '/' : url.pathname;

  // Only process GET requests for HTML pages
  if (request.method !== 'GET') return fetch(request);

  // Lookup + asset fetch in parallel
  const [resolved, htmlRes] = await Promise.all([
    resolveSeo(path, url.toString()),
    fetch(new URL('/index.html', url), { headers: { Accept: 'text/html' } }),
  ]);

  if (!htmlRes.ok) return htmlRes;
  if (!resolved) {
    // No SEO row for this path — pass the static HTML through with edge caching
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
  const transformed = applySeo(originalHtml, resolved.seo, url.toString());

  return new Response(transformed, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // 5-minute edge cache, 1-hour stale-while-revalidate. Editing a row in
      // the admin (or publishing a blog post) propagates within 5 min worst-case.
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'X-Seo-Source': resolved.source,
      'X-Seo-Path': path,
    },
  });
}
