import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS } from "@/lib/types";
import type { CanisterInfo } from "@/lib/types";
import {
  formatBytes,
  formatCount,
  formatCycles,
  formatMs,
  formatRatio,
  truncatePrincipal,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const HEADERS = [
  { label: "Canister", align: "left" as const },
  { label: "Role", align: "left" as const },
  { label: "Balance", align: "right" as const },
  { label: "Burn 24H", align: "right" as const },
  { label: "Runway", align: "right" as const },
  { label: "Memory", align: "right" as const },
  { label: "Calls 24H", align: "right" as const },
  { label: "Latency", align: "right" as const },
  { label: "Subnet", align: "right" as const },
];

/** Full deployment inventory: what is running, where, and what it costs. */
export function CanisterTable({
  canisters,
  /** Runway below this many days is flagged. */
  runwayThreshold = 20,
}: {
  canisters: CanisterInfo[];
  runwayThreshold?: number;
}) {
  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-edge bg-surface shadow-panel">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="border-edge hover:bg-transparent">
            {HEADERS.map((header) => (
              <TableHead
                key={header.label}
                className={cn(
                  "h-11 bg-surface-2/40 px-4 text-[11px] font-normal tracking-[0.1em] text-muted-foreground uppercase",
                  header.align === "right" && "text-right"
                )}
              >
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {canisters.map((canister) => (
            <TableRow
              key={canister.id}
              className="border-edge/70 hover:bg-surface-2/40"
            >
              <TableCell className="px-4 py-3.5">
                <span className="block text-[13px] text-foreground">
                  {canister.name}
                </span>
                <span className="metric mt-0.5 block text-[11px] text-muted-foreground">
                  {truncatePrincipal(canister.id)} · module{" "}
                  {canister.moduleHash}
                </span>
              </TableCell>

              <TableCell className="px-4 py-3.5 text-[12px] text-muted-foreground">
                {ROLE_LABELS[canister.role]}
              </TableCell>

              <TableCell className="metric px-4 py-3.5 text-right text-foreground">
                {formatCycles(canister.cycleBalance, false)}
              </TableCell>
              <TableCell className="metric px-4 py-3.5 text-right text-foreground">
                {formatCycles(canister.burn24h, false)}
              </TableCell>
              <TableCell
                className={cn(
                  "metric px-4 py-3.5 text-right",
                  canister.runwayDays < runwayThreshold
                    ? "text-gold"
                    : "text-foreground"
                )}
              >
                {formatRatio(canister.runwayDays, 1)}d
              </TableCell>
              <TableCell className="metric px-4 py-3.5 text-right text-muted-foreground">
                {formatBytes(canister.memoryBytes)}
              </TableCell>
              <TableCell className="metric px-4 py-3.5 text-right text-muted-foreground">
                {formatCount(canister.calls24h)}
              </TableCell>
              <TableCell className="metric px-4 py-3.5 text-right text-muted-foreground">
                {formatMs(canister.latencyMs)}
              </TableCell>
              <TableCell className="metric px-4 py-3.5 text-right text-muted-foreground">
                {canister.subnet}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
