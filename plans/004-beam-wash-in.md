# 004 — Wash the aurora ribbon in on first load

- **Status**: TODO
- **Commit**: 793ead56 (hero lives in UNCOMMITTED working-tree changes; verify excerpts before editing)
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file (`landing-redesign.css`), ~15 lines added

## Problem

The hero's signature aurora ribbon (`.lr-hero__beam` + `.lr-hero__beamglow`)
is at full presence on the very first painted frame, while the text content
staggers in over ~1s. The page's one rare, first-load moment — where delight
budget is allowed — renders with no orchestration: band first, content later,
no relationship between them.

Current relevant rules in
`apps/website/src/components/landing-redesign/landing-redesign.css`:

```css
/* current (abbreviated; masks omitted) */
.lr-hero__beam {
  z-index: 2;
  filter: blur(5px) saturate(1.25);
  /* mask-image: ... */
}
.lr-hero__beamglow {
  z-index: 3;
  mix-blend-mode: screen;
  opacity: 0.8; /* framer-motion animates this inline (breathing loop) */
  /* filter + mask-image: ... */
}
```

Note: `.lr-hero__beamglow` is a `motion.div` whose inline `opacity` is driven
by framer-motion. A CSS `animation` still wins over inline styles for the
animated property while it runs, and its implicit final keyframe resolves to
the element's underlying (inline) value — so a `from`-only fade composes
cleanly with the breathing loop.

## Target

Both ribbon layers fade up from nothing over 1.4s on mount, settling just as
the content cascade lands. One new keyframe + one declaration per layer:

```css
/* target — add near the .lr-hero__beam rule */
@keyframes lr-beam-in {
  from {
    opacity: 0;
  }
}
.lr-hero__beam,
.lr-hero__beamglow {
  animation: lr-beam-in 1.4s var(--lr-ease) both;
}
```

And inside the existing `@media (prefers-reduced-motion: reduce)` block that
already re-sets the beam masks:

```css
/* target — reduced motion: no entrance movement/fade choreography */
.lr-hero__beam,
.lr-hero__beamglow {
  animation: none;
}
```

## Repo conventions to follow

- `--lr-ease: cubic-bezier(0.16, 1, 0.3, 1)` is the shared curve; use it.
- Existing reduced-motion overrides for these two selectors live in the block
  beginning `/* SMIL mask animation can't see prefers-reduced-motion` — add
  the `animation: none` rule inside that same block.

## Steps

1. Add the `@keyframes lr-beam-in` rule and the shared
   `animation: lr-beam-in 1.4s var(--lr-ease) both;` declaration for
   `.lr-hero__beam, .lr-hero__beamglow` (new combined rule directly after the
   `.lr-hero__beamglow` rule).
2. Add `.lr-hero__beam, .lr-hero__beamglow { animation: none; }` inside the
   existing `prefers-reduced-motion: reduce` media block.

## Boundaries

- Do NOT touch the mask data-URIs, the framer-motion breathing props in
  `LandingRedesign.tsx`, or the mobile media block.
- Do NOT delay the content stagger to "wait" for the beam.

## Verification

- **Mechanical**: page serves; no CSS parse warnings.
- **Feel check**: hard-reload the homepage:
  - The ribbon blooms from black over ~1.4s while the text staggers in — both
    finish within a beat of each other.
  - After the bloom, the glow's slow breathing (7s cycle) still runs (CSS
    animation ended; framer's inline opacity resumed control).
  - DevTools Rendering → `prefers-reduced-motion: reduce`: ribbon is present
    immediately, no fade.
- **Done when**: all three observations hold.
