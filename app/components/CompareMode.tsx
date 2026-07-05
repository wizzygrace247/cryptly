import { useState } from "react";
import { Search, Loader2, X, Trophy, Minus } from "lucide-react";
import type { Chain, TokenMetrics } from "~/types/tokens";
import { fmt, fmtPrice, scoreToColor } from "~/lib/utils";

interface Props {
  tokenA: TokenMetrics;
  onClose: () => void;
}

const CHAINS: { value: Chain; label: string }[] = [
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "bsc", label: "BSC" },
  { value: "base", label: "Base" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "xlayer", label: "X Layer" },
];

function MetricRow({
  label,
  valueA,
  valueB,
  winnerIsA,
  higherIsBetter = false,
}: {
  label: string;
  valueA: string;
  valueB: string;
  winnerIsA: boolean | null; // null = neutral
  higherIsBetter?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-4 py-3 border-b items-center"
      style={{ borderColor: "var(--border)" }}
    >
      <p
        className={`text-sm font-medium text-right ${
          winnerIsA === true ? "font-bold" : ""
        }`}
        style={{
          color:
            winnerIsA === true
              ? "var(--green)"
              : winnerIsA === false
              ? "var(--text-muted)"
              : "var(--text-primary)",
        }}
      >
        {valueA}
        {winnerIsA === true && " ✓"}
      </p>
      <p
        className="text-xs text-center"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className={`text-sm font-medium ${
          winnerIsA === false ? "font-bold" : ""
        }`}
        style={{
          color:
            winnerIsA === false
              ? "var(--green)"
              : winnerIsA === true
              ? "var(--text-muted)"
              : "var(--text-primary)",
        }}
      >
        {winnerIsA === false && "✓ "}
        {valueB}
      </p>
    </div>
  );
}

export default function CompareMode({ tokenA, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<Chain>("ethereum");
  const [tokenB, setTokenB] = useState<TokenMetrics | null>(null);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState("");
  const [verdict, setVerdict] = useState("");
  const [loadingVerdict, setLoadingVerdict] = useState(false);
  const [winner, setWinner] = useState<"A" | "B" | "tie" | null>(null);

  const searchTokenB = async () => {
    if (!query.trim()) return;
    setLoadingB(true);
    setErrorB("");
    setTokenB(null);
    setVerdict("");
    setWinner(null);

    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: query.trim(), chain }),
      });
      if (!res.ok) throw new Error(await res.text());
      const token: TokenMetrics = await res.json();
      setTokenB(token);
      runCompare(token);
    } catch (e: any) {
      setErrorB(e.message ?? "Failed to fetch token");
    } finally {
      setLoadingB(false);
    }
  };

  const runCompare = async (b: TokenMetrics) => {
    setVerdict("");
    setLoadingVerdict(true);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenA, tokenB: b }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setVerdict(fullText);

        // parse winner from streamed text
        const winnerMatch = fullText.match(/WINNER:\s*(.*)/i);
        if (winnerMatch) {
          const w = winnerMatch[1].toLowerCase();
          if (w.includes(tokenA.symbol.toLowerCase())) setWinner("A");
          else if (w.includes(b.symbol.toLowerCase())) setWinner("B");
          else if (w.includes("tie")) setWinner("tie");
        }
      }
    } catch {
      setVerdict("Comparison failed. Please try again.");
    } finally {
      setLoadingVerdict(false);
    }
  };

  const scoreA = tokenA.riskScore;
  const scoreB = tokenB?.riskScore ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-bold text-lg">Compare Tokens</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* token headers */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* token A */}
            <div
              className="rounded-xl p-4 border text-center"
              style={{
                borderColor:
                  winner === "A" ? "var(--green)" : "var(--border)",
                background:
                  winner === "A"
                    ? "rgba(34,197,94,0.08)"
                    : "var(--bg-primary)",
              }}
            >
              {winner === "A" && (
                <div className="flex justify-center mb-2">
                  <Trophy className="w-4 h-4" style={{ color: "var(--green)" }} />
                </div>
              )}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2"
                style={{ background: "var(--accent)" }}
              >
                {tokenA.symbol.charAt(0)}
              </div>
              <p className="font-semibold text-sm">{tokenA.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {tokenA.symbol} · {tokenA.chain}
              </p>
              <p
                className="text-2xl font-bold mt-2"
                style={{ color: scoreToColor(scoreA) }}
              >
                {scoreA}
                <span
                  className="text-sm font-normal"
                  style={{ color: "var(--text-muted)" }}
                >
                  /100
                </span>
              </p>
            </div>

            {/* vs */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                VS
              </div>
              {winner === "tie" && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                  }}
                >
                  Tie
                </span>
              )}
            </div>

            {/* token B */}
            <div
              className="rounded-xl p-4 border text-center"
              style={{
                borderColor:
                  winner === "B" ? "var(--green)" : "var(--border)",
                background:
                  winner === "B"
                    ? "rgba(34,197,94,0.08)"
                    : "var(--bg-primary)",
              }}
            >
              {tokenB ? (
                <>
                  {winner === "B" && (
                    <div className="flex justify-center mb-2">
                      <Trophy
                        className="w-4 h-4"
                        style={{ color: "var(--green)" }}
                      />
                    </div>
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2"
                    style={{ background: "#8b5cf6" }}
                  >
                    {tokenB.symbol.charAt(0)}
                  </div>
                  <p className="font-semibold text-sm">{tokenB.name}</p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tokenB.symbol} · {tokenB.chain}
                  </p>
                  <p
                    className="text-2xl font-bold mt-2"
                    style={{ color: scoreToColor(tokenB.riskScore) }}
                  >
                    {tokenB.riskScore}
                    <span
                      className="text-sm font-normal"
                      style={{ color: "var(--text-muted)" }}
                    >
                      /100
                    </span>
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Search token B
                  </p>
                  <div className="flex gap-1">
                    <select
                      value={chain}
                      onChange={(e) => setChain(e.target.value as Chain)}
                      className="text-xs px-2 py-1.5 rounded-lg border outline-none"
                      style={{
                        background: "var(--bg-card)",
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
                  </div>
                  <div className="relative">
                    <Search
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && searchTokenB()
                      }
                      placeholder="Contract address..."
                      className="w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs outline-none"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <button
                    onClick={searchTokenB}
                    disabled={loadingB || !query.trim()}
                    className="w-full py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                    style={{ background: "var(--accent)" }}
                  >
                    {loadingB ? (
                      <span className="flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Searching...
                      </span>
                    ) : (
                      "Search"
                    )}
                  </button>
                  {errorB && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--red)" }}
                    >
                      {errorB}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* metrics comparison table */}
          {tokenB && (
            <>
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-semibold border-b"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <p className="text-right">{tokenA.symbol}</p>
                  <p className="text-center">Metric</p>
                  <p>{tokenB.symbol}</p>
                </div>
                <div className="px-4">
                  <MetricRow
                    label="Risk Score"
                    valueA={`${tokenA.riskScore}/100`}
                    valueB={`${tokenB.riskScore}/100`}
                    winnerIsA={tokenA.riskScore < tokenB.riskScore}
                  />
                  <MetricRow
                    label="Market Cap"
                    valueA={fmt(tokenA.marketCap)}
                    valueB={fmt(tokenB.marketCap)}
                    winnerIsA={null}
                  />
                  <MetricRow
                    label="Liquidity"
                    valueA={fmt(tokenA.liquidity)}
                    valueB={fmt(tokenB.liquidity)}
                    winnerIsA={tokenA.liquidity > tokenB.liquidity}
                    higherIsBetter
                  />
                  <MetricRow
                    label="24h Volume"
                    valueA={fmt(tokenA.volume24h)}
                    valueB={fmt(tokenB.volume24h)}
                    winnerIsA={null}
                  />
                  <MetricRow
                    label="Token Age"
                    valueA={`${tokenA.ageInDays}d`}
                    valueB={`${tokenB.ageInDays}d`}
                    winnerIsA={tokenA.ageInDays > tokenB.ageInDays}
                  />
                  <MetricRow
                    label="Sell Tax"
                    valueA={`${tokenA.sellTax}%`}
                    valueB={`${tokenB.sellTax}%`}
                    winnerIsA={tokenA.sellTax < tokenB.sellTax}
                  />
                  <MetricRow
                    label="Top 10 Holders"
                    valueA={`${tokenA.topHolderPct}%`}
                    valueB={`${tokenB.topHolderPct}%`}
                    winnerIsA={tokenA.topHolderPct < tokenB.topHolderPct}
                  />
                  <MetricRow
                    label="Verified"
                    valueA={tokenA.verified ? "✓ Yes" : "✗ No"}
                    valueB={tokenB.verified ? "✓ Yes" : "✗ No"}
                    winnerIsA={
                      tokenA.verified === tokenB.verified
                        ? null
                        : tokenA.verified
                    }
                  />
                  <MetricRow
                    label="Honeypot"
                    valueA={tokenA.honeypotFlag ? "⚠ Yes" : "✓ No"}
                    valueB={tokenB.honeypotFlag ? "⚠ Yes" : "✓ No"}
                    winnerIsA={
                      tokenA.honeypotFlag === tokenB.honeypotFlag
                        ? null
                        : !tokenA.honeypotFlag
                    }
                  />
                  <MetricRow
                    label="Timeframe"
                    valueA={tokenA.timeframe?.window ?? "—"}
                    valueB={tokenB.timeframe?.window ?? "—"}
                    winnerIsA={null}
                  />
                </div>
              </div>

              {/* AI verdict */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-primary)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: loadingVerdict
                        ? "var(--orange)"
                        : verdict
                        ? "var(--green)"
                        : "var(--text-muted)",
                      boxShadow: loadingVerdict
                        ? "0 0 6px var(--orange)"
                        : verdict
                        ? "0 0 6px var(--green)"
                        : "none",
                    }}
                  />
                  <h3 className="font-semibold text-sm">AI Verdict</h3>
                  {loadingVerdict && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      analyzing...
                    </span>
                  )}
                </div>
                {verdict ? (
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {verdict}
                    {loadingVerdict && (
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
                    AI verdict will appear here once Token B is loaded...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}