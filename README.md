# cloudcn

[Live demo](https://cloudcn.pages.dev/) · [Component registry](https://cloudcn.pages.dev/r/index.json) · [MIT license](./LICENSE)

Copy-paste WebGL cloud components for React and Tailwind, in the style of shadcn/ui. Each cloud is a real raymarched or layered shader on a transparent background, so you can float it over any UI.

| Component | What it is | Needs |
| --- | --- | --- |
| Nimbus | fair-weather 3D cloud, drag to orbit | glcanvas, volume |
| Dusk | sunset cloud, warm edges and violet shadows | glcanvas, volume |
| Tempest | storm tower with an anvil, `lightning` 0 to 1 | glcanvas, volume |
| Horizon | wide cloud bank for a hero base or divider | glcanvas, volume |
| Wisp | thin high streaks, `tone` white or slate, `coverage`, `angle` | glcanvas |
| Haze | low fog, `tone` white or slate, `coverage` | glcanvas |
| Stratus | full cloud sky (extra) | self-contained |

## Use it

1. Copy `src/lib/utils.ts`, `src/lib/glcanvas.tsx` and `src/lib/fallback.tsx`. For Nimbus, Dusk, Tempest and Horizon also copy `src/lib/volume.tsx`.
2. Copy the component file from `src/components/ui/`.
3. Make sure Tailwind v4 is set up and the `@` alias points at `src`.

```tsx
import { Nimbus } from "@/components/ui/nimbus";

<div className="h-80 bg-slate-900">
  <Nimbus coverage={0.6} style={{ height: "100%" }} />
</div>
```

On light pages use `tone="slate"` for Wisp and Haze.

## Common props

`coverage` (0 to 1), `density`, `speed` (0 freezes motion), `sunElevation`, `sunAzimuth`, `quality` (render scale 0.25 to 1, lower it on slow phones), `steps`, `seed`, `time` (fixed time in seconds for still images), `interactive`.

## How it looks real

3D fBm density raymarched in a fragment shader. Light is marched toward the sun at each sample (Beer-Lambert, powder darkening, dual-lobe Henyey-Greenstein scattering for silver linings), with a sky-tinted ambient. Each canvas pauses off screen, respects prefers-reduced-motion, and shows a static SVG cloud if WebGL is unavailable or fails.

## Honest limits

Procedural clouds, not photographs. Tempest is soft. Dusk shows a faint green fringe on very dark backgrounds. Tested in headless Chrome with software rendering; real phone GPU speed is not measured.

## Run the demo

`npm i && npm run dev`, then open the printed local address. The `registry/` folder has a shadcn-style JSON entry per component.
