#!/usr/bin/env node
/**
 * Build-time sitemap generation for blog articles and resource library pages.
 * Writes sitemap-blog.xml, sitemap-resources.xml, and updates sitemap.xml index in dist/.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from './prerender-seo-lib.mjs';
import { createSupabaseClient, fetchAllRows } from './prerender-supabase.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const PUBLIC_DIR = path.join(APP_ROOT, 'public');

function formatDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

function buildSitemapIndex(sitemaps) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = sitemaps
    .map(
      (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`,
    )
    .join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('❌ generate-sitemaps: dist/ not found. Run vite build first.');
    process.exit(1);
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    console.warn(
      '\n⚠️  generate-sitemaps: Supabase env not configured — skipping dynamic sitemap generation.\n',
    );
    return;
  }

  console.log('\n🗺️  generate-sitemaps: fetching published content…\n');

  let blogArticles = [];
  let resources = [];

  try {
    blogArticles = await fetchAllRows(
      supabase,
      'blog_articles',
      'slug, published_date, updated_at',
      [
        ['eq', ['is_published', true]],
        ['neq', ['category', 'Event']],
        ['order', ['published_date', { ascending: false }]],
      ],
    );
  } catch (err) {
    console.warn(`  ⚠ blog_articles: ${err?.message || err}`);
  }

  try {
    resources = await fetchAllRows(
      supabase,
      'resource_library',
      'slug, published_date, updated_at',
      [
        ['eq', ['is_published', true]],
        ['order', ['published_date', { ascending: false }]],
      ],
    );
  } catch (err) {
    console.warn(`  ⚠ resource_library: ${err?.message || err}`);
  }

  const blogEntries = [
    urlEntry(`${SITE_URL}/blog`, formatDate(new Date()), 'daily', '0.8'),
    urlEntry(`${SITE_URL}/events`, formatDate(new Date()), 'weekly', '0.7'),
    ...blogArticles
      .filter((a) => a.slug)
      .map((a) =>
        urlEntry(
          `${SITE_URL}/blog/${a.slug}`,
          formatDate(a.updated_at || a.published_date),
          'monthly',
          '0.6',
        ),
      ),
  ];

  const resourceEntries = [
    urlEntry(`${SITE_URL}/resources`, formatDate(new Date()), 'weekly', '0.7'),
    ...resources
      .filter((r) => r.slug)
      .map((r) =>
        urlEntry(
          `${SITE_URL}/resources/${r.slug}`,
          formatDate(r.updated_at || r.published_date),
          'monthly',
          '0.6',
        ),
      ),
  ];

  writeFileSync(path.join(DIST_DIR, 'sitemap-blog.xml'), buildUrlset(blogEntries), 'utf8');
  writeFileSync(path.join(DIST_DIR, 'sitemap-resources.xml'), buildUrlset(resourceEntries), 'utf8');

  const indexPath = existsSync(path.join(DIST_DIR, 'sitemap.xml'))
    ? path.join(DIST_DIR, 'sitemap.xml')
    : path.join(PUBLIC_DIR, 'sitemap.xml');

  const sitemapIndex = buildSitemapIndex([
    `${SITE_URL}/sitemap-pages.xml`,
    `${SITE_URL}/sitemap-geo.xml`,
    `${SITE_URL}/sitemap-blog.xml`,
    `${SITE_URL}/sitemap-resources.xml`,
  ]);
  writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapIndex, 'utf8');

  console.log(`  ✓ sitemap-blog.xml (${blogArticles.length} articles)`);
  console.log(`  ✓ sitemap-resources.xml (${resources.length} resources)`);
  console.log('  ✓ sitemap.xml index updated');
  console.log('\n✅ generate-sitemaps: done.\n');
}

main().catch((err) => {
  console.error('❌ generate-sitemaps failed:', err);
  process.exit(1);
});
