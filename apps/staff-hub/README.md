# Staff Hub

Internal SSO launcher and staff landing page. Serves as the central entry point for all MPB Health internal tools, showing role-appropriate portal links and personal productivity features.

**Package:** `@mpbhealth/staff-hub`

## Tech Stack

- React 18
- Vite
- Tailwind CSS

Minimal dependencies -- this is a portal launcher, not a full product application.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials
- Any internal staff account

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/staff-hub dev
```

Runs on `http://localhost:5178`.

## Project Structure

Standard Vite + React SPA layout with minimal feature set under `src/`.

## Key Features

- SSO entry point for all internal portals
- Role-based portal cards (only shows portals the user can access)
- Personal notes workspace
- Task management
- External tool quick links

## Routes

| Group | Description |
|-------|-------------|
| Dashboard | Portal launcher with role-based cards |
| Notes | Personal notes workspace |
| Tasks | Task list and management |
| Profile | User profile settings |

## Auth Model

Authentication is handled via Supabase Auth.

- **Access:** Any authenticated staff member
- **Portal routing:** Cards displayed based on user roles:
  - `admin` / `super_admin` -> Admin Portal
  - `crm_user` -> CRM
  - `advisor` -> Advisor Portal
  - `concierge` -> Concierge Portal
- Users see only the portals their roles grant access to

## Deployment

- **Platform:** Vercel
- **Port (dev):** 5178

## Workspace Dependencies

- `@mpbhealth/auth`
- `@mpbhealth/config`
- `@mpbhealth/database`
- `@mpbhealth/ui`
