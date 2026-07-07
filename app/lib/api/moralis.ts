import type { Chain } from "~/types/tokens";

const MORALIS_CHAIN_MAP: Partial<Record<Chain, string>> = {
  ethereum: "eth",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  // xlayer intentionally omitted — not yet supported by Moralis
};

export interface WalletToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  chain: Chain;
  balance: number;
  usdValue: number;
  usdPrice: number;
  logoUrl?: string;
}

export async function fetchWalletHoldings(
  walletAddress: string,
  chains: Chain[]
): Promise<{ tokens: WalletToken[]; skippedChains: Chain[] }> {
  const tokens: WalletToken[] = [];
  const skippedChains: Chain[] = [];

  await Promise.all(
    chains.map(async (chain) => {
      const moralisChain = MORALIS_CHAIN_MAP[chain];
      if (!moralisChain) {
        skippedChains.push(chain);
        return;
      }

      try {
        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/tokens?chain=${moralisChain}&exclude_spam=true`;
        const res = await fetch(url, {
          headers: {
            "X-API-Key": process.env.MORALIS_API_KEY!,
            Accept: "application/json",
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        const result = data.result ?? [];

        for (const t of result) {
          const balance = parseFloat(t.balance_formatted ?? "0");
          if (balance <= 0) continue;

          tokens.push({
            tokenAddress: t.token_address,
            symbol: t.symbol ?? "?",
            name: t.name ?? "Unknown",
            chain,
            balance,
            usdValue: parseFloat(t.usd_value ?? "0"),
            usdPrice: parseFloat(t.usd_price ?? "0"),
            logoUrl: t.logo,
          });
        }
      } catch (err) {
        console.warn(`Moralis fetch failed for ${chain}:`, err);
      }
    })
  );

  return { tokens, skippedChains };
}