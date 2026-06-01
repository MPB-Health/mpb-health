# @mpbhealth/plans-core

Health plan management, pricing, and rate engine.

## Installation

```bash
pnpm add @mpbhealth/plans-core
```

Built with tsup. Output in `dist/`.

## Usage

```ts
import { createPlanService, createPlanRateEngine } from "@mpbhealth/plans-core";
import type { Plan, RateEstimate } from "@mpbhealth/plans-core";

const planService = createPlanService(supabase);
const rateEngine = createPlanRateEngine(supabase);

const estimate: RateEstimate = await rateEngine.calculate({
  memberType: "individual",
  age: 35,
  iuaOption: "standard",
});
```

## API Reference

### Service Factories

- `createPlanService(supabase)` — plan CRUD and queries
- `createPlanPricingService(supabase)` — pricing tier management
- `createPlanFeatureService(supabase)` — plan feature configuration
- `createPlanRateEngine(supabase)` — rate calculation engine

### Types

- `Plan` — plan record shape
- `PlanPricing` — pricing tier shape
- `RateEstimate` — calculated rate result

### Constants

- `MEMBER_TYPES` — supported member classifications
- `IUA_OPTIONS` — IUA selection options
- `AGE_BANDS` — age band definitions for rating

## Apps Using This Package

- `website`
- `admin-portal`
- `crm`
