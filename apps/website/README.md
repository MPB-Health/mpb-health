# MPB Health Website

Main marketing site and embedded admin/CMS for MPB Health. Serves public-facing pages for health sharing plans, enrollment, blog, member portal, and a full admin backend.

**Package:** `@mpbhealth/website`

## Tech Stack

- React 18
- Vite 7
- Tailwind CSS
- React Router
- react-helmet-async (SEO)
- TipTap (rich text / CMS editing)
- Framer Motion (animations)
- React Hook Form + Zod (validation)
- jsPDF (PDF generation)
- Vitest (testing)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials

### Environment Variables

**Required:**

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

**Optional:**

| Variable | Description |
|----------|-------------|
| `VITE_ARYX_FUNCTIONS_URL` | ARYX edge functions base URL |
| `VITE_ARYX_ANON_KEY` | ARYX anonymous key |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile captcha key |
| `VITE_VAPID_PUBLIC_KEY` | Web push VAPID public key |
| Various pixel IDs | Analytics/tracking pixel identifiers |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/website dev
```

Runs on `http://localhost:5173`.

**Production build:**

```bash
pnpm --filter @mpbhealth/website build
```

Build pipeline: `vite build && node scripts/prerender-seo.mjs && node scripts/prerender-dynamic-seo.mjs && node scripts/generate-sitemap-pages.mjs && node scripts/generate-sitemaps.mjs && node scripts/generate-cms-redirects.mjs && node scripts/prerender-html.mjs`

CMS URL redirects are synced from Supabase into `generated/cms-redirects.mjs` and applied by root `middleware.js` on Vercel.

## Project Structure

```
src/
  components/
    admin/        # Admin UI components
    blocks/       # Page builder blocks
    blog/         # Blog components
    cms-blocks/   # CMS content blocks
    forms/        # Form components
    layout/       # Layout shells and navigation
    ui/           # Shared UI primitives
  pages/
    admin/cms/          # Admin CMS pages
    admin/advisor-cms/  # Advisor CMS management
    forms/              # Public form pages
    handbooks/          # Handbook viewer pages
    member/             # Member portal pages
  lib/
    analytics/    # Analytics integrations
    seo/          # SEO utilities
    schema/       # Structured data schemas
    supabase/     # Supabase service layer
  contexts/
    Auth/         # Authentication context
    Navigation/   # Navigation state
    Terminal/     # Terminal/command context
```

## Key Features

- CMS-managed marketing pages with live page builder
- Member portal with protected routes
- Blog, events, and resource library
- 15+ public enrollment/contact forms
- Admin CMS suite for content management
- Admin CRM interface
- Advisor CMS tools
- SEO prerendering for static content
- Analytics integration (GA, pixels)

## Routes

| Group | Description |
|-------|-------------|
| Marketing | ~32 CMS-managed public pages |
| Member Portal | Protected member dashboard and tools |
| Public Forms | 15+ enrollment, contact, and intake forms |
| Auth | Login, signup, password reset |
| Blog/Events/Resources | Content library pages |
| Admin CMS | Page builder, media, SEO, forms, popups, theme |
| Admin CRM | CRM interface within website admin |
| Advisor CMS | Advisor-specific content management |
| Content Pages | Static/handbook content |

## Auth Model

Authentication is handled via Supabase Auth.

- **Roles:** `admin`, `member`
- **Route protection:** `ProtectedRoute` component guards authenticated routes
- Public pages are accessible without login
- Member portal requires authenticated session with `member` role
- Admin routes require `admin` role

## Deployment

- **Platform:** Vercel
- **Config:** `apps/website/vercel.json`
- **Domain:** mpb.health
- **Strategy:** SPA with catch-all rewrite to `index.html`
- **Headers:** Content Security Policy headers configured
- **SEO:** Prerendered HTML for search engine crawlers

## Workspace Dependencies

- `@mpbhealth/admin-core`
- `@mpbhealth/auth`
- `@mpbhealth/config`
- `@mpbhealth/crm-core`
- `@mpbhealth/database`
- `@mpbhealth/plans-core`
- `@mpbhealth/ui`
- `@mpbhealth/utils`
