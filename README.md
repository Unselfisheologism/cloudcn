# Cirrus

A small shadcn/ui-style component set. Copy the files into your project, own the code.
Headline component: **Nimbus**, one realistic volumetric 3D cloud on a transparent background. (**Stratus** is the older full-sky cloud deck, kept as an extra.)

## Install (copy-paste)
1. Needs React 18+, Tailwind CSS 4, and `clsx tailwind-merge class-variance-authority`.
2. Copy `src/lib/utils.ts` and `src/components/ui/nimbus.tsx` (plus button/card/badge if you want them).
3. Use it:

```tsx
import { Nimbus } from "@/components/ui/nimbus";

<Nimbus className="min-h-screen" coverage={0.55}>
  <h1>Your content on top of the sky</h1>
</Nimbus>
```

## Nimbus props
coverage (0-1), density, speed (0 freezes), sunElevation, sunAzimuth, yaw, pitch, interactive (drag to orbit),
quality (0.25-1 render scale), steps (24-96), seed (changes the shape), time (fixed time for stills).

## How it looks real
3D fBm density through a cloud deck, raymarched in a fragment shader. Light is marched toward the sun per sample
(Beer-Lambert), with powder darkening, dual-lobe Henyey-Greenstein scattering for silver linings, height ambient,
aerial haze and wind drift. Pauses off-screen, honors prefers-reduced-motion, falls back to a gradient without WebGL.

## Run the demo
`npm i && npx vite` then open `/demo.html`.


## The family

| Component | What it is | Needs |
| --- | --- | --- |
| Nimbus | fair-weather 3D cloud | glcanvas, volume |
| Dusk | sunset cloud, warm and violet | glcanvas, volume |
| Tempest | storm tower with anvil, `lightning` 0..1 | glcanvas, volume |
| Horizon | wide cloud bank, not draggable | glcanvas, volume |
| Wisp | thin high streaks, `tone` white or slate, `coverage`, `angle` | glcanvas |
| Haze | low fog, `tone` white or slate, `coverage` | glcanvas |
| Stratus | full cloud sky (extra) | self-contained |

Copy `src/lib/glcanvas.tsx` (and `src/lib/volume.tsx` for the first four) plus the component file. Each has its own `registry/*.json`.
