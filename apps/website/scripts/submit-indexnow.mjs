#!/usr/bin/env node
/**
 * Notify IndexNow participants of sitemap URLs after production builds.
 * @see https://www.indexnow.org/documentation
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_URL,
  collectSitemapUrls,
  submitAllSitemapUrls,
} from './indexnow-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const PUBLIC_DIR = path.join(APP_ROOT, 'public');

function shouldSubmit() {
  if (process.env.INDEXNOW_SUBMIT === 'false') return false;
  if (process.env.INDEXNOW_SUBMIT === 'true') return true;
  return process.env.VERCEL_ENV === 'production';
}

async function main() {
  if (!shouldSubmit()) {
    console.log(
      '\n⏭️  submit-indexnow: skipped (set INDEXNOW_SUBMIT=true or deploy to Vercel production).\n',
    );
    return;
  }

  const urls = collectSitemapUrls(DIST_DIR, PUBLIC_DIR);
  if (urls.length === 0) {
    console.warn('\n⚠️  submit-indexnow: no URLs found in sitemap XML files.\n');
    return;
  }

  console.log(`\n📡 submit-indexnow: notifying IndexNow for ${urls.length} URL(s)`);
  console.log(`   host=${INDEXNOW_HOST} key=${INDEXNOW_KEY}`);
  console.log(`   key file=${INDEXNOW_KEY_URL}\n`);

  const batches = await submitAllSitemapUrls(urls);
  let failures = 0;

  for (const { batch, count, results } of batches) {
    for (const { endpoint, status, ok } of results) {
      const label = endpoint.replace('https://', '');
      if (ok || status === 202) {
        console.log(`  ✓ batch ${batch} (${count} URLs) → ${label}: HTTP ${status}`);
      } else {
        failures += 1;
        console.warn(`  ⚠ batch ${batch} (${count} URLs) → ${label}: HTTP ${status}`);
      }
    }
  }

  if (failures > 0) {
    console.warn(
      `\n⚠️  submit-indexnow: ${failures} endpoint response(s) were not 200/202.` +
        ' Key file must be reachable at the root. See https://www.indexnow.org/documentation\n',
    );
    process.exitCode = 1;
    return;
  }

  console.log('\n✅ submit-indexnow: submission complete.\n');
}

main().catch((err) => {
  console.error('❌ submit-indexnow failed:', err);
  process.exit(1);
});
