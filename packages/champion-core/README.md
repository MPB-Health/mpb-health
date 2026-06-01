# @mpbhealth/champion-core

"Champion Advisor OS" business logic — the full-featured advisor productivity platform.

## Installation

```bash
pnpm add @mpbhealth/champion-core
```

Source-only package (no build step). Resolves via `./src/index.ts`.

## Usage

```ts
import { PriorityService, ConversationService, AIService } from "@mpbhealth/champion-core";
```

## API Reference

### Core Services

- `PriorityService` — task prioritization engine
- `ConversationService` — conversation management
- `TemplateService` — message templates
- `SequenceService` — outreach sequences
- `ComplianceService` — compliance checks
- `AIService` — AI-powered features

### Business Services

- `BillingService` — billing operations
- `UsageService` — usage tracking and limits
- `SettingsService` — user/org settings
- `IntegrationService` — third-party integrations
- `AnalyticsService` — analytics and metrics
- `ReportService` — report generation
- `ActivityService` — activity feed
- `NotificationService` — notification delivery
- `AutomationService` — workflow automation
- `AchievementService` — gamification and achievements

### Utilities

- `searchService` — full-text search

### Types

Extensive type exports for all domain models.

## Apps Using This Package

- `advisor-portal`
