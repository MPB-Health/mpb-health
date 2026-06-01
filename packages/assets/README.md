# @mpbhealth/assets

Shared static assets (logos, images) for all MPB Health applications.

## Installation

```bash
pnpm add @mpbhealth/assets
```

## Usage

Import assets via subpath exports:

```ts
import logo from "@mpbhealth/assets/logos/mpb-logo.svg";
```

## Structure

```
assets/
  logos/       # Brand logos (not yet populated)
```

No JavaScript entry point. This package provides only static files via subpath exports.

## Apps Using This Package

Available to all apps as needed.
