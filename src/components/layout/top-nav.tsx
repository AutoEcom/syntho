"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuthStatus } from "./auth-status";
import { Container } from "./container";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
      className={cn(
        "pointer-events-auto fixed inset-x-0 top-0 z-[80] isolate border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        elevated
          ? "border-edge bg-background/92 shadow-panel"
          : "border-edge/70 bg-background/75"
      )}
    >
      <Container>
        <div className="flex h-14 min-h-14 items-center gap-3 sm:h-16 sm:gap-6">
          <Link
            href="/"
            className="flex min-h-11 min-w-11 shrink-0 items-center rounded-md transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label="Syntho home"
          >
            <Logo />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden h-16 items-center gap-0.5 lg:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 items-center px-2.5 text-sm transition-colors duration-200 lg:px-3",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-2 -bottom-px h-px bg-brand transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 lg:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
              </span>
              <span className="metric text-[11px] text-muted-foreground">
                Telemetry live
              </span>
            </span>

            <AuthStatus className="shrink-0" />

            <Button asChild size="sm" className="hidden h-9 min-h-9 sm:inline-flex">
              <Link href="/dashboard">
                Live telemetry
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[min(100vw,22rem)] flex-col border-l border-edge bg-surface p-0"
              >
                <div className="flex h-14 items-center border-b border-edge px-5">
                  <SheetTitle asChild>
                    <span>
                      <Logo />
                    </span>
                  </SheetTitle>
                </div>
                <nav aria-label="Primary" className="flex flex-col p-2">
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-14 flex-col justify-center gap-0.5 rounded-lg px-3 py-3 transition-colors duration-200",
                          active
                            ? "bg-surface-2 text-foreground"
                            : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                        )}
                      >
                        <span className="text-sm text-foreground">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-auto space-y-4 border-t border-edge p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <AuthStatus compact />
                  <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      View live telemetry
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
      </header>
      <div className="h-14 shrink-0 sm:h-16" aria-hidden="true" />
    </>
  );
}
