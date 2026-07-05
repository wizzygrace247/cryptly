import { useState, useRef } from "react";
import { GitCompare } from "lucide-react";
import TokenSearch from "~/components/TokenSearch";
import RiskGauge from "~/components/RiskGauge";
import MetricsGrid from "~/components/MetricsGrid";
import AnalysisReport, {
  type AnalysisReportHandle,
} from "~/components/AnalysisReport";
import Watchlist from "~/components/Watchlist";
import AlertFeed from "~/components/AlertFeed";
import RiskFlags from "~/components/RiskFlags";
import TimeframeCard from "~/components/TimeframeCard";
import PriceChart from "~/components/PriceChart";
import CompareMode from "~/components/CompareMode";
import { fmtPrice } from "~/lib/utils";
import { useWatchlistAgent } from "~/lib/agent/scheduler";
import type { TokenMetrics } from "~/types/tokens";

export function meta() {
  return [
    { title: "Cryptly — Crypto Risk Analysis Agent" },
    {
      name: "description",
      content: "AI-powered crypto risk analysis for any token",
    },
  ];
}

export default function Home() {
  const [token, setToken] = useState<TokenMetrics | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const analysisRef = useRef<AnalysisReportHandle | null>(null);

  // starts the always-on watchlist polling agent
  useWatchlistAgent();

  const handleResult = (t: TokenMetrics) => {
    setToken(t);
    setCompareOpen(false);
    // auto-trigger AI analysis 300ms after token loads
    setTimeout(() => analysisRef.current?.run(), 300);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* navbar */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-30"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-card)",
        }}
      >
        {/* logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--accent)" }}
          >
            C
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Cryptly
          </span>
        </div>

        {/* search */}
        <TokenSearch onResult={handleResult} />

        {/* right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {token && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          )}
          <AlertFeed />
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {token ? (
          <>
            {/* token header */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden"
                style={{ background: "var(--accent)" }}
              >
                {token.logoUrl ? (
                  <img
                    src={token.logoUrl}
                    alt={token.symbol}
                    className="w-14 h-14 object-cover"
                    onError={(e) => {
                      // fallback to initial if image fails
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  token.symbol.charAt(0)
                )}
              </div>

              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {token.name}{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    ({token.symbol})
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xl font-semibold">
                    {fmtPrice(token.price)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-sm font-semibold"
                    style={{
                      background:
                        token.priceChange24h >= 0
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                      color:
                        token.priceChange24h >= 0
                          ? "var(--green)"
                          : "var(--red)",
                    }}
                  >
                    {token.priceChange24h >= 0 ? "+" : ""}
                    {token.priceChange24h.toFixed(1)}%
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded capitalize"
                    style={{
                      background: "var(--accent-glow)",
                      color: "var(--accent)",
                    }}
                  >
                    {token.chain}
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* instant risk flags */}
            <RiskFlags token={token} />

            {/* main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* left column — gauge + timeframe */}
              <div className="space-y-6">
                <RiskGauge
                  score={token.riskScore}
                  label={token.riskLabel}
                />
                {token.timeframe && (
                  <TimeframeCard timeframe={token.timeframe} />
                )}
              </div>

              {/* right column — chart, metrics, AI */}
              <div className="lg:col-span-2 space-y-4">
                <PriceChart token={token} />
                <MetricsGrid token={token} />
                <AnalysisReport token={token} ref={analysisRef} />
              </div>
            </div>

            {/* watchlist */}
            <Watchlist currentToken={token} />
          </>
        ) : (
          /* empty state */
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl"
              style={{ background: "var(--accent)" }}
            >
              C
            </div>
            <div className="text-center space-y-2">
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Analyze any token
              </h2>
              <p
                className="text-base"
                style={{ color: "var(--text-muted)" }}
              >
                Enter a contract address or coin ID above to get an
                AI-powered risk analysis
              </p>
            </div>

            {/* feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {[
                "🔍 Real-time data",
                " Honeypot detection",
                " Risk scoring",
                " AI insights",
                " Watchlist agent",
                " Token compare",
                " Price history",
              ].map((f) => (
                <span
                  key={f}
                  className="text-sm px-4 py-2 rounded-full border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                    background: "var(--bg-card)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* supported chains */}
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Supported chains:
              </span>
              {[
                "Ethereum",
                "Solana",
                "BSC",
                "Base",
                "Arbitrum",
                "X Layer",
              ].map((c) => (
                <span
                  key={c}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{
                    borderColor: c === "X Layer" ? "var(--accent)" : "var(--border)",
                    color: c === "X Layer" ? "var(--accent)" : "var(--text-muted)",
                    background: c === "X Layer" ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* X Layer callout */}
            <div
              className="mt-2 px-6 py-3 rounded-xl border text-sm text-center max-w-md"
              style={{
                borderColor: "var(--accent)",
                background: "var(--accent-glow)",
                color: "var(--text-primary)",
              }}
            >
              Now supporting{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--accent)" }}
              >
                X Layer
              </span>{" "}
               OKX's EVM Layer 2 with sub-cent fees and 1-second blocks
            </div>
          </div>
        )}
      </main>

      {/* compare modal */}
      {compareOpen && token && (
        <CompareMode
          tokenA={token}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {/* footer */}
      <footer
        className="border-t mt-12 py-6 text-center text-xs"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Cryptly — AI crypto risk analysis agent. Not financial advice. Data
        from DexScreener, GoPlus Security & GeckoTerminal.
      </footer>
    </div>
  );
}