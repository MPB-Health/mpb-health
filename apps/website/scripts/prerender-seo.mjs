#!/usr/bin/env node
/**
 * Build-time SEO prerender for static marketing routes.
 *
 * After `vite build`, clones `dist/index.html` for every route in
 * `page-seo-data.json` + `page-seo-extra.mjs`, rewrites head/body SEO
 * tags, and writes `dist/<route>/index.html`.
 *
 * Dynamic blog/resource routes are handled by prerender-dynamic-seo.mjs.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_PAGE_SEO } from './page-seo-extra.mjs';
import {
  applyMetadata,
  routeToOutputPath,
  writePrerenderedRoute,
} from './prerender-seo-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const DATA_PATH = path.join(APP_ROOT, 'src', 'lib', 'page-seo-data.json');

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
  const baseSeo = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const pageSeo = { ...EXTRA_PAGE_SEO, ...baseSeo };

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
      const outputPath = writePrerenderedRoute({ distDir: DIST_DIR, template, route, meta });
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
