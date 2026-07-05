import type { Chain } from "~/types/tokens";

// GeckoTerminal network IDs differ slightly from DexScreener's
const NETWORK_MAP: Record<Chain, string> = {
  ethereum: "eth",
  solana: "solana",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  xlayer: "xlayer",
};

export interface PricePoint {
  timestamp: number; // unix seconds
  price: number;
}

export async function fetchHistoricalPrices(
  poolAddress: string,
  chain: Chain,
  days: 1 | 7 | 30 = 7
): Promise<PricePoint[]> {
  const network = NETWORK_MAP[chain];
  // day timeframe for 30d view, hour for 7d/1d for finer resolution
  const timeframe = days <= 1 ? "minute" : days <= 7 ? "hour" : "day";
  const aggregate = days <= 1 ? 15 : days <= 7 ? 4 : 1;
  const limit = days <= 1 ? 96 : days <= 7 ? 42 : 30;

  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`GeckoTerminal error: ${res.status}`);

    const data = await res.json();
    const list: number[][] = data?.data?.attributes?.ohlcv_list ?? [];

    // ohlcv_list format: [timestamp, open, high, low, close, volume]
    return list
      .map(([timestamp, , , , close]) => ({
        timestamp,
        price: close,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.warn("GeckoTerminal fetch failed:", err);
    return [];
  }
}