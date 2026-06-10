#!/usr/bin/env node
/**
 * Build-time SEO prerender for advisor.mpb.health auth and shell routes.
 * Clones dist/index.html per route so crawlers see unique titles and noindex.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVISOR_PAGE_SEO } from './page-seo-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function insertOnce(html, identifierRegex, tag) {
  if (identifierRegex.test(html)) {
    return html.replace(identifierRegex, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function injectStaticBody(html, meta) {
  const h1 = escapeHtml(meta.h1 || meta.title);
  const description = escapeHtml(meta.description || '');
  const fallback = `    <main id="seo-static-fallback" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
      <h1>${h1}</h1>
      <p>${description}</p>
    </main>\n`;

  html = html.replace(/\s*<main id="seo-static-fallback"[^>]*>[\s\S]*?<\/main>\s*/gi, '\n');
  return html.replace('<div id="root"></div>', `${fallback}    <div id="root"></div>`);
}

function applyMetadata(template, meta, route) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonicalUrl);

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="title" content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${title}" />`,
  );
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = insertOnce(
    html,
    /<meta name="robots" content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeHtml(meta.robots || 'noindex, follow')}" />`,
  );
  html = insertOnce(
    html,
    /<meta name="x-prerender-route" content="[^"]*"\s*\/?>/i,
    `<meta name="x-prerender-route" content="${escapeHtml(route)}" />`,
  );

  return injectStaticBody(html, meta);
}

function routeToOutputPath(route) {
  const trimmed = route.replace(/^\/+|\/+$/g, '');
  if (trimmed === '') return path.join(DIST_DIR, 'index.html');
  return path.join(DIST_DIR, trimmed, 'index.html');
}

function writePrerenderedRoute(template, route, meta) {
  const html = applyMetadata(template, meta, route);
  const outputPath = routeToOutputPath(route);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error('❌ advisor prerender-seo: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  let count = 0;

  for (const [route, meta] of Object.entries(ADVISOR_PAGE_SEO)) {
    const outputPath = writePrerenderedRoute(template, route, meta);
    count += 1;
    console.log(`  ✓ ${route} → ${path.relative(DIST_DIR, outputPath)}`);
  }

  console.log(`\n✅ advisor prerender-seo: ${count} route(s) written.\n`);
}

main();
