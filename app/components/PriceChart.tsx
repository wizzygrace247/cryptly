import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  token: TokenMetrics;
}

type RangeOption = 1 | 7 | 30;

const RANGES: { value: RangeOption; label: string }[] = [
  { value: 1, label: "24H" },
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
];

export default function PriceChart({ token }: Props) {
  const [range, setRange] = useState<RangeOption>(7);
  const [data, setData] = useState<{ time: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poolAddress: token.pairAddress,
        chain: token.chain,
        days: range,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const points = json.prices ?? [];
        if (points.length === 0) {
          setError(true);
          setData([]);
          return;
        }
        setData(
          points.map((p: { timestamp: number; price: number }) => ({
            time: new Date(p.timestamp * 1000).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: range === 1 ? "numeric" : undefined,
            }),
            price: p.price,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token.pairAddress, token.chain, range]);

  const isUp =
    data.length > 1 && data[data.length - 1].price >= data[0].price;
  const lineColor = isUp ? "#22c55e" : "#ef4444";

  return (
    <div
      className="rounded-2xl p-4 border card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Price History</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: range === r.value ? "var(--accent)" : "transparent",
                color: range === r.value ? "white" : "var(--text-muted)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          className="h-56 flex items-center justify-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Loading chart...
        </div>
      ) : error || data.length === 0 ? (
        <div
          className="h-56 flex flex-col items-center justify-center text-sm gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          <p>No historical data available for this pool yet</p>
          <p className="text-xs">Common for very new or low-volume tokens</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#1e2340" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) =>
                v < 0.01 ? v.toExponential(1) : `$${v.toFixed(v < 1 ? 4 : 2)}`
              }
              width={65}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text-muted)" }}
              formatter={(value: any) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : Array.isArray(value)
                      ? Number(value[0])
                      : Number(value ?? 0);

                return [
                  `$${numericValue < 0.01 ? numericValue.toExponential(2) : numericValue.toFixed(4)}`,
                  "Price",
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#priceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}