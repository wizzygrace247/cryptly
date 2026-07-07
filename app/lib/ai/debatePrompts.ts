import type { TokenMetrics } from "~/types/tokens";

function dataBlock(m: TokenMetrics): string {
    return `
Token: ${m.name} (${m.symbol}) on ${m.chain}
Price: $${m.price} | 24h Change: ${m.priceChange24h}%
Market Cap: $${m.marketCap.toLocaleString()}
Liquidity: $${m.liquidity.toLocaleString()} (${((m.liquidityRatio ?? 0) * 100).toFixed(1)}% of mcap)
24h Volume: $${m.volume24h.toLocaleString()}
Token Age: ${m.ageInDays} days
Top 10 Holder Concentration: ${m.topHolderPct}%
Contract Verified: ${m.verified ? "Yes" : "No"}
Ownership Renounced: ${m.ownershipRenounced ? "Yes" : "No"}
Honeypot Risk: ${m.honeypotFlag ? "DETECTED" : "None"}
Buy/Sell Tax: ${m.buyTax}% / ${m.sellTax}%
Deterministic Risk Score: ${m.riskScore}/100 (${m.riskLabel})
Behavioral Pattern: ${m.timeframe?.label ?? "Unknown"} (${m.timeframe?.window ?? "—"})
  `.trim();
}

function newsBlock(newsContext?: string): string {
    if (!newsContext) return "";
    return `\nRECENT NEWS & MARKET SENTIMENT:\n${newsContext}\n`;
}

export function buildBullPrompt(m: TokenMetrics, newsContext?: string): string {
    return `
You are the BULL AGENT in a risk debate council. Build the strongest honest case
for why this token could be an opportunity — using the data and news below, no
invented facts. If neither supports a bull case, say so plainly.

${dataBlock(m)}
${newsBlock(newsContext)}
Give exactly 2 bullet points making the bull case. Ground every point in a specific
number OR a specific fact from the news. If news mentions a burn, partnership, or
listing, treat that as a real reason to consider buying and cite it directly.
  `.trim();
}

export function buildBearPrompt(m: TokenMetrics, newsContext?: string): string {
    return `
You are the BEAR AGENT in a risk debate council. Build the strongest honest case
for why this token is risky or should be avoided — using the data and news below.

${dataBlock(m)}
${newsBlock(newsContext)}
Give exactly 2 bullet points making the bear case. Ground every point in a specific
number OR a specific fact from the news. If news mentions a hack, delisting, or
negative sentiment, treat that as a real red flag and cite it directly.
  `.trim();
}

export function buildSecurityPrompt(m: TokenMetrics): string {
    return `
You are the SECURITY AGENT in a risk debate council. Ignore price, news, and market
narrative entirely — your only job is contract and holder-level security analysis.

${dataBlock(m)}

Give exactly 2 bullet points on contract/holder security specifically
(verification, ownership, honeypot, tax, concentration). Flag anything concerning by name.
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
You are the JUDGE AGENT in a risk debate council. Three other agents submitted
their analysis. Weigh their arguments and give a final verdict.

${dataBlock(m)}
${newsBlock(newsContext)}
BULL AGENT CASE:
${bullCase}

BEAR AGENT CASE:
${bearCase}

SECURITY AGENT CASE:
${securityCase}

Respond in exactly this format:
VERDICT: [Favorable / Cautious / Avoid]
CONFIDENCE: [Low / Medium / High]
REASONING: 1-2 sentences explaining which argument(s) were most decisive — including
whether news/sentiment changed the picture — and why.
This is analysis, not financial advice.
  `.trim();
}