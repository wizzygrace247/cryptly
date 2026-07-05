import { useEffect } from "react";
import { useWatchlistStore } from "~/store/watchlistStore";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SCORE_CHANGE_THRESHOLD = 10;    // alert if score shifts by 10+

export function useWatchlistAgent() {
  const { items, updateScore, addAlert } = useWatchlistStore();

  useEffect(() => {
    if (items.length === 0) return;

    const poll = async () => {
      for (const item of items) {
        try {
          const res = await fetch("/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: item.address,
              chain: item.chain,
            }),
          });

          if (!res.ok) continue;
          const token = await res.json();
          const newScore: number = token.riskScore;
          const delta = newScore - item.lastScore;

          // alert if score changed significantly
          if (Math.abs(delta) >= SCORE_CHANGE_THRESHOLD) {
            addAlert({
              id: `${item.address}-${Date.now()}`,
              tokenSymbol: item.symbol,
              message:
                delta > 0
                  ? `Risk score increased by ${delta} points (now ${newScore}/100)`
                  : `Risk score improved by ${Math.abs(delta)} points (now ${newScore}/100)`,
              timestamp: new Date(),
              severity: delta > 0 ? (delta > 20 ? "danger" : "warning") : "info",
            });
          }

          // alert on honeypot detection
          if (token.honeypotFlag && !item.lastScore) {
            addAlert({
              id: `hp-${item.address}-${Date.now()}`,
              tokenSymbol: item.symbol,
              message: "⚠️ Honeypot now detected on this token",
              timestamp: new Date(),
              severity: "danger",
            });
          }

          updateScore(item.address, newScore);
        } catch {
          // silently skip failed polls
        }
      }
    };

    // poll immediately then on interval
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [items.length]); // re-run when watchlist changes
}