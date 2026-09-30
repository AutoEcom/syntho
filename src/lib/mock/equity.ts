import type { EquityPoint } from "@/lib/types";
import { isoDateBefore, round, standardizedShocks } from "./seed";

/**
 * Root of the mock dataset: the portfolio equity series.
 *
 * Every other aggregate (returns, drawdown, Sharpe, agent capital) is derived
 * from this series rather than hardcoded, so the numbers shown across the app
 * are internally consistent. This module deliberately imports nothing from the
 * agent or metering mocks, which keeps the dependency graph acyclic.
 */

export const EQUITY_WINDOW_DAYS = 90;

/** Capital contributed by allocators since inception. */
export const NET_CONTRIBUTIONS = 20_000_000;

const START_EQUITY = 22_400_000;

/**
 * Days 62–74 of the window are a deliberate drawdown episode, placed late
 * enough that the series is still recovering at the right-hand edge. A curve
 * that ends at a new high makes every risk surface trivially green, which is
 * not a useful thing to design against.
 */
const DRAWDOWN_EPISODE: readonly [number, number] = [62, 74];

function buildEquityCurve(): EquityPoint[] {
  const shocks = standardizedShocks(0x5c4e7a11, EQUITY_WINDOW_DAYS - 1);
  const points: EquityPoint[] = [];

  let equity = START_EQUITY;
  let highWaterMark = START_EQUITY;

  for (let i = 0; i < EQUITY_WINDOW_DAYS; i += 1) {
    const inEpisode = i >= DRAWDOWN_EPISODE[0] && i <= DRAWDOWN_EPISODE[1];
    const drift = inEpisode ? -0.0044 : 0.0014;
    const vol = inEpisode ? 0.0082 : 0.0048;

    const dailyReturn = i === 0 ? 0 : drift + shocks[i - 1] * vol;
    equity *= 1 + dailyReturn;
    highWaterMark = Math.max(highWaterMark, equity);

    // Gross exposure breathes with conviction, and is cut during the episode.
    const leverage =
      1.82 + Math.sin(i / 7.5) * 0.24 + (inEpisode ? -0.38 : 0);

    points.push({
      date: isoDateBefore(EQUITY_WINDOW_DAYS - 1 - i),
      equity: round(equity, 2),
      highWaterMark: round(highWaterMark, 2),
      drawdown: round(equity / highWaterMark - 1, 6),
      dailyReturn: round(dailyReturn, 6),
      exposure: round(equity * leverage, 2),
    });
  }

  return points;
}

export const EQUITY_CURVE: EquityPoint[] = buildEquityCurve();

export const EQUITY_START: EquityPoint = EQUITY_CURVE[0];
export const EQUITY_LATEST: EquityPoint = EQUITY_CURVE[EQUITY_CURVE.length - 1];

/** Total equity under management. */
export const PORTFOLIO_EQUITY = EQUITY_LATEST.equity;

/** Daily returns excluding the seed day, used for all risk statistics. */
export const DAILY_RETURNS = EQUITY_CURVE.slice(1).map((p) => p.dailyReturn);

/** Equity as of `days` sessions before the latest close. */
export function equityDaysAgo(days: number): number {
  const index = Math.max(0, EQUITY_CURVE.length - 1 - days);
  return EQUITY_CURVE[index].equity;
}
