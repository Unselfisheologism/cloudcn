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
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    >
      <defs>
        <filter id={filter} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="18" />
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafd" />
          <stop offset="1" stopColor="#bfccdf" />
        </linearGradient>
      </defs>
      <g filter={`url(#${filter})`} fill={`url(#${grad})`} opacity="0.48">
        <ellipse cx="86" cy="156" rx="70" ry="19" />
        <ellipse cx="128" cy="145" rx="42" ry="24" />
        <ellipse cx="196" cy="154" rx="64" ry="22" />
        <ellipse cx="240" cy="139" rx="37" ry="26" />
        <ellipse cx="276" cy="158" rx="57" ry="18" />
      </g>
    </svg>
  );
}
