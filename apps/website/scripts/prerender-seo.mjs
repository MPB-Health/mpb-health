#!/usr/bin/env node
/**
 * Build-time SEO prerender.
 *
 * After `vite build`, this script clones `dist/index.html` for every route
 * listed in `src/lib/page-seo-data.json`, rewrites the <head> meta tags
 * (title, description, canonical, OG, Twitter, keywords, robots) to be
 * route-specific, and writes the result to `dist/<route>/index.html`.
 *
 * Why: Vercel's static-file matching serves `dist/<route>/index.html` BEFORE
 * the SPA-fallback rewrite, so crawlers and social bots see the correct
 * per-route metadata. JS-enabled visitors hydrate normally; react-helmet-async
 * then re-syncs the head from the React tree, with no observable difference.
 *
 * This replaces the previous Vercel Edge middleware (`middleware.ts`) that
 * fetched SEO rows at request time and was prone to runtime failures.
 * The script has zero network dependencies — pure FS I/O on local JSON +
 * the already-bundled `dist/index.html`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const DATA_PATH = path.join(APP_ROOT, 'src', 'lib', 'page-seo-data.json');

const SITE_URL = 'https://mpb.health';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/MPB-Health-No-background.png?v=2`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Replace the first match of `regex` with `replacement`. If no match exists,
 * the HTML is returned unchanged. Used for tags we KNOW exist in the
 * template (title/description/canonical/OG/Twitter all hard-coded in
 * apps/website/index.html).
 */
function replaceTag(html, regex, replacement) {
  if (!regex.test(html)) {
    return html;
  }
  return html.replace(regex, replacement);
}

/**
 * Insert `tag` once before </head>. No-op if a tag with the same `name=` or
 * `property=` attribute already exists.
 */
function insertOnce(html, identifierRegex, tag) {
  if (identifierRegex.test(html)) {
    return html.replace(identifierRegex, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function applyMetadata(template, meta, route) {
  const canonical = meta.canonicalUrl || `${SITE_URL}${route}`;
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  const ogTitle = meta.ogTitle || meta.title;
  const ogDescription = meta.ogDescription || meta.description;
  const twitterTitle = meta.twitterTitle || ogTitle;
  const twitterDescription = meta.twitterDescription || ogDescription;

  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const safeCanonical = escapeHtml(canonical);
  const safeOgTitle = escapeHtml(ogTitle);
  const safeOgDescription = escapeHtml(ogDescription);
  const safeOgImage = escapeHtml(ogImage);
  const safeTwitterTitle = escapeHtml(twitterTitle);
  const safeTwitterDescription = escapeHtml(twitterDescription);

  let html = template;

  html = replaceTag(html, /<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  html = replaceTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );

  html = replaceTag(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeCanonical}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeOgTitle}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeOgDescription}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeCanonical}" />`,
  );

  html = replaceTag(
    html,
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeOgImage}" />`,
  );

  html = replaceTag(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTwitterTitle}" />`,
  );

  html = replaceTag(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeTwitterDescription}" />`,
  );

  html = replaceTag(
    html,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeOgImage}" />`,
  );

  if (meta.keywords) {
    html = insertOnce(
      html,
      /<meta name="keywords" content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    );
  }

  if (meta.robots) {
    html = insertOnce(
      html,
      /<meta name="robots" content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    );
  }

  // Diagnostic markers so we can verify prerender ran (visible via curl).
  html = insertOnce(
    html,
    /<meta name="x-prerender-route" content="[^"]*"\s*\/?>/i,
    `<meta name="x-prerender-route" content="${escapeHtml(route)}" />`,
  );

  return html;
}

function routeToOutputPath(distDir, route) {
  if (!route.startsWith('/')) {
    throw new Error(`Route must start with '/': ${route}`);
  }
  const trimmed = route.replace(/^\/+|\/+$/g, '');
  if (trimmed === '') {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, trimmed, 'index.html');
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(
      `❌ prerender-seo: template not found at ${TEMPLATE_PATH}.\n` +
        `   Run \`vite build\` before this script.`,
    );
    process.exit(1);
  }
  if (!existsSync(DATA_PATH)) {
    console.error(`❌ prerender-seo: page SEO data not found at ${DATA_PATH}.`);
    process.exit(1);
  }

  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const pageSeo = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

  // Sanity-check the template has the tags we expect to rewrite.
  const requiredTags = [
    /<title>[^<]*<\/title>/i,
    /<meta name="description" content="[^"]*"/i,
    /<link rel="canonical" href="[^"]*"/i,
  ];
  for (const re of requiredTags) {
    if (!re.test(template)) {
      console.error(
        `❌ prerender-seo: dist/index.html is missing an expected tag (${re}).\n` +
          `   Did apps/website/index.html change shape? Update the regex map.`,
      );
      process.exit(1);
    }
  }

  // Also rewrite dist/index.html itself for the "/" entry — this keeps it
  // perfectly in sync with the JSON, in case someone edits the JSON but
  // forgets to update apps/website/index.html.
  const rootMeta = pageSeo['/'];
  if (rootMeta) {
    const rootHtml = applyMetadata(template, rootMeta, '/');
    writeFileSync(TEMPLATE_PATH, rootHtml, 'utf8');
    console.log(`  ✓ /  → dist/index.html (rewritten)`);
  }

  let count = 0;
  let failures = 0;
  for (const [route, meta] of Object.entries(pageSeo)) {
    if (route === '/') continue;
    try {
      const html = applyMetadata(template, meta, route);
      const outputPath = routeToOutputPath(DIST_DIR, route);
      mkdirSync(path.dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, html, 'utf8');
      count += 1;
      console.log(`  ✓ ${route} → ${path.relative(DIST_DIR, outputPath)}`);
    } catch (err) {
      failures += 1;
      console.warn(`  ⚠ ${route} skipped: ${err && err.message ? err.message : err}`);
    }
  }

  if (failures > 0) {
    console.error(`\n❌ prerender-seo: ${failures} route(s) failed.`);
    process.exit(1);
  }
  console.log(`\n✅ prerender-seo: wrote ${count} per-route HTML file(s).`);
}

main();
