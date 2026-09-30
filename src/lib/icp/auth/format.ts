import type { Principal } from "@dfinity/principal";

/**
 * Compact principal for the nav: first five characters, last three.
 * `w3gef-7zba4-…-qcx` reads as `w3gef…qcx`.
 */
export function formatPrincipalShort(principal: Principal | string): string {
  const text = typeof principal === "string" ? principal : principal.toText();
  if (text.length <= 10) return text;
  return `${text.slice(0, 5)}…${text.slice(-3)}`;
}
