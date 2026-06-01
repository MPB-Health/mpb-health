# @mpbhealth/config

Cross-app environment helpers and constants.

## Installation

```bash
pnpm add @mpbhealth/config
```

Built with tsup. Output in `dist/`.

## Usage

```ts
import { env, isProduction, getPortalUrl, isFeatureEnabled } from "@mpbhealth/config";

if (isProduction) {
  console.log("Running in production");
}

const adminUrl = getPortalUrl("admin");
const chatEnabled = isFeatureEnabled("live-chat");
```

## API Reference

### Environment

- `env` — typed environment variable access
- `getEnv(key)` — safe env getter with fallback
- `isProduction` — production check
- `isDevelopment` — development check

### Constants

- `COMPANY` — company metadata
- `DOMAINS` — domain mappings per environment
- `DEV_PORTS` — local dev server ports
- `PORTALS` — portal registry
- `AUTH_URLS` — authentication endpoints

### Utilities

- `getPortalUrl(portal)` — resolve portal URL by environment
- `featureFlags` — feature flag definitions
- `isFeatureEnabled(flag)` — check flag state

## Apps Using This Package

All applications and `@mpbhealth/auth`.
