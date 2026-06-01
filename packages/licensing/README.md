# @mpbhealth/licensing

Module licensing, feature flags, white-label support, and tenant provisioning.

## Installation

```bash
pnpm add @mpbhealth/licensing
```

Source-only package (no build step). Resolves via `./src/index.ts`.

## Usage

```tsx
import { ModuleGate, useModuleAccess, WhiteLabelProvider } from "@mpbhealth/licensing";

function App() {
  return (
    <WhiteLabelProvider>
      <ModuleGate module="crm">
        <CRMDashboard />
      </ModuleGate>
    </WhiteLabelProvider>
  );
}
```

## API Reference

### Services

- `LicensingService` — license validation and management
- `TenantProvisioningService` — new tenant setup workflows

### Hooks

- `useModuleAccess(module)` — check module availability
- `useFeatureFlag(flag)` — check feature flag state
- `useOrgLicenses()` — list org's active licenses
- `useWhiteLabel()` — white-label branding context

### Components

- `ModuleGate` — conditionally render based on module license
- `FeatureGate` — conditionally render based on feature flag
- `UpgradePrompt` — upsell prompt for unlicensed features
- `WhiteLabelProvider` — white-label branding context provider

## Apps Using This Package

- `admin-portal`
