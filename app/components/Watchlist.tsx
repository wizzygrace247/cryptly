import { Eye, Trash2, Plus, Check } from "lucide-react";
import { useWatchlistStore } from "~/store/watchlistStore";
import { scoreToColor } from "~/lib/utils";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  currentToken: TokenMetrics;
}

export default function Watchlist({ currentToken }: Props) {
  const { items, add, remove, has } = useWatchlistStore();
  const watching = has(currentToken.address);

  const toggle = () => {
    if (watching) {
      remove(currentToken.address);
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
    <div
      className="rounded-2xl p-6 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3 className="font-semibold text-sm">Watchlist</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent)",
            }}
          >
            {items.length}
          </span>
        </div>

        <button
          onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
          style={{
            background: watching ? "rgba(239,68,68,0.2)" : "var(--accent)",
            color: watching ? "var(--red)" : "white",
            border: watching ? "1px solid var(--red)" : "none",
          }}
        >
          {watching ? (
            <>
              <Trash2 className="w-3 h-3" /> Unwatch {currentToken.symbol}
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" /> Watch {currentToken.symbol}
            </>
          )}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No tokens watched yet. Add tokens to monitor their risk over time.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <div
              key={w.address}
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-primary)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {w.symbol.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {w.chain}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: scoreToColor(w.lastScore) }}
                  >
                    {w.lastScore}/100
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    risk score
                  </p>
                </div>
                <button
                  onClick={() => remove(w.address)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <Trash2
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}