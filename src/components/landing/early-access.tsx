import { EarlyAccessAcquire } from "./early-access-acquire";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { EARLY_ACCESS } from "@/lib/early-access";
import { formatUsd } from "@/lib/format";

export function EarlyAccessSection() {
  const {
    id,
    eyebrow,
    headline,
    lede,
    unitAmount,
    usdPerToken,
    accepted,
    forthcoming,
    body,
  } = EARLY_ACCESS;

  return (
    <section
      id={id}
      aria-labelledby="early-access-heading"
      className="relative scroll-mt-20 border-b border-edge bg-surface/20 py-8 sm:py-12 lg:py-14"
    >
      <Container>
        <FadeIn inView>
          <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-surface shadow-[0_0_0_1px_color-mix(in_oklch,var(--syntho-brand)_10%,transparent),0_28px_56px_-32px_rgb(0_0_0_/_0.9)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,color-mix(in_oklch,var(--syntho-brand)_14%,transparent),transparent_55%)]"
            />

            <div className="relative grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="flex flex-col border-b border-edge p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
                <p className="label-micro">{eyebrow}</p>
                <h2
                  id="early-access-heading"
                  className="mt-4 max-w-lg text-[1.5rem] leading-snug font-medium tracking-[-0.02em] text-foreground sm:text-[1.875rem]"
                >
                  {headline}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {lede}
                </p>

                <p className="label-micro mt-10">Fixed rate</p>
                <p className="metric mt-3 text-[2rem] leading-none font-medium tracking-[-0.03em] text-foreground sm:text-[2.5rem]">
                  {unitAmount} $SYN
                </p>
                <p className="metric mt-2 text-lg text-brand sm:text-xl">
                  = {formatUsd(usdPerToken, true)}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
                <div>
                  <p className="label-micro">Settlement</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {accepted.map((asset) => (
                      <li
                        key={asset}
                        className="metric rounded-md border border-edge bg-background/50 px-3 py-2 text-[12px] text-foreground"
                      >
                        {asset}
                      </li>
                    ))}
                  </ul>
                  <p className="metric mt-3 text-[11px] text-muted-foreground">
                    {forthcoming.join(" · ")} later
                  </p>
                  <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>

                <div>
                  <EarlyAccessAcquire />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
