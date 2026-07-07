import { Eye, Trash2, Plus, Check } from "lucide-react";
import { useWatchlistStore } from "~/store/watchlistStore";
import { scoreToColor } from "~/lib/utils";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  currentToken?: TokenMetrics | null;
}

export default function Watchlist({ currentToken }: Props) {
  const { items, add, remove, has } = useWatchlistStore();
  const watching = currentToken ? has(currentToken.address) : false;

  const toggle = () => {
    if (!currentToken) return;
    if (watching) {
      remove(currentToken.address, currentToken.chain);
    } else {
      add({
        address: currentToken.address,
        chain: currentToken.chain,
        symbol: currentToken.symbol,
        name: currentToken.name,
        addedAt: new Date(),
        lastScore: currentToken.riskScore,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* only show add/remove button if a token is currently loaded */}
      {currentToken && (
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: watching ? "rgba(239,68,68,0.15)" : "var(--accent)",
            color: watching ? "var(--red)" : "#0A0B0A",
            border: watching ? "1px solid var(--red)" : "none",
          }}
        >
          {watching ? (
            <>
              <Trash2 className="w-3.5 h-3.5" /> Unwatch {currentToken.symbol}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Watch {currentToken.symbol}
            </>
          )}
        </button>
      )}

      {/* saved list — always visible regardless of currentToken */}
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No tokens watched yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <div
              key={`${w.address}-${w.chain}`}
              className="flex items-center justify-between p-3 rounded-md border"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-primary)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--accent)", color: "#0A0B0A" }}
                >
                  {w.symbol.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {w.chain}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className="text-sm font-bold font-data"
                    style={{ color: scoreToColor(w.lastScore) }}
                  >
                    {w.lastScore}/100
                  </p>
                </div>
                <button
                  onClick={() => remove(w.address, w.chain)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}