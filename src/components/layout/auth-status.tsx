"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/icp/auth";
import { cn } from "@/lib/utils";

export function AuthStatus({
  className,
  compact = false,
}: {
  className?: string;
  /** Full-width stacked controls, used in the mobile sheet. */
  compact?: boolean;
}) {
  const {
    isAuthenticated,
    isLoading,
    principal,
    principalText,
    login,
    logout,
  } = useAuth();

  if (isLoading && !isAuthenticated) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compact ? "lg" : "sm"}
        disabled
        className={cn(compact && "w-full", !compact && "h-9 min-h-9", className)}
      >
        Sign in
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compact ? "lg" : "sm"}
        onClick={() => void login()}
        className={cn(compact && "w-full", !compact && "h-9 min-h-9", className)}
      >
        Sign in
      </Button>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="rounded-lg border border-edge bg-surface-2/50 px-3 py-3">
          <p className="label-micro">Principal</p>
          <p className="metric mt-1.5 text-[13px] text-foreground">
            {principalText}
          </p>
          <p className="metric mt-1 break-all text-[11px] text-muted-foreground">
            {principal?.toText()}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-9 min-h-9 gap-1.5", className)}
        >
          <span className="relative flex size-1.5">
            <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
          </span>
          <span className="metric text-[12px]">{principalText}</span>
          <ChevronDownIcon data-icon="inline-end" className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>Internet Identity</DropdownMenuLabel>
        <p className="metric max-w-64 px-1.5 pb-1.5 text-[11px] leading-relaxed break-all text-muted-foreground">
          {principal?.toText()}
        </p>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logout();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
