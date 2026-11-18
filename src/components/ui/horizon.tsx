import * as React from "react";
import { Volume, TONES, type VolumeProps } from "@/lib/volume";

/** Horizon - a wide cloud bank. Put it at the bottom of a hero or between sections as a divider. */
export type HorizonProps = Omit<VolumeProps, "kind" | "tone">;
export const Horizon = (p: HorizonProps) => (
  <Volume kind={2} tone={TONES.day} dist={7.8} pitch={4} yaw={0} autoRotate={0} interactive={false} steps={72} {...p} style={{ display: "block", width: "100%", height: 260, ...p.style }} />
);
