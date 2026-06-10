#!/usr/bin/env node
/**
 * Regenerate sitemap-pages.xml from page-seo-data.json + page-seo-extra.mjs.
 * Writes to dist/ (and public/ so the source stays in sync for local preview).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_PAGE_SEO } from './page-seo-extra.mjs';
import { buildFormSeoMeta, isIndexableFormMeta } from './prerender-forms-lib.mjs';
import { SITE_URL } from './prerender-seo-lib.mjs';
import { createSupabaseClient, fetchAllRows } from './prerender-supabase.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const PUBLIC_DIR = path.join(APP_ROOT, 'public');
const DATA_PATH = path.join(APP_ROOT, 'src', 'lib', 'page-seo-data.json');

const HIGH_PRIORITY = new Set(['/', '/enrollment', '/plans', '/get-started', '/get-a-quote']);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isIndexable(meta) {
  const robots = String(meta.robots || 'index, follow').toLowerCase();
  return !robots.includes('noindex');
}

function priorityFor(route) {
  if (route === '/') return '1.0';
  if (HIGH_PRIORITY.has(route)) return '0.9';
  if (route.startsWith('/features') || route.startsWith('/benefits')) return '0.8';
  return '0.7';
}

function changefreqFor(route) {
  if (route === '/') return 'daily';
  if (HIGH_PRIORITY.has(route)) return 'weekly';
  return 'monthly';
}

function buildUrlset(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = routes
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([route]) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${route === '/' ? '/' : route}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreqFor(route)}</changefreq>
    <priority>${priorityFor(route)}</priority>
  </url>`,
    )
    .join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${entries}
</urlset>
`;
}

async function fetchDynamicFormRoutes() {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  try {
    const forms = await fetchAllRows(
      supabase,
      'cognito_forms',
      'slug, label, description, is_active, requires_auth',
      [
        ['eq', ['is_active', true]],
        ['order', ['sort_order', { ascending: true }]],
      ],
    );

    return forms
      .map((form) => buildFormSeoMeta(form))
      .filter((built) => built && isIndexableFormMeta(built.meta))
      .map(({ route }) => [route, { robots: 'index, follow' }]);
  } catch (err) {
    console.warn(`  ⚠ cognito_forms sitemap fetch failed: ${err?.message || err}`);
    return [];
  }
}

async function main() {
  if (!existsSync(DATA_PATH)) {
    console.error(`❌ generate-sitemap-pages: missing ${DATA_PATH}`);
    process.exit(1);
  }

  const baseSeo = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const pageSeo = { ...baseSeo, ...EXTRA_PAGE_SEO };
  const staticRoutes = Object.entries(pageSeo).filter(([, meta]) => isIndexable(meta));
  const dynamicFormRoutes = await fetchDynamicFormRoutes();

  const seen = new Set(staticRoutes.map(([route]) => route));
  const mergedRoutes = [
    ...staticRoutes,
    ...dynamicFormRoutes.filter(([route]) => {
      if (seen.has(route)) return false;
      seen.add(route);
      return true;
    }),
  ];

  const xml = buildUrlset(mergedRoutes);
  const targets = [path.join(PUBLIC_DIR, 'sitemap-pages.xml')];
  if (existsSync(DIST_DIR)) {
    targets.push(path.join(DIST_DIR, 'sitemap-pages.xml'));
  }

  for (const target of targets) {
    writeFileSync(target, xml, 'utf8');
  }

  console.log(
    `\n✅ generate-sitemap-pages: wrote ${mergedRoutes.length} URL(s)` +
      ` (${staticRoutes.length} static + ${dynamicFormRoutes.length} CMS /forms routes) to sitemap-pages.xml\n`,
  );
}

main().catch((err) => {
  console.error('❌ generate-sitemap-pages failed:', err);
  process.exit(1);
});
