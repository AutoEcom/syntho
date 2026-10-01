import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";

const PLATFORM_LINKS = NAV_ITEMS;

const PROTOCOL_LINKS = [
  { href: "https://internetcomputer.org", label: "Internet Computer" },
  { href: "https://dashboard.internetcomputer.org", label: "ICP Dashboard" },
  {
    href: "https://internetcomputer.org/docs/building-apps/essentials/gas-cost",
    label: "Cycles & gas costs",
  },
  {
    href: "https://internetcomputer.org/docs/references/ic-interface-spec",
    label: "Interface specification",
  },
];

const RESOURCE_LINKS = [
  { href: "/dashboard", label: "Methodology" },
  { href: "/telemetry", label: "Risk framework" },
  { href: "/metering", label: "Cost of compute" },
  { href: "/economy", label: "Protocol economy" },
  { href: "/agents", label: "Agent registry" },
];

export function SiteFooter({ asOf }: { asOf: string }) {
  return (
    <footer className="mt-16 border-t border-edge bg-surface/40 sm:mt-24">
      <Container>
        <div className="grid gap-12 py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Autonomous trading intelligence running as canister software on
              the Internet Computer. Performance, risk and compute cost are
              published from the same state the agents execute against.
            </p>
          </div>

          <FooterColumn title="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Reference" links={RESOURCE_LINKS} />
          <FooterColumn title="Protocol" links={PROTOCOL_LINKS} external />
        </div>

        <div className="flex flex-col gap-4 border-t border-edge py-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date(asOf).getUTCFullYear()} Syntho.
          </p>
          <p className="metric text-[11px] text-muted-foreground">
            syntho.cc
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  external = false,
}: {
  title: string;
  links: { href: string; label: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <h3 className="label-micro">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            {external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
