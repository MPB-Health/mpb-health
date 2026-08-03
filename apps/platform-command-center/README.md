# ARYX Platform Command Center

Thin control-plane UI for the ARYX software ecosystem. Talks **only** to
[ARYX Accounts](https://nubejeaijuivdhggewkl.supabase.co) (`nubejeaijuivdhggewkl`).

## Scope (v1)

- Organizations (canonical `id` + `slug`)
- App catalog
- License matrix with `entitled_now` (mirrors `org_has_app`)
- Invitations
- SSO launch via `create_sso_ticket(org_id, app_slug)`

## Explicit non-goals

- Billing UI
- MPB Admin / Staff Hub / HR
- EnrollFlow member, payment, or org mutations
- Second Supabase client (no MonoRepo, no EnrollFlow)

## Local setup

```bash
cp apps/platform-command-center/.env.example apps/platform-command-center/.env.local
# set VITE_ARYX_ACCOUNTS_ANON_KEY from Accounts project publishable/anon key
pnpm install
pnpm --filter @mpbhealth/platform-command-center dev
```

Port: **5180**.

## Production

- Project: `mpb-health/platform-command-center`
- URL: https://platform-command-center.vercel.app
- Env (Vercel Production): `VITE_ARYX_ACCOUNTS_URL`, `VITE_ARYX_ACCOUNTS_ANON_KEY`, `VITE_SSO_PATH`

CLI deploy from this monorepo subdirectory does **not** upload the full workspace, so use a local build + prebuilt deploy:

```bash
pnpm --filter @mpbhealth/platform-command-center build
cd apps/platform-command-center
rm -rf .vercel/output && mkdir -p .vercel/output/static
cp -R dist/* .vercel/output/static/
printf '%s\n' '{"version":3,"routes":[{"handle":"filesystem"},{"src":"/(.*)","dest":"/index.html"}]}' > .vercel/output/config.json
vercel deploy --prebuilt --prod --yes
```

After first deploy, add these to **ARYX Accounts → Auth → URL configuration**:

- Site URL / Redirect: `https://platform-command-center.vercel.app`
- Additional redirect: `https://platform-command-center.vercel.app/**`

## Identity contract

- Pass **Accounts `org_id`** across products.
- Accounts slug SoT: `mpb`, `hsaforamerica`, `meridian-benefits-zpjc`, …
- See [docs/aryx-accounts-naming.md](../../docs/aryx-accounts-naming.md).
