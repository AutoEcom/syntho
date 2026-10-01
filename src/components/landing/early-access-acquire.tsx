"use client";

import { Button } from "@/components/ui/button";
import { AcquireSynDialog } from "@/components/sale/acquire-dialog";
import { EARLY_ACCESS } from "@/lib/early-access";

export function EarlyAccessAcquire() {
  return (
    <AcquireSynDialog note={EARLY_ACCESS.ctaNote}>
      <Button size="lg" className="w-full min-h-11 sm:w-auto">
        {EARLY_ACCESS.cta}
      </Button>
    </AcquireSynDialog>
  );
}
