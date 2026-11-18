import * as React from "react";
import { Volume, TONES, type VolumeProps } from "@/lib/volume";

/** Tempest - a towering storm cloud with an anvil top. `lightning` (0..1) flashes light inside the volume. */
export type TempestProps = Omit<VolumeProps, "kind" | "tone">;
export const Tempest = ({ lightning = 0.6, ...p }: TempestProps) => (
  <Volume kind={1} tone={TONES.storm} dist={5.8} pitch={4} density={2.2} coverage={0.75} sunElevation={30} lightning={lightning} {...p} style={{ display: "block", width: "100%", height: 420, ...p.style }} />
);
