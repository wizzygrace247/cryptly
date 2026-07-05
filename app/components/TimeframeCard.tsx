import { Clock } from "lucide-react";
import type { TimeframeEstimate } from "~/types/tokens";

interface Props {
  timeframe: TimeframeEstimate;
}

const CATEGORY_COLOR: Record<string, string> = {
  quick_pump: "var(--red)",
  momentum_play: "var(--orange)",
  accumulation: "var(--yellow)",
  long_term: "var(--green)",
};

export default function TimeframeCard({ timeframe }: Props) {
  const color = CATEGORY_COLOR[timeframe.category];

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold">Expected Timeframe</h3>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
          style={{
            background: `${color}22`,
            color,
          }}
        >
          {timeframe.confidence} confidence
        </span>
      </div>

      <div className="mb-4">
        <p className="text-lg font-bold" style={{ color }}>
          {timeframe.label}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {timeframe.window}
        </p>
      </div>

      <div
        className="space-y-2 rounded-xl border border-dashed p-3"
        style={{ borderColor: "var(--border)" }}
      >
        {timeframe.signals.map((s, i) => (
          <p key={i} className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span style={{ color }}>•</span>
            <span>{s}</span>
          </p>
        ))}
      </div>

      <p
        className="mt-4 border-t pt-3 text-xs italic"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Based on observable market patterns, not a guarantee. Crypto markets are volatile and unpredictable.
      </p>
    </div>
  );
}