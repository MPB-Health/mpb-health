#!/usr/bin/env npx tsx
/**
 * List advisor user IDs from advisor_profiles.
 * Run from repo root: pnpm exec tsx scripts/list-advisor-ids.ts
 * Loads .env from apps/advisor-portal or apps/website if present.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  const paths = ['apps/advisor-portal/.env', 'apps/advisor-portal/.env.local', 'apps/website/.env', '.env'];
  for (const p of paths) {
    const full = join(process.cwd(), p);
    if (existsSync(full)) {
      const content = readFileSync(full, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
      break;
    }
  }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('advisor_profiles')
    .select('id, first_name, last_name, email, agent_id')
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('Advisor User IDs (id = user_id):\n');
  console.log('id (user_id)                    | first_name | last_name  | email');
  console.log('-'.repeat(90));

  for (const row of data || []) {
    const id = (row.id as string).padEnd(30);
    const first = ((row.first_name as string) || '').slice(0, 10).padEnd(11);
    const last = ((row.last_name as string) || '').slice(0, 11).padEnd(12);
    const email = (row.email as string) || '';
    console.log(`${id} | ${first} | ${last} | ${email}`);
  }

  console.log('\n--- IDs only (for whitelist) ---');
  (data || []).forEach((r) => console.log(r.id));
}

main();
