/**
 * Deterministic primitives for the mock layer.
 *
 * Nothing in `src/lib/mock` may call `Math.random()` or `Date.now()`. Mock data
 * is generated from a fixed seed against a fixed reference timestamp so that
 * server prerender and client hydration produce identical markup, and so that
 * screenshots and builds are reproducible.
 */

/** Reference "now" for the entire mock dataset. */
export const AS_OF = "2026-09-30T18:00:00.000Z";

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform over a uniform generator, for plausible return series. */
export function createGaussian(rng: () => number): () => number {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/**
 * A zero-mean, unit-variance shock series.
 *
 * Raw Gaussian draws have a non-zero sample mean over short windows, which
 * leaks into the realised drift and inflates Sharpe by an amount that depends
 * on the seed. Standardising the series first means the realised statistics of
 * a generated curve match the drift and volatility it was designed with, so the
 * numbers on screen stay plausible and are not an accident of the PRNG.
 */
export function standardizedShocks(seed: number, count: number): number[] {
  const gauss = createGaussian(createRng(seed));
  const raw = Array.from({ length: count }, gauss);
  const mean = raw.reduce((a, b) => a + b, 0) / count;
  const sd =
    Math.sqrt(raw.reduce((a, b) => a + (b - mean) ** 2, 0) / count) || 1;
  return raw.map((v) => (v - mean) / sd);
}

const DAY_MS = 86_400_000;

/** ISO date (`YYYY-MM-DD`) `offsetDays` before the reference timestamp. */
export function isoDateBefore(offsetDays: number, reference = AS_OF): string {
  return new Date(new Date(reference).getTime() - offsetDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Full ISO timestamp `offsetMinutes` before the reference timestamp. */
export function isoTimeBefore(offsetMinutes: number, reference = AS_OF): string {
  return new Date(
    new Date(reference).getTime() - offsetMinutes * 60_000
  ).toISOString();
}

export function round(value: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Annualised Sharpe from a daily return series, assuming a 0% risk-free rate. */
export function sharpeOf(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return (mean / Math.sqrt(variance)) * Math.sqrt(365);
}

/** Annualised Sortino — like Sharpe, but only downside deviation is penalised. */
export function sortinoOf(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter((r) => r < 0);
  const dd = Math.sqrt(
    downside.reduce((a, b) => a + b ** 2, 0) / Math.max(1, downside.length)
  );
  return (mean / dd) * Math.sqrt(365);
}

/** Annualised standard deviation of a daily return series. */
export function volatilityOf(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(365);
}
