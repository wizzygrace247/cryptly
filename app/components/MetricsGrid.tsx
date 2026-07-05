import { fmt, fmtPrice } from "~/lib/utils";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  token: TokenMetrics;
}

export default function MetricsGrid({ token }: Props) {
  const metrics = [
    {
      label: "Market Cap",
      value: fmt(token.marketCap),
      warn: false,
    },
    {
      label: "24h Volume",
      value: fmt(token.volume24h),
      warn: false,
    },
    {
      label: "Liquidity",
      value: fmt(token.liquidity),
      warn: token.liquidity < 50_000,
    },
    {
      label: "Token Age",
      value: `${token.ageInDays} days`,
      warn: token.ageInDays < 7,
    },
    {
      label: "Top 10 Holders",
      value: `${token.topHolderPct}%`,
      warn: token.topHolderPct > 50,
    },
    {
      label: "Buy / Sell Tax",
      value: `${token.buyTax}% / ${token.sellTax}%`,
      warn: token.sellTax > 10,
    },
    {
      label: "Contract Verified",
      value: token.verified ? "✓ Yes" : "✗ No",
      warn: !token.verified,
    },
    {
      label: "Ownership Renounced",
      value: token.ownershipRenounced ? "✓ Yes" : "✗ No",
      warn: !token.ownershipRenounced,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl p-4 border"
          style={{
            background: "var(--bg-card)",
            borderColor: m.warn ? "rgba(239,68,68,0.4)" : "var(--border)",
          }}
        >
          <p
            className="text-xs mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {m.label}
          </p>
          <p
            className="text-sm font-semibold"
            style={{
              color: m.warn ? "var(--red)" : "var(--text-primary)",
            }}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}