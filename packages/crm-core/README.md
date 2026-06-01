# @mpbhealth/crm-core

Full CRM domain layer with 40+ subpath exports.

## Installation

```bash
pnpm add @mpbhealth/crm-core
```

Built with tsup (multi-entry). Output in `dist/`.

## Usage

All services use the factory pattern — pass a Supabase client to get a service instance:

```ts
import { createLeadService } from "@mpbhealth/crm-core/leads";
import { createPipelineService } from "@mpbhealth/crm-core/pipeline";

const leadService = createLeadService(supabase);
const pipelineService = createPipelineService(supabase);
```

## API Reference

### Major Subpath Exports

| Import Path | Domain |
|---|---|
| `./leads` | Lead management |
| `./pipeline` | Sales pipeline |
| `./email` | Email operations |
| `./automation` | Workflow automation |
| `./reporting` | Reports and dashboards |
| `./accounts` | Account management |
| `./contacts` | Contact records |
| `./deals` | Deal tracking |
| `./products` | Product catalog |
| `./quotes` | Quote generation |
| `./invoices` | Invoice management |
| `./campaigns` | Marketing campaigns |
| `./cases` | Support cases |
| `./studio` | CRM studio tools |
| `./cadence` | Sales cadence |
| `./referrals` | Referral tracking |
| `./recruiting` | Recruiting pipeline |

Each subpath exports a `createXService(supabase)` factory and associated types.

## Apps Using This Package

- `website`
- `crm`
- `admin-core` (transitive)
