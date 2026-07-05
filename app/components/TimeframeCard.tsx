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
      className="rounded-2xl p-6 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <h3 className="font-semibold text-sm">Expected Timeframe</h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-bold" style={{ color }}>
            {timeframe.label}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {timeframe.window}
          </p>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium capitalize"
          style={{
            background: `${color}22`,
            color,
          }}
        >
          {timeframe.confidence} confidence
        </span>
      </div>

      <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        {timeframe.signals.map((s, i) => (
          <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-muted)" }}>
            <span style={{ color }}>•</span> {s}
          </p>
        ))}
      </div>

      <p
        className="text-xs mt-4 pt-3 border-t italic"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Based on observable market patterns, not a guarantee. Crypto markets are volatile and unpredictable.
      </p>
    </div>
  );
}