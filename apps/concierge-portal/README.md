# Concierge Portal

Concierge and member services portal for ARYX staff. Provides resource management, daily log tracking, reporting, and ticket submission for the concierge team.

**Package:** `@mpbhealth/concierge-portal`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- TanStack Query (server state)

This is the smallest app in the monorepo, focused on the concierge team's core workflows.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials
- User account with `concierge` or `super_admin` role

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/concierge-portal dev
```

Runs on `http://localhost:5179`.

## Project Structure

Standard Vite + React SPA layout with feature-based organization under `src/`.

## Key Features

- Resource dashboard with quick-access links
- Daily log workspace with ISO week tracking
- Team roster and escalation paths
- Weekly report generation
- Support ticket submission
- Streamlined UI for concierge workflows

## Routes

| Group | Description |
|-------|-------------|
| Dashboard | Resource hub with quick links and tools |
| Daily Logs | ISO week-based activity tracking |
| Reports | Weekly and team reports |
| Tickets | Support ticket submission and tracking |
| Profile | User profile management |

## Auth Model

Authentication is handled via Supabase Auth.

- **Required roles:** `concierge` or `super_admin`
- Access is restricted to ARYX concierge staff
- No public-facing routes

## Deployment

- **Platform:** Vercel
- **Domain:** concierge.mpb.health
- **Port (dev):** 5179

## Workspace Dependencies

- `@mpbhealth/advisor-core`
- `@mpbhealth/auth`
- `@mpbhealth/concierge-core`
- `@mpbhealth/config`
- `@mpbhealth/database`
- `@mpbhealth/ui`
- `@mpbhealth/utils`
