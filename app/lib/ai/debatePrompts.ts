import type { TokenMetrics } from "~/types/tokens";

function dataBlock(m: TokenMetrics): string {
  return `
${m.name} (${m.symbol}) on ${m.chain} | Score: ${m.riskScore}/100
Price: $${m.price} (${m.priceChange24h}% 24h) | MCap: $${m.marketCap.toLocaleString()}
Liquidity: $${m.liquidity.toLocaleString()} (${((m.liquidityRatio ?? 0) * 100).toFixed(1)}% of mcap)
Age: ${m.ageInDays}d | Top10 Holders: ${m.topHolderPct}%
Verified: ${m.verified ? "Yes" : "No"} | Renounced: ${m.ownershipRenounced ? "Yes" : "No"}
Honeypot: ${m.honeypotFlag ? "YES" : "No"} | Tax: ${m.buyTax}%/${m.sellTax}%
Pattern: ${m.timeframe?.label ?? "Unknown"}
  `.trim();
}

function newsBlock(newsContext?: string): string {
  if (!newsContext) return "";
  return `\nNews: ${newsContext}\n`;
}

export function buildBullPrompt(m: TokenMetrics, newsContext?: string): string {
  return `
BULL AGENT. Make the strongest honest case FOR this token. Use only real data/news below.

${dataBlock(m)}
${newsBlock(newsContext)}
Exactly 2 bullet points, max 15 words each. No intro, no closing line.
  `.trim();
}

export function buildBearPrompt(m: TokenMetrics, newsContext?: string): string {
  return `
BEAR AGENT. Make the strongest honest case AGAINST this token. Use only real data/news below.

${dataBlock(m)}
${newsBlock(newsContext)}
Exactly 2 bullet points, max 15 words each. No intro, no closing line.
  `.trim();
}

export function buildSecurityPrompt(m: TokenMetrics): string {
  return `
SECURITY AGENT. Contract/holder security only — ignore price and news.

${dataBlock(m)}

Exactly 2 bullet points, max 15 words each, naming the specific concern. No intro, no closing line.
  `.trim();
}

export function buildJudgePrompt(
  m: TokenMetrics,
  bullCase: string,
  bearCase: string,
  securityCase: string,
  newsContext?: string
): string {
  return `
JUDGE AGENT. Weigh the three arguments below and commit to ONE definitive side.

${dataBlock(m)}
${newsBlock(newsContext)}
BULL CASE:
${bullCase}

BEAR CASE:
${bearCase}

SECURITY CASE:
${securityCase}

You MUST pick exactly one side — BULLISH or BEARISH. Never say neutral, moderate,
mixed, or "it depends". Weigh which side's case is stronger given the data and commit fully.

Respond in exactly this format, nothing else:
VERDICT: BULLISH or BEARISH
REASON: one sentence, max 20 words, citing the single most decisive factor.
  `.trim();
}