import { fetchWalletHoldings } from "~/lib/api/moralis";
import { fetchApprovalSecurity } from "~/lib/api/goplus";
import { fetchTokenByAddress } from "~/lib/api/dexscreener";
import { fetchTokenSecurity } from "~/lib/api/goplus";
import { computeRiskScore, scoreToLabel } from "~/lib/utils";
import type { Chain } from "~/types/tokens";

const EVM_CHAINS: Chain[] = ["ethereum", "bsc", "base", "arbitrum"];
const DEEP_SCAN_LIMIT = 8; // top N holdings by USD value get full risk scoring

export async function action({ request }: { request: Request }) {
  const { walletAddress } = (await request.json()) as {
    walletAddress: string;
  };

  if (!walletAddress) {
    return new Response("Missing walletAddress", { status: 400 });
  }

  try {
    const { tokens, skippedChains } = await fetchWalletHoldings(
      walletAddress,
      EVM_CHAINS
    );

    const sorted = tokens.sort((a, b) => b.usdValue - a.usdValue);
    const topHoldings = sorted.slice(0, DEEP_SCAN_LIMIT);
    const remaining = sorted.slice(DEEP_SCAN_LIMIT);

    // deep risk-scan top holdings only (keeps API calls bounded)
    const scanned = await Promise.allSettled(
      topHoldings.map(async (t) => {
        const [dex, security] = await Promise.all([
          fetchTokenByAddress(t.tokenAddress, t.chain),
          fetchTokenSecurity(t.tokenAddress, t.chain),
        ]);

        const liquidityRatio =
          dex.marketCap > 0 ? dex.liquidity / dex.marketCap : 0;

        const partial = {
          ageInDays: dex.ageInDays,
          liquidity: dex.liquidity,
          liquidityRatio,
          topHolderPct: security.topHolderPct,
          verified: security.verified,
          ownershipRenounced: security.ownershipRenounced,
          honeypotFlag: security.honeypotFlag,
          sellTax: security.sellTax,
        };

        const riskScore = computeRiskScore(partial as any);

        return {
          ...t,
          priceChange24h: dex.priceChange24h,
          riskScore,
          riskLabel: scoreToLabel(riskScore),
          honeypotFlag: security.honeypotFlag,
        };
      })
    );

    const deepScanned = scanned
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    // approval security across supported chains
    const approvalResults = await Promise.all(
      EVM_CHAINS.filter((c) => !skippedChains.includes(c)).map((c) =>
        fetchApprovalSecurity(walletAddress, c)
      )
    );
    const approvalRisks = approvalResults.flat();

    const totalValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);

    return new Response(
      JSON.stringify({
        totalValue,
        deepScanned,
        remaining, // basic balance data only, not risk-scored
        skippedChains,
        approvalRisks,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Wallet scan error:", err);
    return new Response(err.message ?? "Wallet scan failed", { status: 500 });
  }
}