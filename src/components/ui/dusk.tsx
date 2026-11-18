import * as React from "react";
import { Volume, TONES, type VolumeProps } from "@/lib/volume";

/** Dusk - the same volumetric cumulus lit by a low sun: warm rim light, violet shadows. */
export type DuskProps = Omit<VolumeProps, "kind" | "tone">;
export const Dusk = (p: DuskProps) => <Volume kind={0} tone={TONES.dusk} sunElevation={7} sunAzimuth={-60} {...p} style={{ display: "block", width: "100%", height: 340, ...p.style }} />;
