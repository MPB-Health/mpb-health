# @mpbhealth/admin-core

Admin portal and CMS backend services.

## Installation

```bash
pnpm add @mpbhealth/admin-core
```

Source-only package (no build step). Resolves via `./src/index.ts`.

## Usage

```ts
import { UserService, EnrollmentService, ContentService } from "@mpbhealth/admin-core";
```

## API Reference

### Core Services

- `UserService` — user management operations
- `EnrollmentService` — member enrollment workflows
- `ContentService` — general content operations
- `BulletinService` — bulletin/announcement management
- `SettingsService` — admin settings CRUD
- `AuditService` — audit log access
- `AnalyticsService` — analytics aggregation
- `CRMBridgeService` — bridge to CRM data layer

### CMS Services

Pages, media, templates, theme, forms, popups, SEO, and related content management services.

### Communication Services

- `ChatAdminService` — chat administration
- `PushAdminService` — push notification management

### Lead Services

- `LeadSubmissionService` — inbound lead capture
- `LeadAssignmentService` — lead routing and assignment

### Other Exports

- `MemberService` — member profile operations
- `SystemHealthService` — system health checks
- All shared types via named exports

## Apps Using This Package

- `admin-portal`
- `website`
- `crm`
