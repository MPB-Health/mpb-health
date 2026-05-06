#!/usr/bin/env npx tsx
/**
 * Check if a user exists by email in advisor_profiles or auth.users.
 * Usage: pnpm exec tsx scripts/check-user-email.ts <email>
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const email = process.argv[2] || 'leonardo@mympb.com';

async function main() {
  // Check advisor_profiles
  const { data: profiles, error: profileError } = await supabase
    .from('advisor_profiles')
    .select('id, first_name, last_name, email, agent_id, status')
    .ilike('email', email);

  if (profileError) {
    console.error('advisor_profiles error:', profileError.message);
  } else if (profiles?.length) {
    console.log('Found in advisor_profiles:');
    profiles.forEach((p) => console.log(JSON.stringify(p, null, 2)));
  } else {
    console.log('Not found in advisor_profiles');
  }

  // Check auth.users (requires service role)
  if (supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (!authError && users) {
      const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (match) {
        console.log('\nFound in auth.users:');
        console.log(JSON.stringify({ id: match.id, email: match.email, created_at: match.created_at }, null, 2));
      } else {
        console.log('\nNot found in auth.users');
      }
    }
  }
}

main();
