# MPB Health CRM

> **DEPRECATED (2026-05-28):** Production CRM now runs from the separate `aryx-crm` repository at crm.mpb.health. This copy remains as a reference only.

Full-featured sales CRM with lead pipeline, email system, automation, recruiting, and reporting.

**Package:** `@mpbhealth/crm`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Zustand (state management)
- TanStack Query (server state)
- Recharts (data visualization)
- TipTap (rich text editing)
- xlsx (spreadsheet export)
- DnD Kit (drag and drop)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to Supabase project credentials
- User account with `crm_user` role and org membership

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### Development

```bash
pnpm install
pnpm --filter @mpbhealth/crm dev
```

Runs on `http://localhost:5174`.

## Project Structure

Standard Vite + React SPA layout with feature-based organization under `src/`.

## Key Features

- Full sales CRM with deal tracking
- Lead pipeline with drag-and-drop stages
- Email system (inbox, sequences, connected accounts)
- Automation rules and cadences
- Reporting suite (15+ report types)
- Recruiting module
- AI chat assistant
- Web form builder
- Calendar and task management
- Document management
- Quoting and invoicing

## Routes

| Group | Description |
|-------|-------------|
| Dashboard/Today | Activity feed and daily overview |
| Leads/Pipeline/Tasks | Lead management and sales pipeline |
| Email | Inbox, sequences, connected accounts |
| Reports | 15+ report types with charts |
| Calendar | Scheduling and event tracking |
| Daily Logs | Activity logging |
| Recruiting | Recruitment pipeline |
| Settings/Automation/Templates | Configuration and workflow automation |
| Web Forms | Form builder and submissions |
| Members/Contacts | Contact database |
| Deals/Quotes/Invoices/Products | Sales transaction management |
| Cases/Documents | Case tracking and document storage |
| Team | Team management and performance |

## Auth Model

Authentication is handled via Supabase Auth.

- **Required role:** `crm_user`
- **Access control:** Organization-scoped permissions
- Users must have org membership to access CRM data
- Permissions are scoped per organization

## Deployment

> **Note:** This app is deprecated. Production deployment is managed in the `aryx-crm` repository.

- **Former domain:** crm.mpb.health (now served by external repo)
- **Port (dev):** 5174

## Workspace Dependencies

- `@mpbhealth/auth`
- `@mpbhealth/admin-core`
- `@mpbhealth/config`
- `@mpbhealth/crm-core`
- `@mpbhealth/database`
- `@mpbhealth/plans-core`
- `@mpbhealth/ui`
- `@mpbhealth/utils`
