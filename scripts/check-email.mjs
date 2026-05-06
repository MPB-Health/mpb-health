import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  for (const p of ['apps/advisor-portal/.env', 'apps/advisor-portal/.env.local', '.env']) {
    const full = join(root, p);
    if (existsSync(full)) {
      readFileSync(full, 'utf8').split('\n').forEach((line) => {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      });
      break;
    }
  }
}
loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, key);
const email = process.argv[2] || 'leonardo@mympb.com';

const { data, error } = await supabase
  .from('advisor_profiles')
  .select('id, first_name, last_name, email, status')
  .ilike('email', email);

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

if (data?.length) {
  console.log('Found in advisor_profiles:');
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log('leonardo@mympb.com NOT found in advisor_profiles');
}
