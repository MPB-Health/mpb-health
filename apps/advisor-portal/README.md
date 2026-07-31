# Advisor Portal

Advisor and broker command center with PWA support. Provides training, SOP library, lead management, support tickets, and internal communication tools for MPB Health advisors.

**Package:** `@mpbhealth/advisor-portal`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- TanStack Query (server state)
- TipTap v3 (rich text editing)
- PDF.js (document viewing)
- Framer Motion (animations)
- PWA (service worker for offline/install)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials
- User account with `advisor` or `super_admin` role
- Required training modules must be completed before full access

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_RICH_TICKET_EDITOR` | Enable rich text ticket editor (`true`) |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/advisor-portal dev
```

Runs on `http://localhost:5175`.

## Project Structure

Standard Vite + React SPA layout with feature-based organization under `src/`.

## Key Features

- Training modules with completion tracking (MPB, Sedera, Zion)
- SOP library with document viewer
- Assigned lead management
- Support ticket system with rich text editor (paste screenshots/snippets into description or reply to attach)
- Internal chat and inbox
- Event management
- Command palette for quick navigation
- PWA install support (works offline)
- Audit log for compliance
- Bulletin board for announcements

## Routes

| Group | Description |
|-------|-------------|
| Dashboard | Overview and quick actions |
| Training | MPB, Sedera, and Zion training modules |
| Forms | Advisor-specific forms |
| SOPs | Standard operating procedures library |
| Bulletins | Announcements and updates |
| Videos | Training and reference videos |
| Tickets | Support ticket submission and tracking |
| Chat/Inbox | Internal messaging |
| Leads | Assigned lead management |
| Events | Event calendar and management |
| Settings/Organization/Team | Configuration and team settings |
| Profile | User profile management |

## Auth Model

Authentication is handled via Supabase Auth.

- **Required roles:** `advisor` or `super_admin`
- **Training gate:** Access to main portal features is blocked until required training modules are completed
- New advisors are routed to training on first login
- Completion status is tracked per module

## Deployment

- **Platform:** Vercel
- **Domain:** advisor.mpb.health
- **Port (dev):** 5175
- **PWA:** Service worker enables offline access and native install

## Workspace Dependencies

- `@mpbhealth/advisor-core`
- `@mpbhealth/auth`
- `@mpbhealth/champion-core`
- `@mpbhealth/config`
- `@mpbhealth/database`
- `@mpbhealth/ui`
- `@mpbhealth/utils`
