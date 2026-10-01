"use client";

import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { EARLY_ACCESS } from "@/lib/early-access";

export function EarlyAccessAcquire() {
  const { cta, ctaNote, placeholder } = EARLY_ACCESS;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="lg" className="w-full min-h-11 sm:w-auto">
          {cta}
        </Button>
      </Dialog.Trigger>
      <p className="metric mt-3 text-[11px] text-muted-foreground">{ctaNote}</p>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-edge bg-surface p-6 shadow-elevated outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <Dialog.Title className="text-base font-medium tracking-[-0.01em] text-foreground">
            {placeholder.title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {placeholder.body}
          </Dialog.Description>
          <div className="mt-6">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full min-h-11 sm:w-auto">
                {placeholder.dismiss}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
