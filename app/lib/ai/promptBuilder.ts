import type { TokenMetrics } from "~/types/tokens";

export function buildAnalysisPrompt(metrics: TokenMetrics): string {
  const timeframe = metrics.timeframe;
  const timeframeLabel = timeframe?.label ?? "Not available";
  const timeframeWindow = timeframe?.window ?? "Not available";
  const timeframeSignals = timeframe?.signals?.join("; ") ?? "No signals available";

  return `
Analyze this token and explain its risk profile in 4 short bullet points.

Token: ${metrics.name} (${metrics.symbol})
Chain: ${metrics.chain}
Risk Score: ${metrics.riskScore}/100
Price: $${metrics.price}
24h Change: ${metrics.priceChange24h}%
Market Cap: $${metrics.marketCap.toLocaleString()}
Liquidity: $${metrics.liquidity.toLocaleString()}
24h Volume: $${metrics.volume24h.toLocaleString()}
Token Age: ${metrics.ageInDays} days
Top 10 Holder Concentration: ${metrics.topHolderPct}%
Contract Verified: ${metrics.verified ? "Yes" : "No"}
Ownership Renounced: ${metrics.ownershipRenounced ? "Yes" : "No"}
Honeypot Risk: ${metrics.honeypotFlag ? "DETECTED" : "None"}
Buy/Sell Tax: ${metrics.buyTax}% / ${metrics.sellTax}%

Behavioral Pattern Classification: ${timeframeLabel} (${timeframeWindow})
Pattern signals: ${timeframeSignals}

Give 4 bullet points explaining what's driving the risk score. Reference the behavioral pattern classification and briefly explain why that holding-horizon pattern fits the data — but make clear this reflects historical/current pattern-reading, not a forecast or promise of returns. End with one line on what additional data would improve confidence.
  `.trim();
}

export function buildComparePrompt(
  a: TokenMetrics,
  b: TokenMetrics
): string {
  return `
Compare these two crypto tokens and give a clear verdict on which is the better risk/reward opportunity.

TOKEN A: ${a.name} (${a.symbol}) on ${a.chain}
- Risk Score: ${a.riskScore}/100 (${a.riskLabel})
- Price: $${a.price} | 24h Change: ${a.priceChange24h}%
- Market Cap: $${a.marketCap.toLocaleString()}
- Liquidity: $${a.liquidity.toLocaleString()}
- 24h Volume: $${a.volume24h.toLocaleString()}
- Age: ${a.ageInDays} days
- Top 10 Holders: ${a.topHolderPct}%
- Verified: ${a.verified} | Renounced: ${a.ownershipRenounced}
- Honeypot: ${a.honeypotFlag} | Sell Tax: ${a.sellTax}%
- Timeframe Pattern: ${a.timeframe?.label} (${a.timeframe?.window})

TOKEN B: ${b.name} (${b.symbol}) on ${b.chain}
- Risk Score: ${b.riskScore}/100 (${b.riskLabel})
- Price: $${b.price} | 24h Change: ${b.priceChange24h}%
- Market Cap: $${b.marketCap.toLocaleString()}
- Liquidity: $${b.liquidity.toLocaleString()}
- 24h Volume: $${b.volume24h.toLocaleString()}
- Age: ${b.ageInDays} days
- Top 10 Holders: ${b.topHolderPct}%
- Verified: ${b.verified} | Renounced: ${b.ownershipRenounced}
- Honeypot: ${b.honeypotFlag} | Sell Tax: ${b.sellTax}%
- Timeframe Pattern: ${b.timeframe?.label} (${b.timeframe?.window})

Give your response in exactly this structure:
WINNER: [Token A name] or [Token B name] or TIE
REASON: 3 bullet points comparing the two directly, referencing specific numbers
CAVEAT: One honest warning about the winner's weaknesses
  `.trim();
}