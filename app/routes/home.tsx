import { useState, useRef } from "react";
import { Menu } from "lucide-react";
import TokenSearch from "~/components/TokenSearch";
import RiskGauge from "~/components/RiskGauge";
import MetricsGrid from "~/components/MetricsGrid";
import AnalysisReport, {
  type AnalysisReportHandle,
} from "~/components/AnalysisReport";
import RiskFlags from "~/components/RiskFlags";
import TimeframeCard from "~/components/TimeframeCard";
import PriceChart from "~/components/PriceChart";
import CompareMode from "~/components/CompareMode";
import PortfolioTracker from "~/components/PortfolioTracker";
import SidePanel from "~/components/SidePanel";
import { fmtPrice } from "~/lib/utils";
import { useWatchlistAgent } from "~/lib/agent/scheduler";
import { useWatchlistStore } from "~/store/watchlistStore";
import { useWallet } from "~/lib/wallet/useWallet";
import type { TokenMetrics } from "~/types/tokens";
import DebateCouncil from "~/components/DebateCouncil";

export function meta() {
  return [
    { title: "Cryptly — Crypto Risk Analysis Agent" },
    {
      name: "description",
      content: "AI-powered crypto risk analysis for any token",
    },
  ];
}

type View = "analyze" | "portfolio";

export default function Home() {
  const [view, setView] = useState<View>("analyze");
  const [token, setToken] = useState<TokenMetrics | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const analysisRef = useRef<AnalysisReportHandle | null>(null);

  useWatchlistAgent();
  const { alerts } = useWatchlistStore();
  const { address } = useWallet();

  const handleResult = (t: TokenMetrics) => {
    setToken(t);
    setCompareOpen(false);
    setTimeout(() => analysisRef.current?.run(), 300);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* minimal navbar */}
      <nav
        className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b sticky top-0 z-30"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-card)",
        }}
      >
        <button
          onClick={() => setView("analyze")}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#0A0B0A" }}
          >
            C
          </div>
          <span
            className="hidden sm:inline font-bold text-lg tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Cryptly
          </span>
        </button>

        {view === "analyze" && (
          <div className="flex-1 min-w-0">
            <TokenSearch onResult={handleResult} />
          </div>
        )}
        {view === "portfolio" && <div className="flex-1" />}

        {/* wallet status indicator + panel trigger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {address && (
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border"
              style={{
                borderColor: "var(--green)",
                color: "var(--green)",
                background: "var(--green-glow)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--green)" }}
              />
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}

          <button
            onClick={() => setPanelOpen(true)}
            className="relative p-2 rounded-md border"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-primary)",
            }}
          >
            <Menu
              className="w-5 h-5"
              style={{ color: "var(--text-primary)" }}
            />
            {alerts.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: "var(--red)", color: "white" }}
              >
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {view === "analyze" && (
          <>
            {token ? (
              <div className="space-y-6">
                {/* token header */}
                <div className="flex items-center gap-4 flex-wrap">
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
                          (e.target as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      token.symbol.charAt(0)
                    )}
                  </div>
                  <div>
                    <h1
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {token.name}{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({token.symbol})
                      </span>
                    </h1>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-lg sm:text-xl font-semibold font-data">
                        {fmtPrice(token.price)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-sm font-semibold font-data"
                        style={{
                          background:
                            token.priceChange24h >= 0
                              ? "var(--green-glow)"
                              : "var(--red-glow)",
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
                    </div>
                  </div>
                </div>

                <RiskFlags token={token} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="space-y-6">
                    <RiskGauge
                      score={token.riskScore}
                      label={token.riskLabel}
                    />
                    {token.timeframe && (
                      <TimeframeCard timeframe={token.timeframe} />
                    )}
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <PriceChart token={token} />
                    <MetricsGrid token={token} />
                    <AnalysisReport token={token} ref={analysisRef} />
                    <DebateCouncil token={token} />
                  </div>
                </div>
              </div>
            ) : (
              /* empty state */
              <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-5 text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-3xl"
                  style={{ background: "var(--accent)", color: "#0A0B0A" }}
                >
                  C
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Analyze any token
                </h2>
                <p
                  className="text-base max-w-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Enter a contract address or coin ID above to get an
                  AI-powered risk analysis
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
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
                        borderColor:
                          c === "X Layer"
                            ? "var(--accent)"
                            : "var(--border)",
                        color:
                          c === "X Layer"
                            ? "var(--accent)"
                            : "var(--text-muted)",
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
                  Also supported by OKX Xlayer
                </div>
              </div>
            )}
          </>
        )}

        {view === "portfolio" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Portfolio Analyzer</h1>
            <PortfolioTracker />
          </div>
        )}
      </main>

      {compareOpen && token && (
        <CompareMode
          tokenA={token}
          onClose={() => setCompareOpen(false)}
        />
      )}

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        token={token}
        onOpenPortfolio={() => setView("portfolio")}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <footer
        className="border-t py-6 text-center text-xs px-6"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Cryptly — AI crypto risk analysis agent. Not financial advice.
      </footer>
    </div>
  );
}