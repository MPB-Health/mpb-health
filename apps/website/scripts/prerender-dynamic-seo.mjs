#!/usr/bin/env node
/**
 * Build-time SEO prerender for dynamic CMS content (blog articles + resources).
 *
 * Fetches published rows from Supabase and writes dist/<route>/index.html
 * with unique metadata and crawler-visible body copy. Skips gracefully when
 * Supabase env vars are unavailable (local builds without .env).
 *
 * Run after prerender-seo.mjs: node scripts/prerender-dynamic-seo.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';
import {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  normalizeDescription,
  stripHtml,
  writePrerenderedRoute,
} from './prerender-seo-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

const PAGE_SIZE = 100;

function loadSupabaseConfig() {
  const repoRoot = path.resolve(APP_ROOT, '../..');
  const env = {
    ...loadEnv('production', repoRoot, ''),
    ...loadEnv('production', APP_ROOT, ''),
  };
  const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

async function fetchAllRows(supabase, table, select, filters) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    for (const [method, args] of filters) {
      query = query[method](...args);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function blogArticleToMeta(article) {
  const route = `/blog/${article.slug}`;
  const description = normalizeDescription(
    article.excerpt || article.content,
    'Expert health sharing insights and affordable healthcare tips from the MPB Health blog.',
  );
  const bodySource = article.excerpt || article.content;
  const bodyExcerpt = stripHtml(bodySource).slice(0, 480);

  return {
    route,
    meta: {
      title: `${article.title} | MPB Health Blog`,
      h1: article.title,
      description,
      bodyExcerpt,
      canonicalUrl: `${SITE_URL}${route}`,
      ogTitle: article.title,
      ogDescription: description,
      ogImage: article.featured_image_url || DEFAULT_OG_IMAGE,
      ogType: 'article',
      keywords: Array.isArray(article.tags) ? article.tags.join(', ') : undefined,
      robots: 'index, follow',
    },
  };
}

function resourceToMeta(resource) {
  const route = `/resources/${resource.slug}`;
  const description = normalizeDescription(
    resource.description || resource.content,
    'Download guides and educational resources about health sharing and medical cost sharing from MPB Health.',
  );
  const bodySource = resource.description || resource.content;
  const bodyExcerpt = stripHtml(bodySource).slice(0, 480);

  return {
    route,
    meta: {
      title: `${resource.title} | MPB Health Resources`,
      h1: resource.title,
      description,
      bodyExcerpt,
      canonicalUrl: `${SITE_URL}${route}`,
      ogTitle: resource.title,
      ogDescription: description,
      ogImage: resource.featured_image_url || DEFAULT_OG_IMAGE,
      keywords: Array.isArray(resource.topics) ? resource.topics.join(', ') : undefined,
      robots: 'index, follow',
    },
  };
}

async function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(
      `❌ prerender-dynamic-seo: template not found at ${TEMPLATE_PATH}.\n` +
        `   Run \`vite build && node scripts/prerender-seo.mjs\` first.`,
    );
    process.exit(1);
  }

  const { url, key } = loadSupabaseConfig();
  if (!url || !key) {
    console.warn(
      '\n⚠️  prerender-dynamic-seo: Supabase env not configured — skipping blog/resource prerender.',
      '\n   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for full SEO coverage.\n',
    );
    return;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const template = readFileSync(TEMPLATE_PATH, 'utf8');

  console.log('\n🔍 prerender-dynamic-seo: fetching blog articles and resources…\n');

  let blogArticles = [];
  let resources = [];

  try {
    blogArticles = await fetchAllRows(
      supabase,
      'blog_articles',
      'title, slug, excerpt, content, featured_image_url, tags, published_date',
      [
        ['eq', ['is_published', true]],
        ['neq', ['category', 'Event']],
        ['order', ['published_date', { ascending: false }]],
      ],
    );
  } catch (err) {
    console.warn(
      `  ⚠ blog_articles fetch failed: ${err?.message || err}`,
      '\n    Continuing with resources only.\n',
    );
  }

  try {
    resources = await fetchAllRows(
      supabase,
      'resource_library',
      'title, slug, description, content, featured_image_url, topics, published_date',
      [
        ['eq', ['is_published', true]],
        ['order', ['published_date', { ascending: false }]],
      ],
    );
  } catch (err) {
    console.warn(`  ⚠ resource_library fetch failed: ${err?.message || err}\n`);
  }

  let blogCount = 0;
  let resourceCount = 0;
  let failures = 0;

  for (const article of blogArticles) {
    if (!article.slug || !article.title) continue;
    try {
      const { route, meta } = blogArticleToMeta(article);
      const outputPath = writePrerenderedRoute({ distDir: DIST_DIR, template, route, meta });
      blogCount += 1;
      console.log(`  ✓ ${route} → ${path.relative(DIST_DIR, outputPath)}`);
    } catch (err) {
      failures += 1;
      console.warn(`  ⚠ blog/${article.slug} skipped: ${err?.message || err}`);
    }
  }

  for (const resource of resources) {
    if (!resource.slug || !resource.title) continue;
    try {
      const { route, meta } = resourceToMeta(resource);
      const outputPath = writePrerenderedRoute({ distDir: DIST_DIR, template, route, meta });
      resourceCount += 1;
      console.log(`  ✓ ${route} → ${path.relative(DIST_DIR, outputPath)}`);
    } catch (err) {
      failures += 1;
      console.warn(`  ⚠ resources/${resource.slug} skipped: ${err?.message || err}`);
    }
  }

  if (failures > 0) {
    console.error(`\n❌ prerender-dynamic-seo: ${failures} route(s) failed.`);
    process.exit(1);
  }

  console.log(
    `\n✅ prerender-dynamic-seo: wrote ${blogCount} blog + ${resourceCount} resource HTML file(s).\n`,
  );
}

main().catch((err) => {
  console.error('❌ prerender-dynamic-seo failed:', err);
  process.exit(1);
});
