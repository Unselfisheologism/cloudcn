import * as React from "react";
import { Volume, TONES, type VolumeProps } from "@/lib/volume";

/** Nimbus - one realistic volumetric 3D cumulus on a transparent background. Drag to orbit. */
export type NimbusProps = Omit<VolumeProps, "kind" | "tone">;
export const Nimbus = (p: NimbusProps) => <Volume kind={0} tone={TONES.day} {...p} style={{ display: "block", width: "100%", height: 340, ...p.style }} />;
