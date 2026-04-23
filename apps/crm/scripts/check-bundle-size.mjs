#!/usr/bin/env node
// Lightweight bundle budget check for the CRM app.
// Runs after `vite build` and fails CI if any single asset — or the total
// JS/CSS payload — exceeds the limits agreed in UPGRADE-PLAN-2026.md.
//
// Deliberately zero deps: just `node:fs` + `node:path` so it runs in any
// CI runner without extra install steps.

import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync, readFileSync } from 'node:zlib';

// Budgets are in kilobytes of *gzipped* output. These align with the "ship
// something that loads fast on a rep's laptop" target and will tighten as
// we split routes. Bump with care — every bump should have a PR note.
const BUDGETS = {
  singleJs: 450,   // biggest single JS chunk (kB gz)
  totalJs: 1400,   // sum of all JS chunks (kB gz)
  totalCss: 120,   // sum of all CSS (kB gz)
};

const distDir = join(process.cwd(), 'dist', 'assets');

function listFiles(dir) {
  try {
    return readdirSync(dir).map((f) => join(dir, f)).filter((p) => statSync(p).isFile());
  } catch {
    return [];
  }
}

const files = listFiles(distDir);
if (files.length === 0) {
  console.error(`[bundle-size] no build artifacts found at ${distDir}`);
  process.exit(1);
}

const report = files.map((file) => {
  const buf = readFileSync(file);
  const gz = gzipSync(buf).length;
  return { file, ext: extname(file), raw: buf.length, gz };
});

const js = report.filter((r) => r.ext === '.js');
const css = report.filter((r) => r.ext === '.css');

const kb = (b) => Math.round(b / 1024);
const biggestJs = js.reduce((a, b) => (b.gz > a.gz ? b : a), { gz: 0, file: '<none>' });
const totalJs = js.reduce((s, r) => s + r.gz, 0);
const totalCss = css.reduce((s, r) => s + r.gz, 0);

const failures = [];
if (kb(biggestJs.gz) > BUDGETS.singleJs) {
  failures.push(
    `single JS chunk over budget: ${kb(biggestJs.gz)}kB gz > ${BUDGETS.singleJs}kB (${biggestJs.file})`,
  );
}
if (kb(totalJs) > BUDGETS.totalJs) {
  failures.push(`total JS over budget: ${kb(totalJs)}kB gz > ${BUDGETS.totalJs}kB`);
}
if (kb(totalCss) > BUDGETS.totalCss) {
  failures.push(`total CSS over budget: ${kb(totalCss)}kB gz > ${BUDGETS.totalCss}kB`);
}

console.log('[bundle-size] summary (gzipped):');
console.log(`  biggest JS : ${kb(biggestJs.gz)} kB  (${biggestJs.file})`);
console.log(`  total JS   : ${kb(totalJs)} kB across ${js.length} chunks`);
console.log(`  total CSS  : ${kb(totalCss)} kB across ${css.length} files`);

if (failures.length > 0) {
  console.error('\n[bundle-size] FAIL:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('\n[bundle-size] PASS');
