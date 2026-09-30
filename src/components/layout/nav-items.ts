export interface NavItem {
  href: string;
  label: string;
  /** One-line description, surfaced in the mobile menu and the footer. */
  hint: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "Portfolio equity, risk posture and agent roster",
  },
  {
    href: "/agents",
    label: "Agents",
    hint: "Per-agent mandate, performance and limits",
  },
  {
    href: "/telemetry",
    label: "Telemetry",
    hint: "Drawdown, exposure and live risk flags",
  },
  {
    href: "/metering",
    label: "Metering",
    hint: "Cycle burn, runway and cost of compute",
  },
];
