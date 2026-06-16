#!/usr/bin/env node
/**
 * Smoke test: enrollment partner reachability, framing headers, and local CSP allowlist.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const ENROLL_URLS = [
  'https://essentials.enrollmpb.com/',
  'https://careplus.enrollmpb.com/',
  'https://direct.enrollmpb.com/',
  'https://mec.enrollmpb.com/',
  'https://securehsa.enrollmpb.com/',
];

const CSP_FILES = [
  path.join(APP_ROOT, 'vercel.json'),
  path.join(APP_ROOT, 'index.html'),
  path.join(APP_ROOT, '.htaccess'),
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

async function checkPartner(url) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  const xfo = res.headers.get('x-frame-options')?.toLowerCase() ?? '';
  const csp = res.headers.get('content-security-policy')?.toLowerCase() ?? '';
  const hsts = res.headers.get('strict-transport-security') ?? '';

  if (!res.ok) {
    fail(`${url} returned HTTP ${res.status}`);
    return;
  }
  if (!url.startsWith('https://')) {
    fail(`${url} is not HTTPS`);
    return;
  }
  if (xfo === 'deny' || xfo === 'sameorigin') {
    fail(`${url} blocks embedding (${xfo})`);
    return;
  }
  if (csp.includes("frame-ancestors 'none'") || csp.includes('frame-ancestors none')) {
    fail(`${url} CSP blocks embedding (frame-ancestors none)`);
    return;
  }
  if (!hsts) {
    fail(`${url} missing Strict-Transport-Security`);
    return;
  }

  pass(`${url} reachable, embeddable, HSTS enabled`);
}

function checkCspAllowlist() {
  for (const file of CSP_FILES) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes('https://*.enrollmpb.com')) {
      fail(`${path.basename(file)} missing frame-src allowlist for https://*.enrollmpb.com`);
    } else {
      pass(`${path.basename(file)} allows enrollment iframe host`);
    }
  }
}

console.log('\nEnrollment embed verification\n');

checkCspAllowlist();

for (const url of ENROLL_URLS) {
  await checkPartner(url);
}

console.log(process.exitCode ? '\nSome checks failed.\n' : '\nAll enrollment checks passed.\n');
