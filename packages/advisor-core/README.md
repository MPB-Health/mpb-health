# @mpbhealth/advisor-core

Advisor portal domain logic.

## Installation

```bash
pnpm add @mpbhealth/advisor-core
```

Source-only package (no build step). Resolves via `./src/index.ts`.

## Usage

```ts
import { TrainingService, MeetingService, ProfileService } from "@mpbhealth/advisor-core";
```

## API Reference

### Services

- `TrainingService` — training content and progress tracking
- `MeetingService` — meeting scheduling and management
- `ContentService` — advisor-facing content
- `FormsService` — form management
- `ProfileService` — advisor profile operations
- `AdvisorLeadService` — lead access for advisors
- `AdvisorOverviewService` — dashboard overview data
- `NavigationService` — portal navigation state
- `VideoService` — video content management
- `EnrollmentService` — enrollment workflows
- `TicketService` — support ticket operations
- `ChatService` — advisor chat functionality
- `PushService` — push notification preferences
- `EventsService` — event scheduling and tracking

### Helpers

- Training gate helpers (progression logic)

### Types

All domain types are exported as named exports.

## Apps Using This Package

- `advisor-portal`
- `concierge-portal`
- `admin-core` (transitive)
