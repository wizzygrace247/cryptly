import { useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import type { Chain, TokenMetrics } from "~/types/tokens";
import type { PortfolioResult } from "~/routes/api.portfolio";
import { fmt, fmtPrice, scoreToColor, scoreToLabel } from "~/lib/utils";

const CHAINS: { value: Chain; label: string }[] = [
  { value: "ethereum", label: "ETH" },
  { value: "solana", label: "SOL" },
  { value: "bsc", label: "BSC" },
  { value: "base", label: "Base" },
  { value: "arbitrum", label: "ARB" },
  { value: "xlayer", label: "X Layer" },
];

interface TokenEntry {
  id: string;
  address: string;
  chain: Chain;
}

function ScoreRing({
  score,
  label,
  size = 80,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const color = scoreToColor(score);
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e2340"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="text-center -mt-14"
        style={{ color }}
      >
        <p className="text-xl font-bold">{score}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          /100
        </p>
      </div>
      <p
        className="text-xs font-medium mt-10 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}

export default function PortfolioTracker() {
  const [entries, setEntries] = useState<TokenEntry[]>([
    { id: "1", address: "", chain: "ethereum" },
  ]);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const addRow = () => {
    if (entries.length >= 10) return;
    setEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), address: "", chain: "ethereum" },
    ]);
  };

  const removeRow = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const updateRow = (
    id: string,
    field: "address" | "chain",
    value: string
  ) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );

  const analyze = async () => {
    const valid = entries.filter((e) => e.address.trim());
    if (valid.length === 0) {
      setError("Add at least one token address");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setInsight("");

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: valid.map((e) => ({
            address: e.address.trim(),
            chain: e.chain,
          })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data: PortfolioResult = await res.json();
      setResult(data);
      runPortfolioInsight(data);
    } catch (e: any) {
      setError(e.message ?? "Portfolio analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const runPortfolioInsight = async (portfolio: PortfolioResult) => {
    setInsight("");
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/portfolio-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setInsight((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setInsight("Portfolio AI analysis failed.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* input panel */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Portfolio Analyzer</h2>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Add up to 10 token addresses across any chain
            </p>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent)",
            }}
          >
            {entries.length}/10
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {/* column headers */}
          <div
            className="grid gap-2 text-xs px-1"
            style={{
              gridTemplateColumns: "120px 1fr 36px",
              color: "var(--text-muted)",
            }}
          >
            <span>Chain</span>
            <span>Contract Address</span>
            <span />
          </div>

          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="grid gap-2 items-center"
              style={{ gridTemplateColumns: "120px 1fr 36px" }}
            >
              {/* chain select */}
              <select
                value={entry.chain}
                onChange={(e) =>
                  updateRow(entry.id, "chain", e.target.value)
                }
                className="px-2 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                {CHAINS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* address input */}
              <input
                value={entry.address}
                onChange={(e) =>
                  updateRow(entry.id, "address", e.target.value)
                }
                placeholder={`Token ${i + 1} contract address...`}
                className="px-3 py-2 rounded-lg border text-sm outline-none w-full"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />

              {/* remove */}
              <button
                onClick={() => removeRow(entry.id)}
                disabled={entries.length === 1}
                className="flex items-center justify-center w-9 h-9 rounded-lg border disabled:opacity-30"
                style={{ borderColor: "var(--border)" }}
              >
                <Trash2
                  className="w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addRow}
            disabled={entries.length >= 10}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Token
          </button>

          <button
            onClick={analyze}
            disabled={
              loading || !entries.some((e) => e.address.trim())
            }
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing {entries.filter((e) => e.address.trim()).length}{" "}
                tokens...
              </>
            ) : (
              "Analyze Portfolio"
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs mt-3" style={{ color: "var(--red)" }}>
            {error}
          </p>
        )}
      </div>

      {/* results */}
      {result && (
        <>
          {/* failed tokens */}
          {result.failed.length > 0 && (
            <div
              className="rounded-xl p-4 border flex items-start gap-3"
              style={{
                borderColor: "rgba(249,115,22,0.4)",
                background: "rgba(249,115,22,0.08)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--orange)" }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--orange)" }}
                >
                  {result.failed.length} token
                  {result.failed.length > 1 ? "s" : ""} failed to load
                </p>
                {result.failed.map((f) => (
                  <p
                    key={f.address}
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {f.address.slice(0, 10)}... — {f.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* three score cards */}
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-semibold text-sm mb-6">
              Portfolio Risk Score
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-3">
                <ScoreRing
                  score={result.scores.average}
                  label="Average"
                  size={96}
                />
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Simple average across all tokens
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <ScoreRing
                  score={result.scores.weightedByMarketCap}
                  label="MCap Weighted"
                  size={96}
                />
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Weighted by each token's market cap
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <ScoreRing
                  score={result.scores.worstCase}
                  label="Worst Case"
                  size={96}
                />
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Highest risk token in your portfolio
                </p>
              </div>
            </div>

            {/* quick stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              {[
                {
                  label: "High Risk Tokens",
                  value: result.insights.highRiskCount,
                  warn: result.insights.highRiskCount > 0,
                },
                {
                  label: "Honeypots",
                  value: result.insights.honeypotCount,
                  warn: result.insights.honeypotCount > 0,
                },
                {
                  label: "New Tokens (<14d)",
                  value: result.insights.newTokenCount,
                  warn: result.insights.newTokenCount > 1,
                },
                {
                  label: "Unverified",
                  value: result.insights.unverifiedCount,
                  warn: result.insights.unverifiedCount > 0,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 border text-center"
                  style={{
                    borderColor: s.warn
                      ? "rgba(239,68,68,0.3)"
                      : "var(--border)",
                    background: s.warn
                      ? "rgba(239,68,68,0.06)"
                      : "var(--bg-primary)",
                  }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: s.warn ? "var(--red)" : "var(--text-primary)",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* individual token cards */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm px-1">Token Breakdown</h3>
            {result.tokens
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((token) => (
                <div
                  key={token.address}
                  className="rounded-xl p-4 border"
                  style={{
                    background: "var(--bg-card)",
                    borderColor:
                      token.riskScore > 75
                        ? "rgba(239,68,68,0.4)"
                        : token.riskScore > 55
                        ? "rgba(249,115,22,0.3)"
                        : "var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* token identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: "var(--accent)" }}
                      >
                        {token.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {token.name}
                          <span
                            className="ml-2 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {token.symbol}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs capitalize px-1.5 py-0.5 rounded"
                            style={{
                              background: "var(--accent-glow)",
                              color: "var(--accent)",
                            }}
                          >
                            {token.chain}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {fmtPrice(token.price)}
                          </span>
                          <span
                            className="text-xs"
                            style={{
                              color:
                                token.priceChange24h >= 0
                                  ? "var(--green)"
                                  : "var(--red)",
                            }}
                          >
                            {token.priceChange24h >= 0 ? "+" : ""}
                            {token.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* key metrics */}
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          MCap
                        </p>
                        <p className="text-sm font-semibold">
                          {fmt(token.marketCap)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Liquidity
                        </p>
                        <p className="text-sm font-semibold">
                          {fmt(token.liquidity)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Age
                        </p>
                        <p className="text-sm font-semibold">
                          {token.ageInDays}d
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Timeframe
                        </p>
                        <p className="text-sm font-semibold">
                          {token.timeframe?.window ?? "—"}
                        </p>
                      </div>

                      {/* flags */}
                      <div className="flex gap-1.5">
                        {token.honeypotFlag && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "var(--red)",
                            }}
                          >
                            Honeypot
                          </span>
                        )}
                        {!token.verified && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: "rgba(249,115,22,0.15)",
                              color: "var(--orange)",
                            }}
                          >
                            Unverified
                          </span>
                        )}
                        {token.sellTax > 10 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: "rgba(249,115,22,0.15)",
                              color: "var(--orange)",
                            }}
                          >
                            High Tax
                          </span>
                        )}
                      </div>

                      {/* risk score */}
                      <div
                        className="text-right min-w-16"
                      >
                        <p
                          className="text-2xl font-bold"
                          style={{
                            color: scoreToColor(token.riskScore),
                          }}
                        >
                          {token.riskScore}
                          <span
                            className="text-sm font-normal"
                            style={{ color: "var(--text-muted)" }}
                          >
                            /100
                          </span>
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: scoreToColor(token.riskScore),
                          }}
                        >
                          {token.riskLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* AI portfolio insight */}
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: loadingInsight
                    ? "var(--orange)"
                    : insight
                    ? "var(--green)"
                    : "var(--text-muted)",
                  boxShadow: loadingInsight
                    ? "0 0 6px var(--orange)"
                    : insight
                    ? "0 0 6px var(--green)"
                    : "none",
                }}
              />
              <h3 className="font-semibold text-sm">
                AI Portfolio Assessment
              </h3>
              {loadingInsight && (
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  analyzing...
                </span>
              )}
            </div>

            {insight ? (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-primary)" }}
              >
                {insight}
                {loadingInsight && (
                  <span
                    className="animate-pulse"
                    style={{ color: "var(--accent)" }}
                  >
                    ▊
                  </span>
                )}
              </p>
            ) : (
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {loadingInsight
                  ? "Agent is assessing your portfolio..."
                  : "Portfolio AI assessment will appear here after analysis."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}