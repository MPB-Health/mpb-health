#!/usr/bin/env node
/**
 * Upload healthcare presentation thumbnails to Supabase storage.
 * Run: pnpm exec node scripts/upload-healthcare-thumbnails.mjs
 * Requires: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Add to .env or set env vars.');
  process.exit(1);
}

const BUCKET = 'advisor-documents';
const files = [
  { path: join(root, 'apps/advisor-portal/public/thumbnails/healthcare-individual-needs-thumbnail.png'), dest: 'healthcare-individual-needs-thumbnail.png' },
  { path: join(root, 'apps/advisor-portal/public/thumbnails/healthcare-group-needs-thumbnail.png'), dest: 'healthcare-group-needs-thumbnail.png' },
];

async function upload() {
  for (const { path: filePath, dest } of files) {
    try {
      const buffer = readFileSync(filePath);
      const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${dest}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'image/png',
          'x-upsert': 'true',
        },
        body: buffer,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }
      console.log(`Uploaded: ${dest}`);
    } catch (err) {
      console.error(`Failed to upload ${dest}:`, err.message);
      process.exit(1);
    }
  }
  console.log('Done. Thumbnails are now in Supabase storage.');
}

upload();
