import { fetchHistoricalPrices } from "~/lib/api/geckoterminal";
import type { Chain } from "~/types/tokens";

export async function action({ request }: { request: Request }) {
  const { poolAddress, chain, days } = (await request.json()) as {
    poolAddress: string;
    chain: Chain;
    days?: 1 | 7 | 30;
  };

  if (!poolAddress || !chain) {
    return new Response("Missing poolAddress or chain", { status: 400 });
  }

  try {
    const prices = await fetchHistoricalPrices(poolAddress, chain, days ?? 7);
    return new Response(JSON.stringify({ prices }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(err.message ?? "Failed to fetch history", {
      status: 500,
    });
  }
}