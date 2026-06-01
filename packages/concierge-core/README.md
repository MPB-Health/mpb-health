# @mpbhealth/concierge-core

Concierge portal static data and types.

## Installation

```bash
pnpm add @mpbhealth/concierge-core
```

Source-only package (no build step). Resolves via `./src/index.ts`.

## Usage

```ts
import { TRAINING_RESOURCES, QUICK_LINKS } from "@mpbhealth/concierge-core";
```

## API Reference

### Constants

- `TRAINING_RESOURCES` — static training resource catalog
- `QUICK_LINKS` — concierge quick-access links

### Types

- `TrainingResource` — training resource shape
- `TrainingCategory` — category classification
- `ResourceType` — resource type enum
- `QuickLink` — quick link shape

## Apps Using This Package

- `concierge-portal`
