# 003 — Transition the gradient CTA's hover brightness

- **Status**: TODO
- **Commit**: 793ead56 (hero lives in UNCOMMITTED working-tree changes; verify excerpts before editing)
- **Severity**: LOW
- **Category**: Easing & duration
- **Estimated scope**: 1 file, 1 line

## Problem

`apps/website/src/components/landing-redesign/landing-redesign.css`:

```css
/* current — search "lr-btn {" (base button, ~line 67) */
.lr-btn {
  /* ... */
  transition: background 0.2s var(--lr-ease), color 0.2s var(--lr-ease),
    transform 0.15s var(--lr-ease), box-shadow 0.2s var(--lr-ease);
}

/* current — search "lr-btn--grad:hover" */
.lr-btn--grad:hover {
  filter: brightness(1.08);
}
```

`filter` is not in the transition list, so the hero CTA's hover brightness
snaps on/off instead of easing like every other hover in the design.

## Target

```css
/* target — .lr-btn transition list gains filter */
transition: background 0.2s var(--lr-ease), color 0.2s var(--lr-ease),
  transform 0.15s var(--lr-ease), box-shadow 0.2s var(--lr-ease),
  filter 0.2s var(--lr-ease);
```

## Repo conventions to follow

- `--lr-ease: cubic-bezier(0.16, 1, 0.3, 1)` is the shared easing token —
  reuse it; do not introduce a new curve.

## Steps

1. Append `, filter 0.2s var(--lr-ease)` to the `.lr-btn` transition
   declaration. Nothing else.

## Boundaries

- Do NOT touch `.lr-btn--grad:hover` itself or any other button variant.
- Do NOT add `will-change`.

## Verification

- **Mechanical**: page builds/serves; CSS parses (no console warnings).
- **Feel check**: hover the hero "Get Your Quote" button — brightness eases in
  over ~200ms and eases back out on leave; no snap.
- **Done when**: hover in/out both ease.
