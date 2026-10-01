import type { SettlementAsset } from "@/lib/economy";
import { cn } from "@/lib/utils";

const ROLE_TONE: Record<SettlementAsset["role"], string> = {
  native: "text-brand",
  protocol: "text-foreground",
  coordination: "text-gold",
  external: "text-muted-foreground",
};

export function SettlementAssets({
  assets,
}: {
  assets: readonly SettlementAsset[];
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:grid-cols-2">
      {assets.map((asset) => (
        <article
          key={asset.id}
          className="flex h-full min-h-0 flex-col bg-surface p-6 sm:p-7"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="metric text-base tracking-[-0.01em] text-foreground">
              {asset.ticker}
            </h3>
            <span
              className={cn(
                "label-micro",
                ROLE_TONE[asset.role]
              )}
            >
              {asset.roleLabel}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium tracking-[-0.01em] text-foreground">
            {asset.title}
          </p>
          <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
            {asset.body}
          </p>
          <p className="metric mt-6 border-t border-edge pt-4 text-[11px] text-muted-foreground">
            Maps to {asset.mapsTo}
          </p>
        </article>
      ))}
    </div>
  );
}
