import { useState, useRef } from "react";
import { GitCompare, BarChart3, Search } from "lucide-react";
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
import PortfolioTracker from "~/components/PortfolioTracker";
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

type Tab = "analyze" | "portfolio";

export default function Home() {
  const [tab, setTab] = useState<Tab>("analyze");
  const [token, setToken] = useState<TokenMetrics | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const analysisRef = useRef<AnalysisReportHandle | null>(null);

  useWatchlistAgent();

  const handleResult = (t: TokenMetrics) => {
    setToken(t);
    setCompareOpen(false);
    setTimeout(() => analysisRef.current?.run(), 300);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* navbar */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-30"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-card)",
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm"
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

        {tab === "analyze" && <TokenSearch onResult={handleResult} />}

        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="flex items-center rounded-md border p-0.5"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-primary)",
            }}
          >
            <button
              onClick={() => setTab("analyze")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors"
              style={{
                background: tab === "analyze" ? "var(--accent)" : "transparent",
                color: tab === "analyze" ? "#0A0B0A" : "var(--text-muted)",
              }}
            >
              <Search className="w-3.5 h-3.5" />
              Analyze
            </button>
            <button
              onClick={() => setTab("portfolio")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors"
              style={{
                background: tab === "portfolio" ? "var(--accent)" : "transparent",
                color: tab === "portfolio" ? "#0A0B0A" : "var(--text-muted)",
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Portfolio
            </button>
          </div>

          {tab === "analyze" && token && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium"
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
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "var(--accent)", color: "#0A0B0A" }}
          >
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* main content — flex-1 pushes footer down, no overlap possible */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* ── ANALYZE TAB ── */}
        {tab === "analyze" && (
          <>
            {token ? (
              <div className="space-y-6">
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
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      token.symbol.charAt(0)
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {token.name}{" "}
                      <span style={{ color: "var(--text-muted)" }}>({token.symbol})</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xl font-semibold font-data">
                        {fmtPrice(token.price)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-sm font-semibold font-data"
                        style={{
                          background:
                            token.priceChange24h >= 0 ? "var(--green-glow)" : "var(--red-glow)",
                          color: token.priceChange24h >= 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {token.priceChange24h >= 0 ? "+" : ""}
                        {token.priceChange24h.toFixed(1)}%
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                      >
                        {token.chain}
                      </span>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded border"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* instant risk flags */}
                <RiskFlags token={token} />

                {/* main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* left column — gauge, timeframe, watchlist all stacked with consistent spacing */}
                  <div className="space-y-6">
                    <RiskGauge score={token.riskScore} label={token.riskLabel} />
                    {token.timeframe && <TimeframeCard timeframe={token.timeframe} />}
                    <Watchlist currentToken={token} />
                  </div>

                  {/* right column */}
                  <div className="lg:col-span-2 space-y-4">
                    <PriceChart token={token} />
                    <MetricsGrid token={token} />
                    <AnalysisReport token={token} ref={analysisRef} />
                  </div>
                </div>
              </div>
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
                  <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Analyze any token
                  </h2>
                  <p className="text-base" style={{ color: "var(--text-muted)" }}>
                    Enter a contract address or coin ID above to get an AI-powered risk analysis
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {[
                    "🔍 Real-time data",
                    "🛡️ Honeypot detection",
                    "📊 Risk scoring",
                    "🤖 AI insights",
                    "👁️ Watchlist agent",
                    "⚖️ Token compare",
                    "📈 Price history",
                    "💼 Portfolio tracker",
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
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Supported chains:
                  </span>
                  {["Ethereum", "Solana", "BSC", "Base", "Arbitrum", "X Layer"].map((c) => (
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
                <div
                  className="mt-2 px-6 py-3 rounded-xl border text-sm text-center max-w-md"
                  style={{
                    borderColor: "var(--accent)",
                    background: "var(--accent-glow)",
                    color: "var(--text-primary)",
                  }}
                >
                  ✨ Now supporting{" "}
                  <span className="font-semibold" style={{ color: "var(--accent)" }}>
                    X Layer
                  </span>{" "}
                  — OKX's EVM Layer 2
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {tab === "portfolio" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <h1 className="text-2xl font-bold">Portfolio Analyzer</h1>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                >
                  Up to 10 tokens
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Analyze your entire portfolio at once — get individual risk scores, aggregate
                metrics, and an AI portfolio assessment.
              </p>
            </div>
            <PortfolioTracker />
          </div>
        )}
      </main>

      {/* compare modal */}
      {compareOpen && token && (
        <CompareMode tokenA={token} onClose={() => setCompareOpen(false)} />
      )}

      {/* footer — sits naturally below flex-1 main, never overlaps */}
      <footer
        className="border-t py-6 text-center text-xs px-6"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Cryptly — AI crypto risk analysis agent. Not financial advice. Data from DexScreener,
        GoPlus Security & GeckoTerminal.
      </footer>
    </div>
  );
}