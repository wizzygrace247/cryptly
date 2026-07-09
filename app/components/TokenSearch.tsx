import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Chain, TokenMetrics } from "~/types/tokens";

const CHAINS: { value: Chain; label: string; short: string }[] = [
  { value: "ethereum", label: "Ethereum", short: "ETH" },
  { value: "solana", label: "Solana", short: "SOL" },
  { value: "bsc", label: "BSC", short: "BSC" },
  { value: "base", label: "Base", short: "BASE" },
  { value: "arbitrum", label: "Arbitrum", short: "ARB" },
  { value: "xlayer", label: "X Layer", short: "XLAY" },
];

interface Props {
  onResult: (token: TokenMetrics) => void;
}

export default function TokenSearch({ onResult }: Props) {
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<Chain>("ethereum");
  const [showChains, setShowChains] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeChain = CHAINS.find((c) => c.value === chain);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: query.trim(), chain }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to fetch token data");
      }

      const token: TokenMetrics = await res.json();
      onResult(token);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* row 1 on mobile: chain + input | single row on desktop: everything */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
        {/* chain selector — compact code, not full name */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowChains(!showChains)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-md border text-xs sm:text-sm font-medium font-data whitespace-nowrap"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {activeChain?.short}
            <span style={{ color: "var(--text-muted)" }} className="text-[10px]">▾</span>
          </button>

          {showChains && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowChains(false)} />
              <div
                className="absolute top-full mt-1 left-0 rounded-md border z-50 py-1 min-w-32 solid-panel"
                style={{ borderColor: "var(--border)" }}
              >
                {CHAINS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setChain(c.value);
                      setShowChains(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between"
                    style={{
                      color: chain === c.value ? "var(--accent)" : "var(--text-primary)",
                      background: chain === c.value ? "var(--accent-glow)" : "transparent",
                    }}
                  >
                    <span>{c.label}</span>
                    <span className="text-xs font-data" style={{ color: "var(--text-muted)" }}>
                      {c.short}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* search input */}
        <div className="flex-1 min-w-0 relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Contract address..."
            className="w-full pl-8 sm:pl-10 pr-2 py-2 rounded-md border text-xs sm:text-sm outline-none min-w-0"
            style={{
              background: "var(--bg-card)",
              borderColor: error ? "var(--red)" : "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* analyze button — desktop only in this row */}
        <button
          onClick={analyze}
          disabled={loading || !query.trim()}
          className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #cc8b00 100%)",
            color: "#0A0B0A",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {/* row 2 on mobile only: full-width Analyze button */}
      <button
        onClick={analyze}
        disabled={loading || !query.trim()}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, #cc8b00 100%)",
          color: "#0A0B0A",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
          </>
        ) : (
          "Analyze Token"
        )}
      </button>

      {error && (
        <p className="text-xs pl-1" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}