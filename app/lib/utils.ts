import type { TokenMetrics } from "~/types/tokens";
import type { TimeframeEstimate, TimeframeCategory } from "~/types/tokens";

export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function fmtPrice(n: number): string {
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function scoreToLabel(
  score: number
): TokenMetrics["riskLabel"] {
  if (score <= 30) return "Low Risk";
  if (score <= 55) return "Medium Risk";
  if (score <= 75) return "High Risk";
  return "Extreme Risk";
}

export function scoreToColor(score: number): string {
  if (score <= 30) return "var(--green)";
  if (score <= 55) return "var(--orange)";
  if (score <= 75) return "var(--red)";
  return "#dc2626";
}

export function computeRiskScore(
  metrics: Omit<TokenMetrics, "riskScore" | "riskLabel">
): number {
  let score = 0;

  // liquidity ratio — low ratio = higher risk
  if (metrics.liquidityRatio < 0.05) score += 25;
  else if (metrics.liquidityRatio < 0.15) score += 15;
  else if (metrics.liquidityRatio < 0.3) score += 8;

  // holder concentration
  if (metrics.topHolderPct > 80) score += 25;
  else if (metrics.topHolderPct > 50) score += 15;
  else if (metrics.topHolderPct > 30) score += 8;

  // contract safety
  if (!metrics.verified) score += 15;
  if (!metrics.ownershipRenounced) score += 10;
  if (metrics.honeypotFlag) score += 30;

  // taxes
  if (metrics.sellTax > 20) score += 15;
  else if (metrics.sellTax > 10) score += 8;
  else if (metrics.sellTax > 5) score += 3;

  // token age
  if (metrics.ageInDays < 7) score += 15;
  else if (metrics.ageInDays < 30) score += 8;
  else if (metrics.ageInDays < 90) score += 3;

  // raw liquidity floor
  if (metrics.liquidity < 10_000) score += 15;
  else if (metrics.liquidity < 50_000) score += 8;

  return Math.min(score, 100);
}



export function classifyTimeframe(metrics: {
  ageInDays: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  priceChange24h: number;
  topHolderPct: number;
  riskScore: number;
}): TimeframeEstimate {
  const signals: string[] = [];
  const volumeToMcap = metrics.marketCap > 0 ? metrics.volume24h / metrics.marketCap : 0;
  const liquidityRatio = metrics.marketCap > 0 ? metrics.liquidity / metrics.marketCap : 0;

  let category: TimeframeCategory;
  let confidence: "low" | "medium" | "high" = "medium";

  // very new + high volume relative to mcap + high volatility = quick pump pattern
  if (metrics.ageInDays < 14 && volumeToMcap > 0.5 && Math.abs(metrics.priceChange24h) > 20) {
    category = "quick_pump";
    signals.push(`Token is only ${metrics.ageInDays} days old`);
    signals.push(`24h volume is ${(volumeToMcap * 100).toFixed(0)}% of market cap — unusually high turnover`);
    signals.push(`${Math.abs(metrics.priceChange24h).toFixed(0)}% 24h price swing signals speculative activity`);
    confidence = metrics.riskScore > 55 ? "high" : "medium";
  }
  // new-ish, moderate volume, still building — momentum but not yet peaked
  else if (metrics.ageInDays < 60 && volumeToMcap > 0.15 && metrics.topHolderPct < 50) {
    category = "momentum_play";
    signals.push(`${metrics.ageInDays} days old with sustained volume activity`);
    signals.push(`Holder distribution (top 10: ${metrics.topHolderPct}%) suggests organic accumulation, not just insiders`);
    confidence = "medium";
  }
  // low volume relative to mcap, decent liquidity, holder base spread out — quiet accumulation
  else if (volumeToMcap < 0.1 && liquidityRatio > 0.1 && metrics.topHolderPct < 40) {
    category = "accumulation";
    signals.push(`Low volume-to-market-cap ratio (${(volumeToMcap * 100).toFixed(1)}%) suggests quiet accumulation phase`);
    signals.push(`Healthy liquidity ratio (${(liquidityRatio * 100).toFixed(1)}%) supports stable entry/exit`);
    confidence = "low"; // accumulation patterns are the hardest to time
  }
  // older token, established, lower volatility = long-term hold candidate
  else {
    category = "long_term";
    signals.push(`Token has existed for ${metrics.ageInDays} days, past the high-risk early window`);
    signals.push(`Volume-to-market-cap ratio (${(volumeToMcap * 100).toFixed(1)}%) suggests steady rather than speculative trading`);
    confidence = metrics.riskScore < 40 ? "high" : "medium";
  }

  const LABELS: Record<TimeframeCategory, { label: string; window: string }> = {
    quick_pump: { label: "Quick Pump Pattern", window: "Days to 2 weeks" },
    momentum_play: { label: "Momentum Play", window: "2–8 weeks" },
    accumulation: { label: "Accumulation Phase", window: "1–6 months" },
    long_term: { label: "Long-Term Hold Candidate", window: "6+ months" },
  };

  return {
    category,
    label: LABELS[category].label,
    window: LABELS[category].window,
    confidence,
    signals,
  };
}