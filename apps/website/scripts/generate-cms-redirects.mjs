#!/usr/bin/env node
/**
 * Fetch active cms_redirects from Supabase and write middleware lookup table.
 * Run in installCommand (before middleware bundle) and during website build.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from './prerender-supabase.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'generated', 'cms-redirects.mjs');

function normalizeRedirect(row) {
  const from = String(row.from_path || '').trim();
  const to = String(row.to_path || '').trim();
  if (!from || !to) return null;
  const status = Number(row.status_code) || 301;
  return {
    from,
    to,
    status: [301, 302, 307, 308].includes(status) ? status : 301,
    isRegex: Boolean(row.is_regex),
  };
}

function writeRedirects(redirects) {
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const body = `/**
 * CMS redirect rules for Vercel Edge Middleware.
 * Regenerated at build/install by scripts/generate-cms-redirects.mjs.
 * @type {Array<{ from: string, to: string, status: number, isRegex: boolean }>}
 */
export const CMS_REDIRECTS = ${JSON.stringify(redirects, null, 2)};
`;
  writeFileSync(OUTPUT_PATH, body, 'utf8');
}

async function main() {
  const supabase = createSupabaseClient();
  if (!supabase) {
    console.warn(
      '\n⚠️  generate-cms-redirects: Supabase env not configured — keeping existing redirect map.\n',
    );
    return;
  }

  const { data, error } = await supabase
    .from('cms_redirects')
    .select('from_path, to_path, status_code, is_regex')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn(`  ⚠ cms_redirects fetch failed: ${error.message}`);
    return;
  }

  const redirects = (data || [])
    .map(normalizeRedirect)
    .filter(Boolean);

  writeRedirects(redirects);
  console.log(`\n✅ generate-cms-redirects: wrote ${redirects.length} redirect rule(s).\n`);
}

main().catch((err) => {
  console.error('❌ generate-cms-redirects failed:', err);
  process.exit(1);
});
