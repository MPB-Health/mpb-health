# 005 — Count up the hero stat rail

- **Status**: TODO
- **Commit**: 793ead56 (hero lives in UNCOMMITTED working-tree changes; verify excerpts before editing)
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities / Cohesion
- **Estimated scope**: 1 file (`LandingRedesign.tsx`), ~10 lines

## Problem

The statement section's stats animate with the file's own `StatNumber`
count-up component, but the hero's trust rail renders static text. Same page,
two behaviors for the same kind of element.

Current hero rail in
`apps/website/src/components/landing-redesign/LandingRedesign.tsx` (search
`lr-hero__stats`):

```tsx
/* current */
<motion.dl variants={heroItem} className="lr-hero__stats">
  <div>
    <dt>Google member rating</dt>
    <dd>4.9/5</dd>
  </div>
  <div>
    <dt>Families served</dt>
    <dd>12,000+</dd>
  </div>
  <div>
    <dt>Virtual care included</dt>
    <dd>$0</dd>
  </div>
</motion.dl>
```

Exemplar already in the same file (statement section):

```tsx
<StatNumber value={4.9} suffix="/5" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
<StatNumber value={12000} suffix="+" />
```

## Target

First two `dd`s use `StatNumber`; `$0` stays static (counting to zero is
meaningless):

```tsx
/* target */
<dd>
  <StatNumber value={4.9} suffix="/5" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
</dd>
...
<dd>
  <StatNumber value={12000} suffix="+" />
</dd>
...
<dd>$0</dd>
```

## Repo conventions to follow

- `StatNumber` is defined in this same file and triggers on first
  scroll-into-view; the hero is in view on load, so it fires immediately —
  no props changes needed.
- `.lr-hero__stats dd` already sets `font-variant-numeric: tabular-nums` in
  the CSS, so digits won't jitter horizontally while counting. Do not remove
  that.

## Steps

1. Replace the `4.9/5` text with the `StatNumber` element shown above.
2. Replace the `12,000+` text with the `StatNumber` element shown above.
3. Leave the `$0` entry untouched.

## Boundaries

- Do NOT modify `StatNumber` itself, the `dt` labels, or the CSS.
- Do NOT animate `$0`.

## Verification

- **Mechanical**: `cd apps/website && npx tsc --noEmit` passes.
- **Feel check**: reload the homepage — after the rail fades in, `4.9/5` and
  `12,000+` count up once (matching the statement section's behavior further
  down the page); numbers do not shift the row's layout while counting.
  Emulate `prefers-reduced-motion: reduce` and confirm whatever `StatNumber`
  already does there (it is the established behavior; do not change it).
- **Done when**: both numbers count up on load, `$0` is static, layout stable.
