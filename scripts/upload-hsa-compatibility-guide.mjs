#!/usr/bin/env node
/**
 * Upload Member-Facing HSA Compatibility Guide PDF + thumbnail to Supabase storage.
 * Run: pnpm exec node scripts/upload-hsa-compatibility-guide.mjs
 * Requires: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const BUCKET = 'advisor-documents';
const files = [
  {
    path: join(root, '.tmp/reference-materials/Member-Facing-HSA-Compatibility-Guide.pdf'),
    dest: 'Member-Facing-HSA-Compatibility-Guide.pdf',
    contentType: 'application/pdf',
  },
  {
    path: join(root, '.tmp/reference-materials/member-facing-hsa-compatibility-guide-thumbnail.png'),
    dest: 'member-facing-hsa-compatibility-guide-thumbnail.png',
    contentType: 'image/png',
  },
];

async function upload() {
  for (const { path: filePath, dest, contentType } of files) {
    const buffer = readFileSync(filePath);
    const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${dest}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${dest}: ${err || res.statusText}`);
    }
    console.log(`Uploaded: ${dest}`);
  }
  console.log('Done. Assets are in the advisor-documents bucket.');
}

upload().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
