# @mpbhealth/tailwind-config

Shared Tailwind CSS theme preset for all MPB Health applications.

## Installation

```bash
pnpm add -D @mpbhealth/tailwind-config
```

## Usage

In your `tailwind.config.js`:

```js
const sharedConfig = require("@mpbhealth/tailwind-config");

module.exports = {
  presets: [sharedConfig],
  content: ["./src/**/*.{ts,tsx}"],
};
```

## Features

- Semantic CSS-variable-based colors
- Brand color palettes
- Custom font families
- Shadow and animation utilities
- Dark mode support

## Apps Using This Package

All applications.
