import { fetchTokenByAddress } from "~/lib/api/dexscreener";
import { fetchTokenSecurity } from "~/lib/api/goplus";
import { computeRiskScore, scoreToLabel, classifyTimeframe } from "~/lib/utils";
import type { Chain } from "~/types/tokens";  // ← fixed: "token" not "tokens"



export async function action({ request }: { request: Request }) {
    const { address, chain } = (await request.json()) as {
        address: string;
        chain: Chain;
    };

    if (!address || !chain) {
        return new Response("Missing address or chain", { status: 400 });
    }

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

        return new Response(JSON.stringify({ ...partial, riskScore, riskLabel, timeframe }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(err.message ?? "Failed to fetch token", { status: 500 });
    }


}

