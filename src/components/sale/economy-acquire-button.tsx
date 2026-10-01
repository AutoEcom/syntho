"use client";

import { Button } from "@/components/ui/button";
import { AcquireSynDialog } from "@/components/sale/acquire-dialog";

export function EconomyAcquireButton() {
  return (
    <AcquireSynDialog>
      <Button variant="outline" size="sm" className="min-h-11 sm:min-h-8">
        Early access
      </Button>
    </AcquireSynDialog>
  );
}
