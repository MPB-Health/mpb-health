# MPB Health — Landing Page Design Spec (staging.mpb.health)

This document describes the exact design of the MPB Health landing page so it can be
recreated in another project. Every color, font, size, gradient, shadow, and breakpoint
below is taken directly from the production source. Image assets are referenced by
filename — copy them into the destination project's `public/assets/` folder
(source files live in this repo's `public/assets/` and are also added manually to Docs).

---

## 1. Tech stack & global conventions

- **Framework:** React 18 + TypeScript, built with Vite. Routing via React Router.
- **Icons:** `lucide-react` (stroke icons, default `strokeWidth 1.6` unless noted).
  Two custom SVGs drawn in the lucide style: an **Rx prescription symbol** and a
  **support agent** (person wearing a headset) — full paths in section 9.
- **Form:** `react-hook-form` + `zod` (`@hookform/resolvers/zod`).
- **CSS:** plain CSS files per component, BEM-ish class names, mobile responsive via
  media queries and `clamp()` fluid sizing. No CSS framework.

### Global tokens (`:root`)

```css
--color-bg: #ffffff;
--color-text: #1a1a1a;
--color-muted: #5c5c5c;
--color-accent: #0b6e4f;
--color-surface: #f5f7f6;

--font-sans: 'Segoe UI', system-ui, sans-serif;
--font-display: Georgia, 'Times New Roman', serif;

--max-width: 1920px;
```

### Base styles

- `box-sizing: border-box` everywhere; `html/body/#root` have zero margin/padding.
- `body`: `min-width: 320px`, `font-family: var(--font-sans)`, `line-height: 1.5`,
  antialiased. `#root`: `min-height: 100svh`.
- `img { max-width: 100%; display: block; }` — `a { color: inherit; text-decoration: none; }`
- `h1–h3` use `var(--font-display)`, `line-height: 1.15`, no margin. `p` has no margin.
- `html { scroll-behavior: smooth; }`

### Brand palette (recurring values)

| Use | Value |
|---|---|
| Deep navy headings / labels | `#183392` |
| Brand blue (icons, links, stats) | `#1668c9` |
| Green (icon tint) | `#3c8a50` (picture banner), `#2e9e44` (Why MPB) |
| Dark slate text | `#0f2740` |
| Muted gray text | `#52606d` |
| CTA gradient (buttons) | `linear-gradient(90deg, #8be356 0%, #2fd0c0 55%, #1fa6e8 100%)` |
| Pale blue icon circle | `#e8f1fb` (trust/picture) / `#e6eefb` (Why MPB) |
| Pale green icon circle | `#e7f4ea` |

### Layout shell

- Every section: `width: 100%; max-width: 1920px` (centered page frame).
- Inner content of banners/cards: `max-width: 1440px; margin: 0 auto`.
- Standard section horizontal padding: `clamp(1rem, 3vw, 3.25rem)`.

### Breakpoints

| Device | Range | Notes |
|---|---|---|
| Mobile | ≤ 767px | hero stacks, form below copy inside hero |
| Tablet | 768–1023px | hamburger nav, 2–3 col grids |
| Laptop | 1024–1439px | full nav, 3-col carousels |
| Desktop | 1440–1920px+ | design reference is 1920px wide |

Hamburger menu switches on at **≤ 1023px**.

### Page order (Home route)

1. Hero (header + headline + Quick Rate Estimate form, all inside the hero photo)
2. Trust Banner (5 icon items)
3. Picture Banner (Mental / Physical / Balance cards)
4. Why MPB Health? (6 icon grid on gradient card)
5. Quote Banner (planet background, testimonial)
6. CTA Strip ("Ready to experience healthcare differently?" + button)
7. Social Proof (testimonials carousel + stats)
8. Footer (dark, 4 columns)

---

## 2. Header (inside hero, absolutely positioned)

Transparent header laid over the top of the hero photo.

- `position: absolute; top: 0; left/right: 0; z-index: 3`, flex row,
  gap `clamp(1.25rem, 2.2vw, 2.75rem)`, padding
  `clamp(1rem, 2.2vw, 2rem) clamp(1.25rem, 3vw, 3.25rem)`.
- **Logo** (`/assets/logo.png`, intrinsic 500×120): link width
  `clamp(10.5rem, 14.5vw, 16.5rem)`, `filter: drop-shadow(0 1px 10px rgba(0,0,0,0.28))`.
- **Menu items (in order):** Memberships, How It Works, Features, Advisor Directory,
  Resources, Member, Sign In.
- **IMPORTANT — destination project:** the menu is the same in the destination
  project, but the links must NOT stay `#` placeholders (as they are in this
  source). Wire each item to its corresponding page/route in the destination
  project (e.g. `/memberships`, `/how-it-works`, `/features`,
  `/advisor-directory`, `/resources`, `/member`, `/sign-in` — adjust to the
  destination's actual routes). The same applies to the mobile drawer menu,
  which renders the identical item list.
- **Nav pill bar:** `flex: 0 1 950px; max-width: 950px`, items spread with
  `justify-content: space-between`. Frosted glass:
  - `background: rgba(10, 42, 74, 0.28); backdrop-filter: blur(12px);`
  - `border: 1px solid rgba(255,255,255,0.22); border-radius: 999px;`
  - `box-shadow: 0 8px 24px -12px rgba(0,0,0,0.35); padding: 0.4rem 0.5rem;`
- **Links:** white, `var(--font-sans)`, `font-size: clamp(0.82rem, 0.95vw, 1.05rem)`,
  `font-weight: 600`, `letter-spacing: 0.02em`, `white-space: nowrap`,
  `text-shadow: 0 1px 8px rgba(0,0,0,0.35)`, padding `0.55rem 1rem`, radius `999px`.
  - Hover/focus: `background: rgba(255,255,255,0.92); color: #0f4c8c;`
    no text-shadow, `transform: translateY(-1px)`. Transitions 180ms ease.
- **"Sign In" (last item)** is a gradient pill button:
  `background: linear-gradient(90deg, #8be356 0%, #2fd0c0 55%, #1fa6e8 100%);`
  white text, `font-weight: 700`, `box-shadow: 0 8px 16px -8px rgba(31,166,232,0.6)`.
  Hover: `filter: brightness(1.08)`, lift 1px, stronger shadow.

### Mobile / tablet (≤ 1023px)

- Nav hidden; hamburger button shown (2.5rem square, three 2px white bars that
  animate into an X when open, 180ms transitions).
- Drawer below header: `background: rgba(12, 28, 36, 0.72); backdrop-filter: blur(12px)`,
  fades/slides in (opacity + `translateY(-0.35rem)` → 0). Body scroll locked while
  open; Escape closes.
- Drawer links: white, `1.05rem`, weight 500, `padding: 0.85rem 0.25rem`,
  separated by `1px solid rgba(255,255,255,0.12)` (none on last).

---

## 3. Hero

Full-bleed photo with headline on the left and the Quick Rate Estimate form on the
right, both **inside** the photo. The page (not the form) scrolls if the viewport is
short — the stage grows and the photo covers (zoom/crop).

### Structure

```
section.hero
  div.hero__stage          (relative, overflow hidden)
    img.hero__image        /assets/hero.png  1920×1357
    Header
    div.hero__content > div.hero__copy
      h1.hero__headline    "Healthcare that"
      img.hero__uplift     /assets/upliftyou.png  817×370 ("uplifts you" script art)
    div.hero__estimate > QuickRateEstimateForm
```

### Stage

- `height: min(calc(min(100vw, 1920px) * 1357 / 1920), 100svh);`
- `min-height: max-content;` (grows with form so nothing clips), `overflow: hidden`.
- CSS vars: `--hero-side-pad: clamp(1.25rem, 3vw, 3.25rem)`,
  `--hero-form-width: min(28rem, calc(100% - 2.5rem))`,
  `--hero-copy-gap: clamp(1.5rem, 3vw, 3.5rem)`.

### Photo

- `position: absolute; inset: 0; object-fit: cover; object-position: 40% center;`
- `fetchpriority="high"`, explicit width/height 1920×1357.

### Copy block

- `position: absolute; top: 49.8%` (anchored to match the 768px reference look),
  full width, right padding reserves form + gap:
  `padding: 0 calc(var(--hero-side-pad) + var(--hero-form-width) + var(--hero-copy-gap)) 0 var(--hero-side-pad);`
- `.hero__copy` is a **CSS container** (`container-type: inline-size`) so the headline
  scales with the column via `cqi` units.

### Headline "Healthcare that"

- White, `var(--font-display)`, single line (`white-space: nowrap`).
- `font-size: clamp(3.3rem, 10cqi, 5.6vw); font-weight: 500; line-height: 1.05;`
- `letter-spacing: -1px; text-shadow: 0 2px 18px rgba(0,0,0,0.28);`

### "uplifts you" art

- Image (black-background PNG) dropped over the photo with
  `mix-blend-mode: screen`. Width `clamp(10rem, 28vw, 28rem)`, `max-width: 95%`,
  `margin: 0.1em 0 0`.

### Form placement

- In normal flow (so the stage can grow): `width: var(--hero-form-width)`,
  `max-width: 32rem`, `margin: clamp(5.75rem, 7.5vw, 7.5rem) var(--hero-side-pad) 1.25rem auto;`
- The form card itself never scrolls internally in the hero: `.hero__estimate .qre { max-height: none; }`

### Tablet 769–1100px

- Stage `height: auto; min-height: min(100svh, 56rem)`; form width `min(24rem, 42vw)`.
- Photo `object-position: 22% center; transform: scale(1.02)` (origin 22% center).
- 769–1023px additionally: `object-position: 38% center`.

### Mobile ≤ 768px

- Stage becomes a flex column (`height: auto; min-height: 100svh`), photo zooms:
  `object-position: 20% center; transform: scale(1.06)` (origin 20% center).
- Copy in flow: `margin-top: clamp(5.5rem, 18vw, 7rem); padding: 0 1rem`.
- Headline `font-size: clamp(2.1rem, 14.6cqi, 12vw)` (still one line).
- Uplift art `width: clamp(11rem, 70vw, 18rem); max-width: 85%`.
- Form full-width below copy: `width: calc(100% - 2rem); margin: 1rem auto 0`.

---

## 4. Quick Rate Estimate form (QRE)

Frosted pastel glass card, 4-step wizard. All type is `var(--font-sans)`.

### Card tokens

```css
--qre-blue: #1256b0;      /* headings, icons */
--qre-blue-mid: #3b82f6;  /* selected borders, focus */
--qre-cyan: #0891b2;
--qre-text: #123f7d;      /* body text */
--qre-muted: #3f6398;     /* helper text */
--qre-radius: 1.6rem;
```

### Card shell

- `width: min(100%, 28rem); max-width: 32rem; max-height: min(78svh, 44rem)`
  (max-height disabled inside the hero), flex column, `overflow: hidden`.
- Background — soft mint/blue glass:

```css
background: linear-gradient(160deg,
  rgba(202, 236, 224, 0.88) 0%,
  rgba(214, 235, 246, 0.88) 42%,
  rgba(206, 234, 216, 0.86) 100%);
backdrop-filter: blur(16px);
border-radius: 1.6rem;
box-shadow: 0 25px 50px -12px rgba(9, 45, 92, 0.35),
            inset 0 0 0 1px rgba(255, 255, 255, 0.45);
```

### Header

- Transparent, padding `1.25rem 1.35rem 0.5rem`.
- Icon chip: 2.75rem square, radius 0.85rem,
  `background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)`, white
  `Calculator` icon (20px), `box-shadow: 0 6px 14px -6px rgba(37,99,235,0.6)`.
- Title "Quick Rate Estimate" — `1.3rem`, weight 800, `--qre-blue`.
  (Step 4 swaps to "Your Rate Comparison".)
- Subtitle "Compare all plans in 30 seconds" — `0.85rem`, weight 600, `--qre-text`.
- Trust row: `Users` icon + "50,000+ families", `ShieldCheck` icon + "Secure & Private"
  (16px icons in `--qre-blue`, text `0.85rem` weight 600).

### Progress bar

- 4px track `rgba(255,255,255,0.5)`, radius 999px, margins `0.85rem 1.35rem 0`.
- Fill `linear-gradient(90deg, #3b82f6, #06b6d4)`, width = step/4 × 100%,
  500ms ease transition.

### Body & scrollbar

- `padding: 1rem 1.35rem 0.45rem; margin-bottom: 0.9rem; overflow-y: auto`.
- Firefox: `scrollbar-width: auto; scrollbar-color: rgba(37,99,235,0.55) rgba(255,255,255,0.35);`
- WebKit: 12px wide; track `rgba(255,255,255,0.35)` radius 999px; thumb
  `rgba(37,99,235,0.55)` (hover 0.75) with 3px transparent border + `background-clip: padding-box`.
- Steps animate in: 300ms fade + `translateX(0.5rem)` → 0.

### Step 1 — "Who is included?"

- Eyebrow `STEP 1 OF 4` — `0.68rem`, weight 700, letter-spacing 0.06em, `--qre-blue`.
- Step title `1.3rem` weight 800 `--qre-blue`.
- **Household tiles** (2×2 grid, gap 0.75rem): Just Me (`UserRound`),
  Me + Spouse (`UsersRound`), Me + Kids (`Users`), Full Family (`UsersRound` +
  small `UserRound` overlaid bottom-right at 1.15rem, offset right -0.55rem / bottom -0.1rem).
  - Tile: min-height 96px, `background: rgba(255,255,255,0.92)`, radius 1.1rem,
    `border: 2px solid transparent`, shadow `0 4px 12px -4px rgba(15,60,110,0.16)`.
  - Icons 2.1rem, **filled**: `fill: currentColor; stroke: currentColor; stroke-width: 1`,
    color `--qre-blue`. Label `0.92rem` weight 700 `--qre-blue`.
  - Hover: lift 1px, deeper shadow. Selected: `border-color: #3b82f6`, solid white,
    `box-shadow: 0 6px 16px -4px rgba(37,99,235,0.28)`.
- **Fields** (2-col row: State select, Your Age): labels `0.8rem` weight 650;
  inputs `padding: 0.6rem 0.7rem`, `border: 1px solid rgba(18,86,176,0.14)`,
  radius 0.75rem, `background: rgba(255,255,255,0.94)`, text `#0f2f5e`,
  shadow `0 2px 6px -3px rgba(15,60,110,0.12)`.
  Focus: `outline: 2px solid rgba(59,130,246,0.35); border-color: #3b82f6`.
- Conditional panels (radius 0.75rem, `background: rgba(255,255,255,0.55)`):
  - Spouse Age panel — border `1px solid rgba(147,197,253,0.55)` (blue).
  - Kids panel — border `1px solid rgba(110,231,183,0.6)` (green); two columns:
    "Children less than 26" and "Oldest child age *"; note "We price using the
    oldest age in the household." (`0.7rem`, muted).
- Errors: `0.7rem`, `#dc2626`.

### Step 2 — "What matters most?"

- Sub "We'll match you to your best plan". Helper "Tap to select — pick 1–3 that
  matter most. All plans include $0 virtual care."
- Priority chips in 2-col grid (gap 0.5rem): min-height 3.4rem, radius 0.9rem,
  `background: rgba(255,255,255,0.92)`, `border: 2px solid transparent`,
  label `0.75rem` weight 650 `#123f7d`. Selected: border `#3b82f6`, white bg,
  small check disc top-right (1.05rem circle, `--qre-blue` bg, white `Check` 12px).
- Footer counter text `0.72rem` muted.

### Step 3 — "Where should we send your results?"

- First/Last name (2-col), Email, Phone (optional).
- Privacy note with `Lock` icon (14px): `background: rgba(255,255,255,0.6)`,
  radius 0.85rem, `0.75rem` muted text: "We'll never spam you. Your info is only
  used to send your rate comparison."

### Step 4 — Results

- Spinner: 2rem circle, `border: 3px solid #dbeafe`, top color `--qre-blue`, 0.8s spin.
- Success box: `#ecfdf5` bg, `#a7f3d0` border, `#065f46` text.
- "Traditional Insurance" comparison strip: `#fef2f2` bg, `#fecaca` border, `#991b1b` text.
- Plan cards: `rgba(255,255,255,0.94)` bg, radius 1rem; "Best Match" badge
  `#dbeafe`/`#1d4ed8`; savings in `#059669`; tier pills `#f1f5f9`/`#475569`.

### Buttons

- Pill (`border-radius: 999px`), `padding: 0.85rem 1.25rem`, `0.95rem` weight 700.
- **Primary:** white text on
  `linear-gradient(90deg, #8be356 0%, #2fd0c0 45%, #1f7ae8 100%)`,
  `box-shadow: 0 10px 18px -8px rgba(31,122,232,0.55)`; hover lifts 1px.
  Disabled: `opacity: 0.65`.
- **Ghost (Back):** `background: rgba(255,255,255,0.75)`, text `--qre-text`.
- **Secondary (View Full Comparison):** full width, `rgba(255,255,255,0.85)` bg,
  `border: 1px solid rgba(147,197,253,0.6)`, text `--qre-blue`.
- Nav rows: Continue right-aligned on step 1; Back/Continue split on steps 2–3.

### Form logic (for exact behavior)

- zod schema: state required; primary age 18–64; spouse age 18–64 required when
  household includes spouse; kids count 1–10 + oldest child age 0–64 required when
  household includes kids; ≥1 priority; first/last name ≥2 chars; valid email;
  phone optional. Validation mode `onChange`; Continue buttons disabled until valid.
- Pricing is mocked locally (700ms fake delay): estimates keyed off household type +
  oldest household age, compared against a traditional-insurance estimate.

---

## 5. Trust Banner

White strip under the hero with 5 items separated by vertical hairlines.

- Section: white bg, `border-bottom: 1px solid #e8edf2`.
- List: flex, centered, `max-width: 1440px`, padding
  `clamp(0.9rem, 1.6vw, 1.4rem) clamp(1rem, 3vw, 3.25rem)`.
- Items (equal `flex: 1 1 0`), icon + two-line label, gap `clamp(0.6rem, 1vw, 0.9rem)`;
  separators `border-left: 1px solid #d9e2ea` between items.
- Icon circle: `clamp(2.75rem, 3.4vw, 3.5rem)`, `background: #e8f1fb`, icon `#1668c9`,
  svg 55%, strokeWidth 1.6.
- Label: `clamp(0.8rem, 1vw, 1rem)`, weight 700, `#183392`, `white-space: nowrap`.

| Item | Icon (lucide) |
|---|---|
| Community Powered | `Users` |
| Transparent & Simple | `ShieldCheck` |
| Preventive Care | `HeartPulse` |
| Pharmacy Savings | custom **RxIcon** (section 9) |
| Personal Concierge | `Headset` |

- ≤1023px: wrap into rows of 3 (`flex: 1 1 33%`), separators removed.
- ≤600px: 2-column grid, rows left-aligned; the 5th item spans the full row,
  left-aligned (sits below "Preventive Care").

---

## 6. Picture Banner (Mental / Physical / Balance)

White section containing one rounded card with a 3-column grid.

- Section padding: `clamp(1.25rem, 3vw, 3rem) clamp(1rem, 3vw, 3.25rem)`, white bg.
- Card: `max-width: 1440px`, padding `clamp(1.5rem, 3vw, 3rem)`,
  `border-radius: clamp(1.25rem, 2vw, 2rem)`, **white background**,
  `box-shadow: 0 10px 30px -18px rgba(15,39,64,0.25)`. Column gap `clamp(1.5rem, 3vw, 3.5rem)`.

Each column: icon + copy header, photo, "Learn more →" link.

| Card | Icon | Tint | Title | Text | Image |
|---|---|---|---|---|---|
| 1 | `Brain` | green | Mental. | Access support for your mental and emotional well being. | `vibegirlD.png` (1512×1040) |
| 2 | `Dumbbell` | blue | Physical. | Stay active, set well, and get the care you need to fuel your best every day. | `runnervibeD.png` (1448×1086) |
| 3 | `Leaf` | green | Balance. | Modern healthcare and real life working together so you can thrive. | `silouhettevibeD.png` (1672×941) |

- Icon circle: `clamp(3rem, 3.8vw, 3.9rem)`, svg 52%.
  Green: bg `#e7f4ea`, icon `#3c8a50`. Blue: bg `#e8f1fb`, icon `#1668c9`.
- Title: `var(--font-display)`, `clamp(1.35rem, 1.7vw, 1.7rem)`, weight 800, `#183392`.
- Text: `var(--font-sans)`, `clamp(0.85rem, 1vw, 1rem)`, weight 700, line-height 1.4, `#183392`.
- Photo: `aspect-ratio: 3/2; object-fit: cover; border-radius: 0.85rem;`
  pushed to bottom with `margin-top: auto` so link rows align. `loading="lazy"`.
- Link: inline-flex, gap 0.4rem, `1.1rem` weight 700, tinted to match icon
  (green `#3c8a50` / blue `#1668c9`); `ArrowRight` at 1.1em, nudged down 0.1em for
  baseline alignment; hover underlines and arrow slides right 3px (160ms).

- ≤1023px: 2 columns, third card spans full row. ≤700px: single column stack,
  card padding 1.25rem, gap 1.75rem.

---

## 7. Why MPB Health?

Rounded gradient card (same shell as Picture Banner), centered text, 6 icon items.

- Card: `max-width: 1440px`, radius `clamp(1.25rem, 2vw, 2rem)`,
  padding `clamp(1.75rem, 3.5vw, 3.25rem) clamp(1.5rem, 3vw, 3rem)`,
  shadow `0 10px 30px -18px rgba(15,39,64,0.25)`, background:

```css
background: linear-gradient(105deg,
  #eaf6ef 0%, #eaf6ef 18%, #f2f9f6 45%, #e9f0fb 82%, #e9f0fb 100%);
```

- Title "Why MPB Health?": `var(--font-display)`, `clamp(1.85rem, 3vw, 2.9rem)`,
  weight 800, `#183392`.
- Subtitle "Health sharing that goes beyond the unexpected.":
  `var(--font-display)`, `clamp(0.95rem, 1.3vw, 1.2rem)`, weight 800, `#183392`.
- Grid: 6 equal columns, gap `clamp(1rem, 2vw, 2rem)`, top margin `clamp(1.75rem, 3vw, 3rem)`.
- Icon circle: `clamp(4rem, 5.5vw, 5.5rem)`, svg 46%, strokeWidth 1.6.
  - Blue variant: bg `#e6eefb`, icon `#1668c9`.
  - Green variant: bg `#e7f4ea`, icon `#2e9e44`.
- Labels (two lines): `var(--font-sans)`, `clamp(0.85rem, 1vw, 1rem)`, weight 700, `#183392`.

| Item | Icon | Tint | Notes |
|---|---|---|---|
| Community Powered | `Users` | **green** | only green item |
| Modern Healthcare Access | `Stethoscope` | blue | |
| Worldwide Protection | `Globe` | blue | |
| Preventive Care | `Heart` | blue | **filled**: `fill="currentColor"` |
| Pharmacy Savings | custom **RxIcon** | blue | |
| Personal Concierge | custom **AgentIcon** | blue | person wearing headset |

- ≤1023px: 3 per row (gap `1.75rem 1rem`). ≤600px: 2 per row, card padding 1.5rem/1.25rem.

---

## 8. Quote Banner (planet)

Full-width band with the planet artwork and a white testimonial on the left.

- `background-image: url('/assets/planet.png'); background-size: cover;`
  `background-position: 0% 37%; background-repeat: no-repeat;`
- Height `clamp(11rem, 14vw, 16rem)` (flex, vertically centered), padding
  `clamp(1.25rem, 2.5vw, 2.5rem) clamp(1rem, 3vw, 3.25rem)`.
- Inner shell `max-width: 1440px` so text aligns with the cards above.
- Quote block: `width: min(46rem, 55%)`, white, left-aligned.
  - Text: `“MPB Health has given our family the freedom to live fully knowing we
    have a community that’s there when it matters most.”` —
    `clamp(1.05rem, 1.6vw, 1.75rem)`, weight 600, line-height 1.45
    (1.55 at ≥1440px), `text-shadow: 0 2px 14px rgba(10,40,90,0.45)`.
  - Author: `-Sarah M.` (`clamp(0.95rem, 1.2vw, 1.15rem)` weight 700) and
    `MPB Health Member` (`clamp(0.8rem, 1vw, 0.95rem)` weight 500, opacity 0.9),
    stacked, top margin `clamp(0.9rem, 1.5vw, 1.4rem)`.
- ≤1023px: quote `width: min(30rem, 60%)`. ≤700px: banner `height: auto;
  min-height: 13rem; padding: 2rem 1.25rem`; quote full-width (max 28rem),
  centered text and author.

---

## 9. CTA Strip

Plain white strip: statement left, gradient button right, both centered as a pair.

- Section padding `clamp(2rem, 4vw, 3.75rem) clamp(1rem, 3vw, 3.25rem)`.
- Inner: flex, centered, gap `clamp(2.5rem, 6vw, 6rem)`, `max-width: 1440px`.
- Title (two lines: "Ready to experience / healthcare differently?"):
  `var(--font-display)`, `clamp(1.6rem, 2.6vw, 2.5rem)`, weight 800,
  line-height 1.2, `#183392`.
- Button "Get Your Quote" + `ArrowRight` (1.25em):
  `padding: 1rem 2.25rem; border-radius: 0.75rem;`
  `background: linear-gradient(90deg, #8be356 0%, #2fd0c0 55%, #1fa6e8 100%);`
  white, `clamp(1.05rem, 1.4vw, 1.35rem)` weight 700, letter-spacing 0.01em,
  `box-shadow: 0 10px 18px -6px rgba(31,166,232,0.45)`.
  Hover: `translateY(-2px) scale(1.03)`, `brightness(1.06)`, deeper shadow (300ms).
- ≤700px: stacked and center-aligned.

### Custom SVG icons (24×24 viewBox, stroke `currentColor`, strokeWidth 1.6, round caps/joins)

**RxIcon** (prescription symbol):

```svg
<path d="M5 19V5h5a3.5 3.5 0 0 1 0 7H5" />
<path d="M9.5 12l6 8" />
<path d="M14 14l7 6.5" />
<path d="M21 14l-7 6.5" />
```

**AgentIcon** (person wearing a headset):

```svg
<circle cx="12" cy="10.5" r="3.4" />
<path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
<path d="M6.8 11V9.8a5.2 5.2 0 0 1 10.4 0V11" />
<path d="M17.2 11.4v.6a2.6 2.6 0 0 1-2.6 2.6" />
<rect x="5.8" y="10" width="2" height="2.8" rx="1" />
<rect x="16.2" y="10" width="2" height="2.8" rx="1" />
```

---

## 10. Social Proof (testimonials)

- Section bg: `linear-gradient(135deg, #fff 0%, #eef4fb 55%, #f7f9fa 100%)`,
  padding `clamp(2.5rem, 5vw, 6rem) clamp(1rem, 3vw, 3.25rem)`. Inner 1440px.
- **Header (centered):**
  - Title "What Our Members Say": `var(--font-display)`,
    `clamp(1.85rem, 3vw, 2.9rem)`, weight 800, `#183392`.
  - Subtitle "Join thousands of satisfied families who've discovered a better way
    to manage healthcare costs." — `clamp(1rem, 1.3vw, 1.25rem)`, `#52606d`, max 48rem.
  - Link "View all Google Reviews" with Google "G" glyph (single-color `#1668c9`)
    and `ExternalLink` 16px; `1rem` weight 600 `#1668c9`, underline on hover.
    Target: `https://www.google.com/search?q=MPBHealth+Reviews`.
- **Stats row** (3 columns, centered):
  `4.9/5 · Average Rating · Google Reviews`,
  `96% · Would Recommend · To friends and family`,
  `50,000+ · Families Served · Historical enrollment`.
  Value `clamp(1.6rem, 2.4vw, 2.1rem)` weight 800 `#1668c9` tabular-nums;
  label `0.9rem` weight 600 `#0f2740`; subtext `0.78rem` `#52606d`.
- **Carousel:** horizontal scroll-snap track (`scroll-snap-type: x mandatory`,
  gap 2rem, smooth behavior, thin scrollbar). Slides `min(88vw, 22rem)`
  (≥640px: `min(85vw, 24rem)`; ≥1024px: exactly 3 visible —
  `calc((100% - 4rem - 6rem) / 3)` with `padding-inline: 3rem` on the track).
- **Cards:** white, `border: 1px solid #e2e8f0`, radius 0.9rem, padding 1.5rem,
  `box-shadow: 0 1px 3px rgba(15,39,64,0.08)`; hover: border `#cbd5e1`,
  `0 12px 28px -12px rgba(15,39,64,0.22)`.
  - 5 filled `Star` icons, `#facc15`, 1rem.
  - Name (1rem weight 700 `#0f2740`) + "Location • Member type" (0.85rem `#52606d`),
    hairline `#eef2f6` below.
  - Quote: italic, `0.95rem`, line-height 1.55, `#334155`, with faint `Quote`
    glyph (`#c3d2e2`) top-left, text indented 1.6rem. Quotes ≥140 chars clamp to
    4 lines with a "Read more"/"Read less" toggle (`0.85rem` weight 600 `#1668c9`).
  - Footer link "Google Review" with small G glyph (0.85rem, `#52606d`, hover `#1668c9`).
- **Nav chevrons** (desktop ≥1024px only): 2.5rem circles at track edges,
  white with `#e2e8f0` border, `box-shadow: 0 4px 12px rgba(15,39,64,0.12)`,
  `ChevronLeft`/`ChevronRight` in `#334155`; scroll by 92% of viewport width.
- Testimonials content (6 cards, all 5-star Google Reviews): Patrick Dittoe (United
  States, Member), Ryan Donovan (United States, Member), Charlotte Cadieux
  (Portland, OR), Laura Pascoe (Seattle, WA), Katie Burke (Charlotte, NC),
  Gina Corsini Mattern (San Diego, CA). Full quote text lives in `Docs/testimony.md`.

---

## 11. Footer

Dark footer, top hairline, two rows: brand + disclaimer, then a 4-column grid.

- `background: linear-gradient(180deg, #171717 0%, #0a0a0a 100%)`,
  padding `clamp(2.5rem, 4vw, 4rem) clamp(1rem, 3vw, 3.25rem)`. Inner 1440px.
- Hairline: 1px, `linear-gradient(90deg, transparent, #404040, transparent)`.
- Accents: `--footer-accent: #0a4d90; --footer-accent-light: #4f8fd2;`

### Top row (`grid-template-columns: 1fr 3fr`, gap 2rem)

- Logo (`/assets/logo.png`) at 4rem height; BBB seal below
  (`https://seal-seflorida.bbb.org/seals/blue-seal-200-42-bbb-92042549.png`, 200×42,
  links to the BBB profile).
- Disclaimer paragraph, italic, `0.875rem`, line-height 1.7, `#d4d4d4`:
  "MPB Health is your gateway to qualified Health Share Programs. While MPB Health
  is not a Health Share Organization or a Health Care Sharing Ministry (HCSM), we
  provide the membership services and support that give you access to organizations
  that share in members' medical expenses. Through MPB Health, you can experience
  affordable, community-based healthcare that works as an alternative to
  traditional insurance."

### Bottom grid (4 equal columns, gap 2rem)

Headings: `1.1rem` weight 700 white, 1rem bottom margin.

1. **Contact Us** (schema.org MedicalOrganization microdata): phone
   `(855) 816-4650` (`tel:+18558164650`), email `info@mympb.com`, address
   `5301 N Federal Hwy, Suite 155, Boca Raton, FL 33487`. Rows with lucide
   `Phone`/`Mail`/`MapPin` (1.25rem, `#4f8fd2`), text `0.95rem` `#d4d4d4`,
   hover `#4f8fd2`.
2. **Links**: Privacy Policy, Terms and Conditions, State Notices,
   Washington Statement (`0.95rem` `#d4d4d4`, hover accent).
3. (heading visually hidden): FAQ, App Download.
4. **Subscribe to Our Blog**: copy `0.875rem` `#d4d4d4` line-height 1.7
   ("Stay informed and empowered—subscribe to our blog for expert tips, wellness
   insights, and updates on smarter, more affordable healthcare solutions.");
   email input (`background: rgba(38,38,38,0.5)`, border `#404040`, radius 0.5rem,
   text `#f5f5f5`, placeholder `#737373`, focus ring `#0a4d90`); **Subscribe**
   button in the same green→cyan gradient as CTA (`border-radius: 0.75rem`,
   `padding: 0.8rem 1.75rem`, 1rem weight 700; hover `scale(1.05)` +
   `brightness(1.08)`). Success/error status boxes: green
   `rgba(20,83,45,0.5)`/`#15803d`/`#bbf7d0` with `CheckCircle`, red
   `rgba(127,29,29,0.5)`/`#b91c1c`/`#fecaca` with `AlertCircle`.

- ≤1023px: top row stacks; grid 2 columns; hidden heading removed.
- ≤600px: single column; logo 3.25rem.

---

## 12. Image assets

All in `public/assets/` (copy into the destination project; also provided in Docs):

| File | Size | Used in |
|---|---|---|
| `hero.png` | 1920×1357 | Hero photo (family) |
| `logo.png` | 500×120 | Header + footer logo |
| `upliftyou.png` | 817×370 | "uplifts you" script art (black bg, blended with `mix-blend-mode: screen`) |
| `vibegirlD.png` | 1512×1040 | Picture banner — Mental |
| `runnervibeD.png` | 1448×1086 | Picture banner — Physical |
| `silouhettevibeD.png` | 1672×941 | Picture banner — Balance |
| `planet.png` | wide banner art | Quote banner background |

Image practices: explicit `width`/`height` attributes, `decoding="async"` everywhere,
`fetchpriority="high"` on the hero, `loading="lazy"` below the fold,
`object-fit: cover` with intentional `object-position` for crops.

---

## 13. Supporting docs

- `Docs/testimony.md` — full testimonial quotes for the Social Proof carousel.
- `Docs/footer.md` — footer content source.
- `Docs/MPBForm.md` — Quick Rate Estimate form requirements.
