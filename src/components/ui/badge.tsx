import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = ({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("inline-flex items-center rounded-full bg-white/25 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/50 backdrop-blur", className)} {...p} />
);
