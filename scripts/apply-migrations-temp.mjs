const https = require('https');

const token = process.env.MGMT_TOKEN;
const ref = 'dtmnkzllidaiqyheguhl';

const queries = [
  // Storage policies for advisor-avatars
  `CREATE POLICY "Advisors can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'advisor-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,

  `CREATE POLICY "Advisors can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'advisor-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'advisor-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,

  `CREATE POLICY "Advisors can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'advisor-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,

  `CREATE POLICY "Public read access for advisor avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'advisor-avatars')`,

  // meeting_attendees compatibility view
  `CREATE OR REPLACE VIEW public.meeting_attendees AS SELECT * FROM public.advisor_meeting_attendees`,

  `GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated`,
  `GRANT SELECT ON public.meeting_attendees TO anon`,
  `GRANT ALL ON public.meeting_attendees TO service_role`,
];

async function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const opts = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${ref}/database/query`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const sql of queries) {
    const label = sql.split('\n')[0].replace(/CREATE POLICY|CREATE OR REPLACE VIEW|GRANT/g, '').trim().substring(0, 60);
    try {
      const { status, body } = await runQuery(sql);
      const parsed = JSON.parse(body);
      if (status >= 400 && !body.includes('already exists') && !body.includes('duplicate')) {
        console.error(`FAIL [${status}] ${label}: ${body.substring(0, 200)}`);
      } else {
        console.log(`OK [${status}] ${label}`);
      }
    } catch (e) {
      console.error(`ERROR ${label}: ${e.message}`);
    }
  }
}

main();
