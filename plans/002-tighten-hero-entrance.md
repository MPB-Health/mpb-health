# 002 — Tighten hero content entrance timing

- **Status**: TODO
- **Commit**: 793ead56 (hero lives in UNCOMMITTED working-tree changes; verify excerpts before editing)
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file, ~6 lines

## Problem

`apps/website/src/components/landing-redesign/LandingRedesign.tsx` (near the
top of the `LandingRedesign` component's return, search for `heroStagger`):

```tsx
/* current */
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
};
const heroItem = {
  hidden: reduce ? {} : { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOut } },
};
```

Six staggered children (kicker, headline, lede, actions, micro, stats). The
CTA (4th child) starts at 0.15 + 3×0.14 ≈ 0.57s and settles at ~1.47s. A
marketing hero may run longer than UI's 300ms budget, but ~1.5s before the
primary CTA is at rest drags; the same feel is delivered by a tighter cascade.

## Target

```tsx
/* target */
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: reduce ? {} : { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};
```

CTA settles at ~1.1s; last child (stat rail) at ~1.3s.

## Repo conventions to follow

- `easeOut` is the module-level constant `const easeOut = [0.16, 1, 0.3, 1] as const;`
  in the same file (matches the CSS token `--lr-ease`). Keep using it.
- The `Reveal` helper in the same file already uses `duration: 0.7` — this
  change aligns the hero with it.

## Steps

1. In `LandingRedesign.tsx`, change `staggerChildren: 0.14` → `0.1`,
   `delayChildren: 0.15` → `0.1`, `duration: 0.9` → `0.7`. Nothing else.

## Boundaries

- Do NOT change the `y: 24` offset, the variant structure, or `easeOut`.
- Do NOT touch `Reveal`, scroll transforms, or any CSS.

## Verification

- **Mechanical**: `cd apps/website && npx tsc --noEmit` passes.
- **Feel check**: reload the homepage; the cascade reads as one gesture, CTA
  is settled by ~1.1s, and the stat rail still lands last. With DevTools
  Animations panel at 25% speed, items visibly overlap (stagger) rather than
  queue.
- **Done when**: timing values match target and feel check passes.
