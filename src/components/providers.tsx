"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/icp/auth";
import { LiveClockProvider } from "@/hooks/use-live-metrics";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LiveClockProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </LiveClockProvider>
    </AuthProvider>
  );
}
