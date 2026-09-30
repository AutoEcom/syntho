import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export default function NotFound() {
  return (
    <Container className="py-28">
      <p className="label-micro">404</p>
      <h1 className="mt-4 max-w-xl text-3xl leading-tight font-medium tracking-[-0.02em] text-foreground">
        That surface does not exist.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you requested is not part of the deployment. The telemetry
        surfaces below are.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to overview</Link>
        </Button>
      </div>

      <ul className="mt-14 grid max-w-3xl gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block h-full bg-surface p-5 transition-colors hover:bg-surface-2/70"
            >
              <span className="block text-sm text-foreground">
                {item.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {item.hint}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
