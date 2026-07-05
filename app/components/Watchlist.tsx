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
      className="mt-8 rounded-2xl border p-6 shadow-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold">Watchlist</h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 sm:w-auto"
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
              className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-primary)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
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

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: scoreToColor(w.lastScore) }}
                  >
                    {w.lastScore}/100
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    risk score
                  </p>
                </div>
                <button
                  onClick={() => remove(w.address)}
                  className="transition-opacity hover:opacity-70"
                >
                  <Trash2
                    className="h-4 w-4"
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