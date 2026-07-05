import type { Chain } from "~/types/tokens";

// map our chain names to DexScreener's chain IDs
const CHAIN_MAP: Record<Chain, string> = {
    ethereum: "ethereum",
    solana: "solana",
    bsc: "bsc",
    base: "base",
    arbitrum: "arbitrum",
     xlayer: "xlayer",
};

export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    pairAddress: string;
    baseToken: { address: string; name: string; symbol: string };
    quoteToken: { address: string; name: string; symbol: string };
    priceUsd: string;
    priceChange: { h24: number; h6: number; h1: number; m5: number };
    volume: { h24: number; h6: number };
    liquidity: { usd: number };
    marketCap: number;
    fdv: number;
    pairCreatedAt: number; // unix ms
    info?: { imageUrl?: string };
}

export interface DexScreenerResult {
    name: string;
    symbol: string;
    address: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    ageInDays: number;
    logoUrl?: string;
    pairAddress: string;
}

export async function fetchTokenByAddress(
    address: string,
    chain: Chain
): Promise<DexScreenerResult> {
    const chainId = CHAIN_MAP[chain];
    const url = `https://api.dexscreener.com/tokens/v1/${chainId}/${address}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`DexScreener error: ${res.status}`);

    const data = await res.json();
    const pairs: DexScreenerPair[] = data.pairs ?? data;

    if (!pairs || pairs.length === 0) {
        throw new Error("Token not found on DexScreener. Check the address and chain.");
    }

    // pick the pair with highest liquidity
    const pair = pairs.sort(
        (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];

    const ageMs = pair.pairCreatedAt
        ? Date.now() - pair.pairCreatedAt
        : 0;
    const ageInDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    return {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        address: pair.baseToken.address,
        price: parseFloat(pair.priceUsd ?? "0"),
        priceChange24h: pair.priceChange?.h24 ?? 0,
        volume24h: pair.volume?.h24 ?? 0,
        liquidity: pair.liquidity?.usd ?? 0,
        marketCap: pair.marketCap ?? pair.fdv ?? 0,
        ageInDays: Math.max(ageInDays, 0),
        logoUrl: pair.info?.imageUrl,
        pairAddress: pair.pairAddress,
    };
}

// search by name/symbol — for alternatives feature
export async function searchTokens(query: string): Promise<DexScreenerPair[]> {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.pairs ?? [];
}