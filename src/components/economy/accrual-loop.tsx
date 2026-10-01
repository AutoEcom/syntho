import type { AccrualStep } from "@/lib/economy";

export function AccrualLoop({ steps }: { steps: readonly AccrualStep[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-edge bg-edge lg:grid-cols-3">
      {steps.map((step) => (
        <li
          key={step.id}
          className="flex h-full min-h-0 flex-col bg-surface p-6 sm:p-7 lg:p-8"
        >
          <p className="metric text-[11px] text-brand">{step.index}</p>
          <h3 className="mt-4 text-lg font-medium tracking-[-0.01em] text-foreground">
            {step.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
