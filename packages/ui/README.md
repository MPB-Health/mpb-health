# @mpbhealth/ui

Shared React UI component library.

## Installation

```bash
pnpm add @mpbhealth/ui
```

Built with tsup. Output in `dist/`. Requires importing CSS assets.

## Usage

```tsx
import { Button, Card, Input, ThemeProvider } from "@mpbhealth/ui";
import "@mpbhealth/ui/styles.css";

function App() {
  return (
    <ThemeProvider>
      <Card>
        <Input placeholder="Email" />
        <Button>Submit</Button>
      </Card>
    </ThemeProvider>
  );
}
```

## API Reference

### Primitives

Button, Input, Card, Badge, Checkbox, Label, Select, Textarea, Tooltip, Separator, Accordion

### Layout Components

- `AppLayout` — standard app shell
- `LoginLayout` — authentication page layout
- `Breadcrumbs` — navigation breadcrumbs
- `PortalSwitcher` — portal navigation switcher
- `GradientHeader` — styled page header
- `MetricCard` — KPI display card
- Skeleton variants — loading placeholders

### Theming

- `ThemeProvider` — theme context provider
- `useTheme` — access current theme
- `ThemeToggle` — light/dark mode toggle

### Utilities

- `cn(...classes)` — className merge utility (clsx + tailwind-merge)
- `detectBrand()` — detect active brand
- `initBrand()` — initialize brand context
- `getBrandLogo()` — resolve brand logo asset

### CSS Assets

- `styles.css` — base component styles
- `login-animations.css` — login page animations
- `theme-tokens.css` — design token definitions
- `brand/aryx-brand.css` — Aryx brand overrides

## Apps Using This Package

All applications.
