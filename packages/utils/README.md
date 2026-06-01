# @mpbhealth/utils

Framework-agnostic utilities.

## Installation

```bash
pnpm add @mpbhealth/utils
```

Built with tsup. Output in `dist/`. Subpath export available for validation schemas.

## Usage

```ts
import { formatCurrency, formatPhone, logger } from "@mpbhealth/utils";
import { emailSchema, phoneSchema } from "@mpbhealth/utils/validation";

formatCurrency(1999); // "$19.99"
formatPhone("5551234567"); // "(555) 123-4567"
```

## API Reference

### Formatting

- `formatCurrency(cents)` — cents to dollar string
- `formatPhone(raw)` — normalize phone display
- `formatDate(date, format?)` — date formatting
- `formatNumber(n, options?)` — number formatting

### Validation

- `isValidEmail(str)` — email check
- `isValidPhone(str)` — phone check
- `isValidZipCode(str)` — zip code check
- `@mpbhealth/utils/validation` — Zod schemas for forms and API payloads

### CSV

- `parseCSV(text)` — parse CSV string to rows
- `generateCSV(rows)` — rows to CSV string
- `downloadCSV(rows, filename)` — trigger browser download

### Security

- `sanitizeHtml(html)` — strip dangerous HTML
- `sanitizePHI(text)` — redact PHI markers

### String

- `slugify(str)` — URL-safe slug
- `truncate(str, len)` — truncate with ellipsis

### Logging

- `logger` — structured logger instance
- `createClientLogger(namespace)` — namespaced client logger

### Async

- `withTimeout(promise, ms)` — promise timeout wrapper

## Apps Using This Package

All applications and many packages.
