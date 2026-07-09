import type { TokenMetrics } from "~/types/tokens";

export function buildAnalysisPrompt(metrics: TokenMetrics): string {
  return `
Give a brief risk explanation for this token. Be extremely concise.

Token: ${metrics.name} (${metrics.symbol})
Risk Score: ${metrics.riskScore}/100 (${metrics.riskLabel})
Liquidity: $${metrics.liquidity.toLocaleString()} | Age: ${metrics.ageInDays}d
Top 10 Holders: ${metrics.topHolderPct}% | Verified: ${metrics.verified ? "Yes" : "No"}
Honeypot: ${metrics.honeypotFlag ? "YES" : "No"} | Sell Tax: ${metrics.sellTax}%

Give exactly 2 short bullet points (max 15 words each) on what's driving this score.
No intro, no closing line, no disclaimers — just the 2 bullets.
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