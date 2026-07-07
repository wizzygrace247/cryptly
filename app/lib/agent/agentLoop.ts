/**
 * Cryptly Agent Loop
 * ==================
 * Autonomous background agent that monitors watchlisted tokens,
 * re-scores them on each cycle, and emits alerts when risk changes.
 *
 * This is a true agent loop:
 *  1. PERCEIVE  — fetch current on-chain state for each watched token
 *  2. REASON    — re-run risk engine and compare to last known score
 *  3. ACT       — emit alert if score shifted by threshold or new flags appeared
 *  4. WAIT      — sleep for interval, then repeat
 *
 * Runs server-side via Vercel Cron (see vercel.json).
 * Can also be triggered manually via POST /api/agent/run
 */

import { fetchTokenByAddress } from "~/lib/api/dexscreener";
import { fetchTokenSecurity } from "~/lib/api/goplus";
import { computeRiskScore, scoreToLabel } from "~/lib/utils";
import { supabase } from "~/lib/db/supabase";
import type { Chain } from "~/types/tokens";

const SCORE_CHANGE_THRESHOLD = 10;

export interface AgentCycleResult {
  tokensScanned: number;
  alertsEmitted: number;
  errors: number;
  timestamp: string;
}

export async function runAgentCycle(): Promise<AgentCycleResult> {
  const result: AgentCycleResult = {
    tokensScanned: 0,
    alertsEmitted: 0,
    errors: 0,
    timestamp: new Date().toISOString(),
  };

  // PERCEIVE — load all watchlisted tokens from persistent store
  const { data: watchlist, error } = await supabase
    .from("watchlist")
    .select("*");

  if (error || !watchlist?.length) return result;

  // process each token
  await Promise.allSettled(
    watchlist.map(async (entry) => {
      try {
        result.tokensScanned++;

        // PERCEIVE — fetch current state
        const [dex, security] = await Promise.all([
          fetchTokenByAddress(entry.token_address, entry.chain as Chain),
          fetchTokenSecurity(entry.token_address, entry.chain as Chain),
        ]);

        const liquidityRatio =
          dex.marketCap > 0 ? dex.liquidity / dex.marketCap : 0;

        const partial = {
          name: dex.name,
          symbol: dex.symbol,
          address: dex.address,
          chain: entry.chain as Chain,
          price: dex.price,
          priceChange24h: dex.priceChange24h,
          marketCap: dex.marketCap,
          volume24h: dex.volume24h,
          liquidity: dex.liquidity,
          ageInDays: dex.ageInDays,
          topHolderPct: security.topHolderPct,
          verified: security.verified,
          ownershipRenounced: security.ownershipRenounced,
          honeypotFlag: security.honeypotFlag,
          buyTax: security.buyTax,
          sellTax: security.sellTax,
          liquidityRatio,
        };

        // REASON — re-score
        const newScore = computeRiskScore(partial as any);
        const lastScore = entry.last_score ?? newScore;
        const delta = newScore - lastScore;
        const alerts: string[] = [];

        // REASON — determine what changed
        if (security.honeypotFlag) {
          alerts.push(` HONEYPOT DETECTED on ${entry.symbol}`);
        }
        if (Math.abs(delta) >= SCORE_CHANGE_THRESHOLD) {
          alerts.push(
            delta > 0
              ? ` ${entry.symbol} risk score increased by ${delta} points (now ${newScore}/100)`
              : ` ${entry.symbol} risk improved by ${Math.abs(delta)} points (now ${newScore}/100)`
          );
        }
        if (!security.verified && entry.last_score !== null) {
          alerts.push(` ${entry.symbol} contract is no longer verified`);
        }

        // ACT — write alerts to DB + update last score
        if (alerts.length > 0) {
          result.alertsEmitted += alerts.length;

          await supabase.from("agent_alerts").insert(
            alerts.map((message) => ({
              wallet_address: entry.wallet_address,
              token_symbol: entry.symbol,
              token_address: entry.token_address,
              chain: entry.chain,
              message,
              severity:
                message.startsWith("")
                  ? "danger"
                  : message.startsWith("")
                  ? "warning"
                  : "info",
              created_at: new Date().toISOString(),
            }))
          );
        }

        // update score in watchlist
        await supabase
          .from("watchlist")
          .update({ last_score: newScore })
          .match({
            wallet_address: entry.wallet_address,
            token_address: entry.token_address,
            chain: entry.chain,
          });
      } catch (err) {
        result.errors++;
        console.error(`Agent cycle error for ${entry.token_address}:`, err);
      }
    })
  );

  console.log(
    `[Cryptly Agent] Cycle complete:`,
    JSON.stringify(result)
  );

  return result;
}