import { Bell } from "lucide-react";
import { useState } from "react";
import { useWatchlistStore } from "~/store/watchlistStore";
import type { AlertItem } from "~/types/tokens";

export default function AlertFeed() {
  const [open, setOpen] = useState(false);
  const { alerts, clearAlerts } = useWatchlistStore();

  const severityColor = (s: AlertItem["severity"]) =>
    s === "danger" ? "var(--red)"
    : s === "warning" ? "var(--orange)"
    : "var(--accent)";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Bell className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        {alerts.length > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse"
            style={{ background: "var(--red)" }}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border z-50 p-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Agent Alerts</p>
              {alerts.length > 0 && (
                <button
                  onClick={clearAlerts}
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Clear all
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No alerts yet. Add tokens to your watchlist to monitor them.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg border text-sm"
                    style={{
                      borderColor: severityColor(a.severity),
                      background: `${severityColor(a.severity)}18`,
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-xs" style={{ color: severityColor(a.severity) }}>
                        {a.tokenSymbol}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ color: "var(--text-primary)" }}>{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}