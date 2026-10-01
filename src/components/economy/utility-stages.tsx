import type { UtilityStage } from "@/lib/economy";

export function UtilityStages({
  stages,
}: {
  stages: readonly UtilityStage[];
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage) => (
        <article
          key={stage.id}
          className="flex h-full min-h-0 flex-col bg-surface p-5 sm:p-6"
        >
          <p className="metric text-[11px] text-brand">{stage.index}</p>
          <h3 className="mt-4 text-base font-medium tracking-[-0.01em] text-foreground">
            {stage.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {stage.body}
          </p>
          <p className="metric mt-6 border-t border-edge pt-4 text-[11px] text-muted-foreground">
            {stage.note}
          </p>
        </article>
      ))}
    </div>
  );
}
