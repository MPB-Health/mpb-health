# @mpbhealth/typescript-config

Shared TypeScript compiler configurations.

## Installation

```bash
pnpm add -D @mpbhealth/typescript-config
```

## Usage

Extend one of the provided configs in your `tsconfig.json`:

### For applications

```json
{
  "extends": "@mpbhealth/typescript-config/react-app.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### For library packages

```json
{
  "extends": "@mpbhealth/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Available Configs

| Config | Purpose |
|---|---|
| `base.json` | Base compiler options shared by all configs |
| `react-app.json` | Apps with React, DOM types, stricter settings |
| `react-library.json` | Library packages with React, declaration emit |

## Apps Using This Package

All applications and packages.
