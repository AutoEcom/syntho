/**
 * Early access — copy and rate for the landing instrument card.
 * Treasury purchase is not wired; the CTA opens a placeholder only.
 */

export const EARLY_ACCESS = {
  id: "early-access",
  eyebrow: "Early access",
  headline: "Acquire $SYN at a fixed rate",
  lede: "1 $SYN = $0.01. Settlement in ICP or USDC. Funds route to the protocol treasury.",
  unitAmount: 1,
  usdPerToken: 0.01,
  accepted: ["ICP", "USDC"] as const,
  forthcoming: ["Cycles", "$SYN"] as const,
  body: "Early access is available at a fixed rate through the protocol treasury. No liquidity pool is active at this stage.",
  cta: "Acquire $SYN",
  ctaNote: "Internet Identity required",
  placeholder: {
    title: "Connect wallet",
    body: "Treasury settlement is not connected in this build. Internet Identity will be required when the purchase flow is live.",
    dismiss: "Close",
  },
} as const;
