# Platform diagrams (presentation assets)

Vector SVGs for slides, docs, and print. Open in a browser or any design tool.

| File | Use |
|------|-----|
| [`platform-business-flow.svg`](./platform-business-flow.svg) | Executive/stakeholder view: website, CRM, admin, advisors, and shared core. |
| [`platform-business-flow.png`](./platform-business-flow.png) | Same diagram, raster (2800px wide, ~2× slide resolution). |
| [`monorepo-technical-map.svg`](./monorepo-technical-map.svg) | Engineering view: apps, shared packages, Supabase. |
| [`monorepo-technical-map.png`](./monorepo-technical-map.png) | Same diagram, raster (3000px wide). |

Regenerate PNGs after editing the SVGs: from repo root run `pnpm diagrams:png`.

**Fonts:** Diagrams load **Fraunces** + **DM Sans** (business) and **Syne** + **IBM Plex Sans** (technical) from Google Fonts when online. Offline, the SVG falls back to named system fonts.

**Export to PNG/PDF**

- **Browser:** Open the SVG, zoom to 100%, print or use a screenshot tool for a crisp raster.
- **Inkscape:** File → Export PNG (set width e.g. 2800px for retina slides).
- **Figma / Illustrator:** Place SVG, export as needed.
