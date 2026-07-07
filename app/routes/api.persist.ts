import { supabase } from "~/lib/db/supabase";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { op, walletAddress } = body;

  if (!walletAddress) {
    return new Response("Missing walletAddress", { status: 400 });
  }

  const wallet = walletAddress.toLowerCase();

  if (op === "get_watchlist") {
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("wallet_address", wallet);
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ watchlist: data });
  }

  if (op === "add_watchlist") {
    const { entry } = body;
    const { error } = await supabase.from("watchlist").upsert({
      wallet_address: wallet,
      token_address: entry.address,
      chain: entry.chain,
      symbol: entry.symbol,
      name: entry.name,
      last_score: entry.lastScore,
    });
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
  }

  if (op === "remove_watchlist") {
    const { tokenAddress, chain } = body;
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .match({ wallet_address: wallet, token_address: tokenAddress, chain });
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
  }

  if (op === "save_portfolio") {
    const { data: portfolioData } = body;
    const { error } = await supabase.from("portfolio_snapshots").upsert({
      wallet_address: wallet,
      data: portfolioData,
      updated_at: new Date().toISOString(),
    });
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
  }

  if (op === "get_portfolio") {
    const { data, error } = await supabase
      .from("portfolio_snapshots")
      .select("*")
      .eq("wallet_address", wallet)
      .single();
    if (error) return Response.json({ data: null });
    return Response.json({ data: data?.data ?? null });
  }

  if (op === "get_alerts") {
    const { data, error } = await supabase
      .from("agent_alerts")
      .select("*")
      .eq("wallet_address", wallet)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ alerts: data ?? [] });
  }

  return new Response("Unknown operation", { status: 400 });
}