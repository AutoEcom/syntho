import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { AccrualLoop } from "@/components/economy/accrual-loop";
import { SettlementAssets } from "@/components/economy/settlement-assets";
import { SupplyArchitecture } from "@/components/economy/supply-architecture";
import { UtilityStages } from "@/components/economy/utility-stages";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/page-header";
import { Enter } from "@/components/motion/enter";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerChildren } from "@/components/motion/stagger-children";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACCRUAL_STEPS,
  ALLOCATIONS,
  SETTLEMENT_ASSETS,
  SYNTHO_TOKEN,
  UTILITY_STAGES,
} from "@/lib/economy";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Protocol Economy",
  description:
    "How $SYN coordinates access and incentives around autonomous trading intelligence on the Internet Computer. Cycles remain the native compute fuel. Closed-loop design, fixed supply.",
};

const PRINCIPLES = [
  {
    title: "Product first",
    body: "The token coordinates access and incentives around autonomous trading intelligence and transparent on-chain telemetry. Utility is a property of the product, not of issuance.",
  },
  {
    title: "Cycles stay native",
    body: "Cycles are the compute fuel of the Internet Computer. $SYN complements that unit. It does not replace it, and it does not hide cycle burn.",
  },
  {
    title: "Closed-loop accrual",
    body: "Real protocol activity generates treasury inflows. Those inflows can support the network. Perpetual inflationary emissions are not the primary engine.",
  },
] as const;

export default function EconomyPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-edge">
        <div
          aria-hidden="true"
          className="grid-field grid-field-live pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="brand-wash pointer-events-none absolute inset-0"
        />

        <Container className="relative">
          <div className="pt-12 pb-14 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
            <Enter>
              <p className="label-micro">Architecture</p>
            </Enter>
            <Enter delay={0.07}>
              <h1 className="mt-4 max-w-3xl text-[1.75rem] leading-[1.12] font-medium tracking-[-0.03em] text-foreground sm:text-[3rem] sm:leading-[1.08] lg:text-[3.5rem]">
                Protocol Economy
              </h1>
            </Enter>
            <Enter delay={0.14}>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/90 sm:mt-6 sm:text-lg">
                Utility, compute and closed-loop design. {SYNTHO_TOKEN.symbol}{" "}
                coordinates access around a product that already meters its own
                cost in cycles.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                This page describes settlement, incentives and supply. It is not
                a purchase interface. Figures are the current architecture and
                can be updated independently of the rest of the site.
              </p>
            </Enter>
            <Enter delay={0.21}>
              <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:inline-grid sm:grid-cols-3">
                <HeroStat
                  label="Hard cap"
                  value={formatCount(SYNTHO_TOKEN.hardCap)}
                  unit={SYNTHO_TOKEN.symbol}
                />
                <HeroStat label="Issuance" value="Fixed" unit="no core inflation" />
                <HeroStat
                  label="Settlement"
                  value="4"
                  unit="Cycles · ICP · $SYN · USDC"
                />
              </dl>
            </Enter>
            <Enter delay={0.28}>
              <div className="mt-6 sm:mt-7">
                <Button asChild variant="outline" size="sm" className="min-h-11 sm:min-h-8">
                  <Link href={{ pathname: "/", hash: "early-access" }}>
                    Early access
                  </Link>
                </Button>
              </div>
            </Enter>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Mandate"
              title={`Why ${SYNTHO_TOKEN.symbol} exists`}
              description="A coordination asset for a product that already has a unit of compute, a unit of settlement, and a measured cost of running agents."
            />
          </FadeIn>

          <StaggerChildren
            inView
            className="mt-10 divide-y divide-edge border-y border-edge sm:mt-12"
          >
            {PRINCIPLES.map((principle) => (
              <div
                key={principle.title}
                className="grid gap-3 py-8 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-10 lg:grid-cols-[minmax(0,20rem)_1fr]"
              >
                <h3 className="text-base font-medium tracking-[-0.01em] text-foreground">
                  {principle.title}
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            ))}
          </StaggerChildren>

          <FadeIn inView delay={0.08}>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Access, compute coordination and network authority are functions
              of using Syntho. They are not a substitute for telemetry, risk
              limits or cycle runway. If the product is idle, {SYNTHO_TOKEN.symbol}{" "}
              has nothing to coordinate.
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="border-y border-edge bg-surface/30 py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Settlement"
              title="Payment architecture"
              description="Operators may settle in Cycles, ICP, $SYN or USDC. Every path maps to the same two constraints: what the operator may run, and what the replica must burn."
            />
          </FadeIn>

          <FadeIn inView delay={0.08}>
            <div className="mt-10 sm:mt-12">
              <SettlementAssets assets={SETTLEMENT_ASSETS} />
            </div>
          </FadeIn>

          <FadeIn inView delay={0.12}>
            <Card className="mt-6 gap-0 p-5 sm:p-6">
              <p className="label-micro">Mapping</p>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Agent access and allocation limits are product permissions.
                Compute is cycle burn inside canisters. Settlement assets fund
                those two surfaces at the edge; they do not rewrite how the
                Internet Computer meters execution. $SYN can discount or
                prioritize the edge terms. It cannot replace cycles.
              </p>
            </Card>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Staged utility"
              title={`Utility of ${SYNTHO_TOKEN.symbol}`}
              description="Permissions and terms, applied in order. Each stage is a product control. None of them mint supply."
            />
          </FadeIn>
          <FadeIn inView delay={0.08}>
            <div className="mt-10 sm:mt-12">
              <UtilityStages stages={UTILITY_STAGES} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="border-y border-edge bg-surface/30 py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Closed loop"
              title="Value accrual"
              description="Protocol activity → treasury inflows → network support. The loop is inert if the product does not generate real activity."
            />
          </FadeIn>
          <FadeIn inView delay={0.08}>
            <div className="mt-10 sm:mt-12">
              <AccrualLoop steps={ACCRUAL_STEPS} />
            </div>
          </FadeIn>
          <FadeIn inView delay={0.12}>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Network support means provisioning cycles, keeping canisters
              solvent and sustaining operators who are already producing
              telemetry. It is not a commitment to perpetual issuance. If
              activity falls, inflows fall with it.
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Supply"
              title="Supply architecture"
              description={`${formatCount(SYNTHO_TOKEN.hardCap)} ${SYNTHO_TOKEN.symbol}. Fixed cap. Inflationary emissions are not the core mechanism of network support.`}
            />
          </FadeIn>

          <FadeIn inView delay={0.08}>
            <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-14">
              <div>
                <p className="label-micro">Hard cap</p>
                <p className="metric mt-3 text-[2rem] leading-none font-medium tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
                  {formatCount(SYNTHO_TOKEN.hardCap)}
                </p>
                <p className="metric mt-2 text-sm text-muted-foreground">
                  {SYNTHO_TOKEN.symbol}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Core contributor tokens unlock on a 12-month cliff and vest
                  over 36 months. Other buckets are purpose-bound. None of them
                  are an emissions engine.
                </p>
              </div>
              <SupplyArchitecture buckets={ALLOCATIONS} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="border-t border-edge">
        <Container>
          <FadeIn inView>
            <div className="flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl leading-snug font-medium tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
                  Read the product, then the architecture.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Allocation limits, cycle burn and risk telemetry are already
                  published. This page only describes how settlement and{" "}
                  {SYNTHO_TOKEN.symbol} sit next to that stack.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <Button asChild size="lg" className="w-full min-h-11 sm:w-auto">
                  <Link href="/dashboard">
                    View live telemetry
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full min-h-11 sm:w-auto"
                >
                  <Link href="/metering">Cycles & metering</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </>
  );
}

function HeroStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-surface px-5 py-4 sm:min-w-[12.5rem]">
      <dt className="label-micro">{label}</dt>
      <dd className="metric mt-2 text-lg text-foreground">{value}</dd>
      <p className="metric mt-1 text-[11px] text-muted-foreground">{unit}</p>
    </div>
  );
}
