import { fetchTokenByAddress } from "~/lib/api/dexscreener";
import { fetchTokenSecurity } from "~/lib/api/goplus";
import { computeRiskScore, scoreToLabel, classifyTimeframe } from "~/lib/utils";
import type { Chain, TokenMetrics } from "~/types/tokens";

export interface PortfolioEntry {
  address: string;
  chain: Chain;
}

export interface PortfolioResult {
  tokens: TokenMetrics[];
  failed: { address: string; reason: string }[];
  scores: {
    average: number;
    weightedByMarketCap: number;
    worstCase: number;
  };
  dominantRisk: string;
  insights: {
    highRiskCount: number;
    honeypotCount: number;
    newTokenCount: number;
    unverifiedCount: number;
    mostRiskyToken: string;
  };
}

export async function action({ request }: { request: Request }) {
  const { entries } = (await request.json()) as {
    entries: PortfolioEntry[];
  };

  if (!entries || entries.length === 0) {
    return new Response("No tokens provided", { status: 400 });
  }

  if (entries.length > 10) {
    return new Response("Maximum 10 tokens per portfolio analysis", {
      status: 400,
    });
  }

  const tokens: TokenMetrics[] = [];
  const failed: { address: string; reason: string }[] = [];

  // analyze all tokens in parallel
  await Promise.allSettled(
    entries.map(async ({ address, chain }) => {
      try {
        const [dex, security] = await Promise.all([
          fetchTokenByAddress(address, chain),
          fetchTokenSecurity(address, chain),
        ]);

        const liquidityRatio =
          dex.marketCap > 0 ? dex.liquidity / dex.marketCap : 0;

        const partial = {
          name: dex.name,
          symbol: dex.symbol,
          address: dex.address,
          pairAddress: dex.pairAddress,
          chain,
          price: dex.price,
          priceChange24h: dex.priceChange24h,
          marketCap: dex.marketCap,
          volume24h: dex.volume24h,
          liquidity: dex.liquidity,
          ageInDays: dex.ageInDays,
          logoUrl: dex.logoUrl,
          topHolderPct: security.topHolderPct,
          verified: security.verified,
          ownershipRenounced: security.ownershipRenounced,
          honeypotFlag: security.honeypotFlag,
          buyTax: security.buyTax,
          sellTax: security.sellTax,
          liquidityRatio,
        };

        const riskScore = computeRiskScore(partial);
        const riskLabel = scoreToLabel(riskScore);
        const timeframe = classifyTimeframe({
          ageInDays: partial.ageInDays,
          volume24h: partial.volume24h,
          marketCap: partial.marketCap,
          liquidity: partial.liquidity,
          priceChange24h: partial.priceChange24h,
          topHolderPct: partial.topHolderPct,
          riskScore,
        });

        tokens.push({ ...partial, riskScore, riskLabel, timeframe });
      } catch (err: any) {
        failed.push({
          address,
          reason: err.message ?? "Failed to fetch",
        });
      }
    })
  );

  if (tokens.length === 0) {
    return new Response("All token fetches failed", { status: 500 });
  }

  // compute three scoring methods
  const average = Math.round(
    tokens.reduce((sum, t) => sum + t.riskScore, 0) / tokens.length
  );

  const totalMcap = tokens.reduce((sum, t) => sum + t.marketCap, 0);
  const weightedByMarketCap =
    totalMcap > 0
      ? Math.round(
        tokens.reduce(
          (sum, t) => sum + t.riskScore * (t.marketCap / totalMcap),
          0
        )
      )
      : average;

  const worstCase = Math.max(...tokens.map((t) => t.riskScore));

  // insights
  const highRiskCount = tokens.filter((t) => t.riskScore > 55).length;
  const honeypotCount = tokens.filter((t) => t.honeypotFlag).length;
  const newTokenCount = tokens.filter((t) => t.ageInDays < 14).length;
  const unverifiedCount = tokens.filter((t) => !t.verified).length;
  const mostRiskyToken = tokens.sort((a, b) => b.riskScore - a.riskScore)[0]
    .symbol;

  const dominantRisk =
    worstCase >= 75
      ? "Extreme Risk"
      : worstCase >= 55
        ? "High Risk"
        : average >= 40
          ? "Medium Risk"
          : "Low Risk";

  const result: PortfolioResult = {
    tokens,
    failed,
    scores: { average, weightedByMarketCap, worstCase },
    dominantRisk,
    insights: {
      highRiskCount,
      honeypotCount,
      newTokenCount,
      unverifiedCount,
      mostRiskyToken,
    },
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
