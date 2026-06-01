# Admin Portal

Central staff admin command center for MPB Health operations. Provides user management, enrollment review, plan editing, full CMS, content management, analytics, and support tools.

**Package:** `@mpbhealth/admin-portal`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- TanStack Query (server state)
- Recharts (data visualization)
- TipTap (rich text editing)
- DnD Kit (drag and drop)
- xlsx (spreadsheet export)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials
- Admin user account (created via invite acceptance)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_MEMBERSHIP_ANALYTICS_SUPABASE_URL` | Membership analytics Supabase URL |
| `VITE_MEMBERSHIP_ANALYTICS_SUPABASE_ANON_KEY` | Membership analytics Supabase key |
| `VITE_RICH_TICKET_EDITOR` | Enable rich text ticket editor |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/admin-portal dev
```

Runs on `http://localhost:5176`.

## Project Structure

Standard Vite + React SPA layout with feature-based organization under `src/`.

## Key Features

- User and advisor management
- Enrollment review and approval workflow
- Plan editor with pricing configuration
- Full CMS (pages, media, SEO, forms, popups, theme)
- Content management (blog, bulletins, training, SOPs, videos, handbooks, FAQ)
- Newsletter system
- Lead assignment and tracking
- Membership analytics dashboard
- Support ticket system
- Module management for training
- System health monitoring
- Audit logs

## Routes

| Group | Description |
|-------|-------------|
| Users/Advisors | User and advisor account management |
| Enrollments | Enrollment review and processing |
| Plans | Health sharing plan configuration |
| CMS Hub | Pages, media, SEO, forms, popups, theme editor |
| Content | Blog, bulletins, training, SOPs, videos, handbooks, FAQ |
| Events | Event creation and management |
| Operations | Lead management, newsletter |
| Analytics | Membership and business analytics |
| Settings | Payments, SMS, promo codes |
| Support Tickets | Ticket queue and resolution |
| CRM Overview | CRM summary view |
| System Health | Infrastructure and service status |
| Audit Logs | Activity and change audit trail |

## Auth Model

Authentication is handled via Supabase Auth.

- **Onboarding:** Users must accept an invite to create their admin account
- **Roles:** `super_admin`, `admin`, `manager`, `staff`
- **Permissions:** Per-user permissions array controls feature access
- Role hierarchy determines available actions
- Granular permissions allow fine-tuned access control per feature

## Deployment

- **Platform:** Vercel
- **Domain:** admin.mpb.health
- **Port (dev):** 5176

## Workspace Dependencies

- `@mpbhealth/admin-core`
- `@mpbhealth/auth`
- `@mpbhealth/licensing`
- `@mpbhealth/config`
- `@mpbhealth/database`
- `@mpbhealth/plans-core`
- `@mpbhealth/ui`
- `@mpbhealth/utils`
