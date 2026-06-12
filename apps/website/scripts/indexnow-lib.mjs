/**
 * IndexNow helpers — https://www.indexnow.org/documentation
 * Key file (Option 1): https://mpb.health/{key}.txt at site root.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { SITE_URL } from './prerender-seo-lib.mjs';

export const INDEXNOW_HOST = 'mpb.health';
export const INDEXNOW_KEY = '36181d626e03936dd965c7cdbb1951d6';
export const INDEXNOW_KEY_URL = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

/** Participating search engines (api.indexnow.org shares with all). */
export const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

const MAX_URLS_PER_REQUEST = 10_000;

export function extractUrlsFromSitemapXml(xml) {
  const urls = [];
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const loc = match[1].trim();
    try {
      const parsed = new URL(loc);
      if (parsed.hostname === INDEXNOW_HOST || parsed.hostname === `www.${INDEXNOW_HOST}`) {
        urls.push(loc);
      }
    } catch {
      // skip invalid URLs
    }
  }
  return urls;
}

export function collectSitemapUrls(distDir, publicDir) {
  const files = [
    'sitemap-pages.xml',
    'sitemap-geo.xml',
    'sitemap-blog.xml',
    'sitemap-resources.xml',
  ];
  const urls = new Set();

  for (const file of files) {
    const distPath = path.join(distDir, file);
    const publicPath = path.join(publicDir, file);
    const source = existsSync(distPath) ? distPath : existsSync(publicPath) ? publicPath : null;
    if (!source) continue;
    for (const loc of extractUrlsFromSitemapXml(readFileSync(source, 'utf8'))) {
      urls.add(loc);
    }
  }

  return [...urls].sort();
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

export async function submitIndexNowBatch(urlList, { endpoints = INDEXNOW_ENDPOINTS } = {}) {
  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_URL,
    urlList,
  };

  const results = [];
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    results.push({ endpoint, status: response.status, ok: response.ok });
  }
  return results;
}

export async function submitAllSitemapUrls(urls) {
  const batches = chunk(urls, MAX_URLS_PER_REQUEST);
  const allResults = [];

  for (const [index, batch] of batches.entries()) {
    const results = await submitIndexNowBatch(batch);
    allResults.push({ batch: index + 1, count: batch.length, results });
  }

  return allResults;
}
