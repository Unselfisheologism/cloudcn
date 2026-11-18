import * as React from "react";

/**
 * Static SVG cloud shown when WebGL is unavailable or the GPU context dies,
 * so a cloud component never collapses to a blank or broken box.
 * Pure SVG (fractal-noise displaced blobs), self-contained, no assets.
 */
export function CloudFallback({ style }: { style?: React.CSSProperties }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const filter = `cf-f-${uid}`;
  const grad = `cf-g-${uid}`;
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    >
      <defs>
        <filter id={filter} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="30" />
        </filter>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafd" />
          <stop offset="1" stopColor="#bfccdf" />
        </linearGradient>
      </defs>
      <g filter={`url(#${filter})`} fill={`url(#${grad})`}>
        <ellipse cx="160" cy="126" rx="98" ry="40" />
        <ellipse cx="110" cy="102" rx="54" ry="37" />
        <ellipse cx="206" cy="96" rx="48" ry="34" />
        <ellipse cx="158" cy="78" rx="42" ry="31" />
      </g>
    </svg>
  );
}
