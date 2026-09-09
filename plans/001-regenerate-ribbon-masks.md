# 001 — Regenerate hero ribbon masks: smooth wave, cheaper glow, fresh reduced-motion statics

- **Status**: TODO
- **Commit**: 793ead56 (NOTE: the hero lives in UNCOMMITTED working-tree changes on branch `redesign/homepage-landing` — verify the anchors below exist before editing; if not, STOP and report)
- **Severity**: MEDIUM (merges three audit findings sharing the same files and generator)
- **Category**: Easing (wave velocity corners) + Performance (glow blur) + Accessibility (stale reduced-motion masks)
- **Estimated scope**: 1 file (`apps/website/src/components/landing-redesign/landing-redesign.css`), ~6 long data-URI lines replaced

## Problem

The hero "aurora ribbon" (third design / option C) is drawn by SVG `mask-image`
data-URIs on three CSS rules in
`apps/website/src/components/landing-redesign/landing-redesign.css`:

1. **Wave has velocity corners.** The live masks for `.lr-hero__beam` and
   `.lr-hero__beamglow` carry a SMIL `<animate attributeName='d'>` traveling
   wave sampled at only 4 phase keyframes (0°/90°/180°/270°) with linear
   keyTimes. A sine approximated by 4 linear segments puts a visible velocity
   "corner" in the slither every 2 seconds, forever, on the page's signature
   element.
2. **Glow blur is over budget.** The glow rule is:

```css
/* landing-redesign.css — current (find via the unique anchor string) */
.lr-hero__beamglow {
  z-index: 3;
  mix-blend-mode: screen;
  opacity: 0.8;
  filter: blur(26px) saturate(1.4);
  /* -webkit-mask-image / mask-image: url("data:image/svg+xml;utf8,<svg ... stdDeviation='5' ... fill-opacity='0.65' ...") with <animate> */
}
```

   26px CSS blur on a full-viewport layer whose opacity AND mask both animate
   means continuous re-rasterization; the craft budget for blur is <20px
   (worst in Safari). Softness should be baked into the SVG mask instead.
3. **Reduced-motion masks are stale.** The block that begins with the comment
   `/* SMIL mask animation can't see prefers-reduced-motion — hand those users
   the still ribbon explicitly */` re-sets static masks for `.lr-hero__beam`
   and `.lr-hero__beamglow`, but its paths are from an OLDER bezier-arc
   version of the ribbon (paths starting `M47,-5 C45.5,20 43,45 ...`).
   Reduced-motion users currently see a differently-shaped band than everyone
   else.

## Target

All six mask URIs regenerated from ONE generator so live and static shapes
agree:

- Live core + glow masks: same wave (amplitude 2.2, λ=60, amplitude enveloped
  to 0 at the ends), but **8 phase keyframes** (45° steps) + wrap, `dur='8s'`,
  linear `keyTimes='0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1'`.
- Glow SVG `stdDeviation` raised 5 → **7.5**; glow CSS `filter` becomes
  `blur(14px) saturate(1.4)`.
- Reduced-motion block: static masks = **phase-0 frame of the current wave**
  (no `<animate>`), core `stdDeviation='2'`, glow `stdDeviation='7.5'` with
  `fill-opacity='0.65'`.

## Repo conventions to follow

- These masks were generated programmatically before (python inline script);
  regenerate — do not hand-edit path strings.
- Data-URI style used throughout: `url("data:image/svg+xml;utf8,<svg ...>")`
  with `#` written as `%23` and `%` in attribute values written as `%25`.
  Copy the shape of the existing URIs exactly.

## Steps

1. From the repo root, run this script. It rewrites the six mask lines in
   place:

```python
import math, re
p='apps/website/src/components/landing-redesign/landing-redesign.css'
s=open(p).read()

ys=[-5,5,15,25,35,45,55,65,75,85,95,106]
def interp(pts,y):
    for (y1,v1),(y2,v2) in zip(pts,pts[1:]):
        if y<=y2: return v1+(v2-v1)*(y-y1)/(y2-y1)
    return pts[-1][1]
C=[(-5,59.5),(20,51.5),(45,46),(68,44.5),(82,43),(95,39),(106,37)]
W=[(-5,12.5),(20,6.5),(45,4.2),(68,4),(82,4.2),(95,5),(106,5.5)]
A=2.2

def path(phase, wmul):
    disp=lambda y: A*math.sin(math.pi*(y+5)/111)*math.sin(2*math.pi*y/60 - phase)
    L=[(interp(C,y)-interp(W,y)*wmul+disp(y), y) for y in ys]
    R=[(interp(C,y)+interp(W,y)*wmul+disp(y), y) for y in reversed(ys)]
    return "M"+" L".join(f"{x:.1f},{y}" for x,y in L+R)+" Z"

def svg(body, std):
    return ("url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' "
      "preserveAspectRatio='none'><filter id='f' x='-60%25' y='-60%25' width='220%25' height='220%25'>"
      f"<feGaussianBlur stdDeviation='{std}'/></filter>{body}</svg>\")")

def anim_svg(wmul, std, fillextra=""):
    n=8
    vals=[path(2*math.pi*k/n, wmul) for k in range(n)]; vals.append(vals[0])
    v=";".join(vals)
    kt=";".join(f"{k/n:g}" for k in range(n))+";1"
    body=(f"<path d='{vals[0]}' fill='white'{fillextra} filter='url(%23f)'>"
      f"<animate attributeName='d' dur='8s' repeatCount='indefinite' keyTimes='{kt}' values='{v}'/></path>")
    return svg(body, std)

def static_svg(wmul, std, fillextra=""):
    return svg(f"<path d='{path(0,wmul)}' fill='white'{fillextra} filter='url(%23f)'/>", std)

def swap(anchor, uri, src):
    i=src.index(anchor); j=src.index('}', i)
    seg=re.sub(r'(-webkit-mask-image|mask-image): url\("data:image/svg\+xml[^"]*"\);',
               lambda m: m.group(1)+': '+uri+';', src[i:j])
    return src[:i]+seg+src[j:]

# live layers (anchors are unique to the live rules)
s=swap('filter: blur(5px) saturate(1.25);', anim_svg(1.0,'2'), s)
s=s.replace('filter: blur(26px) saturate(1.4);','filter: blur(14px) saturate(1.4);')
s=swap('filter: blur(14px) saturate(1.4);', anim_svg(1.8,'7.5'," fill-opacity='0.65'"), s)

# reduced-motion static block: first mask pair = beam, second = beamglow
i=s.index("SMIL mask animation can't see prefers-reduced-motion")
j=s.index('}', s.index('.lr-hero__beamglow', i))
block=s[i:j]
uris=[static_svg(1.0,'2'), static_svg(1.0,'2'), static_svg(1.8,'7.5'," fill-opacity='0.65'"), static_svg(1.8,'7.5'," fill-opacity='0.65'")]
it=iter(uris)
block=re.sub(r'(-webkit-mask-image|mask-image): url\("data:image/svg\+xml[^"]*"\);',
             lambda m: m.group(1)+': '+next(it)+';', block)
s=s[:i]+block+s[j:]

open(p,'w').write(s)
print('done')
```

2. Confirm no other rule lost its mask: `grep -c "data:image/svg+xml" apps/website/src/components/landing-redesign/landing-redesign.css` — expect the same count as before the edit (there is also one dead `.lr-hero__beamflow` rule under `display: none` whose masks may remain untouched; do not delete it).

## Boundaries

- Do NOT touch `LandingRedesign.tsx`, the photo mask (`.lr-hero--split .lr-hero__photo` rule), or the mobile `@media (max-width: 767px)` overrides.
- Do NOT change wave amplitude (2.2), wavelength (60), duration (8s), or the ribbon's base shape profiles (C/W tables above).
- Do NOT add dependencies or hand-edit path strings.
- If the anchor strings are missing (code drifted), STOP and report.

## Verification

- **Mechanical**: `cd apps/website && npx tsc --noEmit` passes (CSS-only change, sanity). Dev server renders the hero with the band visible.
- **Feel check** (dev server, Chrome):
  - Watch the ribbon for one full 8s loop: the slither is continuous — no
    subtle direction "tick" every 2 seconds.
  - Glow softness looks unchanged (SVG blur replaced CSS blur); band edges are
    not suddenly crisper.
  - DevTools Rendering panel → emulate `prefers-reduced-motion: reduce`:
    ribbon freezes but its SHAPE matches the moving version's rest pose (same
    curve, same width), glow silhouette matches too.
- **Done when**: all three feel checks pass and the grep count matches.
