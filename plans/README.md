# Animation Plans — Hero (option C, `redesign/homepage-landing`)

Written by `improve-animations` at commit 793ead56. IMPORTANT: the hero these
plans target lives in **uncommitted working-tree changes** on
`redesign/homepage-landing` — every plan carries anchor strings to verify
before editing. Commit the working tree before executing if possible.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Regenerate ribbon masks](001-regenerate-ribbon-masks.md) — smooth 8-keyframe wave, glow blur 26→14px (softness into SVG), fresh reduced-motion statics | MEDIUM | TODO |
| 002 | [Tighten hero entrance](002-tighten-hero-entrance.md) — 0.9s/0.14 → 0.7s/0.10 | MEDIUM | TODO |
| 003 | [CTA hover filter transition](003-cta-hover-filter-transition.md) — one line | LOW | TODO |
| 004 | [Beam wash-in on load](004-beam-wash-in.md) — 1.4s first-load bloom | LOW | TODO |
| 005 | [Hero stat count-up](005-hero-stat-countup.md) — reuse `StatNumber` | LOW | TODO |

## Execution order & dependencies

1. **001 first** — it regenerates every beam mask URI; anything that touches
   the same rules afterward stays consistent.
2. **004 after 001** — it appends rules adjacent to the beam rules and adds to
   the same reduced-motion block 001 rewrites; running it first would be
   rewritten-around but risks anchor drift.
3. **002, 003, 005** — independent of each other and of the beam plans; any
   order.

Feel-check everything together at the end: hard-reload the homepage and watch
one full load — ribbon blooms in (004), content cascades tight (002), stats
count (005), slither runs cornerless for 8s (001), CTA hover eases (003).
