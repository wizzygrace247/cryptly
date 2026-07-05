import Groq from "groq-sdk";
import type { PortfolioResult } from "./api.portfolio";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function action({ request }: { request: Request }) {
  try {
    const { portfolio } = (await request.json()) as {
      portfolio: PortfolioResult;
    };

    const { tokens, scores, insights } = portfolio;

    const tokenSummary = tokens
      .map(
        (t) =>
          `- ${t.name} (${t.symbol}): Risk ${t.riskScore}/100, ` +
          `MCap $${(t.marketCap / 1_000_000).toFixed(2)}M, ` +
          `Age ${t.ageInDays}d, ` +
          `Honeypot: ${t.honeypotFlag}, ` +
          `Verified: ${t.verified}, ` +
          `Pattern: ${t.timeframe?.label}`
      )
      .join("\n");

    const prompt = `
Analyze this crypto portfolio and give a clear assessment in 4 bullet points.

PORTFOLIO SUMMARY:
- Total tokens: ${tokens.length}
- Average risk score: ${scores.average}/100
- Market-cap weighted score: ${scores.weightedByMarketCap}/100
- Worst-case score: ${scores.worstCase}/100
- High risk tokens (>55): ${insights.highRiskCount}
- Honeypots detected: ${insights.honeypotCount}
- New tokens (<14 days old): ${insights.newTokenCount}
- Unverified contracts: ${insights.unverifiedCount}
- Most risky token: ${insights.mostRiskyToken}

INDIVIDUAL TOKENS:
${tokenSummary}

Give 4 bullet points:
1. Overall portfolio risk assessment referencing the scores
2. Biggest concentration or diversification issue
3. The single most dangerous token and why
4. One concrete suggestion to reduce portfolio risk

End with one line summarizing the portfolio in plain language.
Frame everything as analysis, not financial advice.
    `.trim();

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Cryptly, an AI crypto risk analysis agent specializing in portfolio-level risk assessment. Be direct, specific, and reference exact numbers.",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 600,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Portfolio analyze error:", err);
    return new Response(err?.message ?? "Analysis failed", { status: 500 });
  }
}