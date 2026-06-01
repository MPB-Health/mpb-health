# @mpbhealth/eslint-config

Shared ESLint preset for TypeScript + React + hooks.

## Installation

```bash
pnpm add -D @mpbhealth/eslint-config
```

## Usage

In your `.eslintrc.js`:

```js
module.exports = {
  extends: [require.resolve("@mpbhealth/eslint-config")],
};
```

## Features

- TypeScript strict checking
- React and React Hooks rules
- Custom rule: bans `.select('*')` on Supabase queries (enforces explicit column selection)

## Apps Using This Package

All applications (as a devDependency).
