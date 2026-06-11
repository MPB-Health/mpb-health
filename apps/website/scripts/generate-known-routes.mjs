#!/usr/bin/env node
/**
 * Build-time allowlist for edge middleware 404 handling.
 * Unknown paths (e.g. /fomotojomo/) return HTTP 404 instead of SPA index.html.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_PAGE_SEO } from './page-seo-extra.mjs';
import { NOT_FOUND_HTML } from './not-found-html.mjs';
import { createSupabaseClient, fetchAllRows } from './prerender-supabase.mjs';
import { buildFormSeoMeta } from './prerender-forms-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(APP_ROOT, 'generated', 'known-routes.mjs');
const DATA_PATH = path.join(APP_ROOT, 'src', 'lib', 'page-seo-data.json');

/** Mirrors MANAGED_SITE_PATHS in src/lib/sitePageFallbacks.tsx */
const MANAGED_SITE_PATHS = [
  '/',
  '/mvp',
  '/plans',
  '/compare-plans',
  '/enrollment',
  '/get-started',
  '/get-a-quote',
  '/individuals-and-families',
  '/businesses-and-organizations',
  '/advisors-and-brokers',
  '/how-it-works',
  '/faq',
  '/support',
  '/join-our-team',
  '/download-app',
  '/welcome',
  '/advisor-directory',
  '/member-stories',
  '/podcast',
  '/about-us',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/state-notices',
  '/washington-statement',
  '/education-enrollment',
  '/insights-analytics',
  '/resources',
  '/features',
  '/blog',
  '/events',
];

/** Client-only redirects and utility routes not always in SEO data. */
const EXTRA_STATIC_PATHS = [
  '/quote',
  '/calculator',
  '/freequote',
  '/individuals-families',
  '/businesses-organizations',
  '/resource-library',
  '/resources/how-to-submit-a-sharing-need',
  '/care-support-hub',
  '/member-portal',
  '/member-portal/account',
  '/review-or-change-advisor',
  '/schedule-welcome-call',
  '/logout',
  '/forbidden',
  '/newsletter/unsubscribe',
  '/employer-forms',
  '/member-forms',
  '/login',
  '/forgot-password',
  '/auth/confirm',
  '/reset-password',
  '/mfa-enrollment',
  '/admin/login',
];

const PROTECTED_PREFIXES = ['/admin', '/member', '/advisor'];

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function collectStaticPaths() {
  const paths = new Set([...MANAGED_SITE_PATHS, ...EXTRA_STATIC_PATHS]);

  if (existsSync(DATA_PATH)) {
    for (const route of Object.keys(JSON.parse(readFileSync(DATA_PATH, 'utf8')))) {
      paths.add(normalizePath(route));
    }
  }

  for (const route of Object.keys(EXTRA_PAGE_SEO)) {
    paths.add(normalizePath(route));
  }

  return [...paths].sort();
}

async function fetchDynamicPaths() {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const dynamic = new Set();

  const addRows = (prefix, rows, slugKey = 'slug') => {
    for (const row of rows) {
      const slug = String(row[slugKey] || '').trim();
      if (!slug) continue;
      dynamic.add(normalizePath(`${prefix}/${slug}`));
    }
  };

  try {
    const articles = await fetchAllRows(
      supabase,
      'blog_articles',
      'slug, category',
      [['eq', ['is_published', true]]],
    );
    for (const article of articles) {
      if (!article.slug) continue;
      const prefix = article.category === 'Event' ? '/events' : '/blog';
      dynamic.add(normalizePath(`${prefix}/${article.slug}`));
    }
  } catch (err) {
    console.warn(`  ⚠ blog_articles known-routes fetch failed: ${err?.message || err}`);
  }

  try {
    const resources = await fetchAllRows(
      supabase,
      'resource_library',
      'slug',
      [['eq', ['is_published', true]]],
    );
    addRows('/resources', resources);
  } catch (err) {
    console.warn(`  ⚠ resource_library known-routes fetch failed: ${err?.message || err}`);
  }

  try {
    const pages = await fetchAllRows(
      supabase,
      'cms_pages',
      'slug, path, is_published',
      [['eq', ['is_published', true]]],
    );
    for (const page of pages) {
      const slug = String(page.slug || '').trim();
      const cmsPath = String(page.path || '').trim();
      if (slug) dynamic.add(normalizePath(`/p/${slug}`));
      if (cmsPath) dynamic.add(normalizePath(cmsPath));
    }
  } catch (err) {
    console.warn(`  ⚠ cms_pages known-routes fetch failed: ${err?.message || err}`);
  }

  try {
    const categories = await fetchAllRows(
      supabase,
      'healthcare_plan_categories',
      'slug',
      [['eq', ['is_active', true]]],
    );
    addRows('/plan-categories', categories);
  } catch (err) {
    console.warn(`  ⚠ healthcare_plan_categories known-routes fetch failed: ${err?.message || err}`);
  }

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
    for (const form of forms) {
      const built = buildFormSeoMeta(form);
      if (built?.route) dynamic.add(normalizePath(built.route));
    }
  } catch (err) {
    console.warn(`  ⚠ cognito_forms known-routes fetch failed: ${err?.message || err}`);
  }

  return [...dynamic].sort();
}

function writeKnownRoutes(staticPaths, dynamicPaths) {
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const body = `/**
 * Known public routes for Vercel Edge Middleware 404 handling.
 * Regenerated at build/install by scripts/generate-known-routes.mjs.
 */
export const STATIC_PATHS = new Set(${JSON.stringify(staticPaths, null, 2)});

export const KNOWN_DYNAMIC_PATHS = new Set(${JSON.stringify(dynamicPaths, null, 2)});

export const PROTECTED_PREFIXES = ${JSON.stringify(PROTECTED_PREFIXES, null, 2)};

export const NOT_FOUND_HTML = ${JSON.stringify(NOT_FOUND_HTML)};

export function normalizeKnownPath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isKnownRoute(pathname) {
  const normalized = normalizeKnownPath(pathname);
  if (normalized === '/') return true;
  if (STATIC_PATHS.has(normalized)) return true;
  if (KNOWN_DYNAMIC_PATHS.has(normalized)) return true;
  if (PROTECTED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix + '/'))) {
    return true;
  }
  return false;
}
`;
  writeFileSync(OUTPUT_PATH, body, 'utf8');
}

async function main() {
  const staticPaths = collectStaticPaths();
  const dynamicPaths = await fetchDynamicPaths();
  writeKnownRoutes(staticPaths, dynamicPaths);
  console.log(
    `\n✅ generate-known-routes: ${staticPaths.length} static + ${dynamicPaths.length} dynamic path(s) → generated/known-routes.mjs\n`,
  );
}

main().catch((err) => {
  console.error('❌ generate-known-routes failed:', err);
  process.exit(1);
});
