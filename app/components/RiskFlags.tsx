import { AlertTriangle, ShieldAlert, Flame } from "lucide-react";
import type { TokenMetrics } from "~/types/tokens";

interface Props { token: TokenMetrics }

interface Flag {
  icon: React.ReactNode;
  message: string;
  severity: "critical" | "warning";
}

function getFlags(token: TokenMetrics): Flag[] {
  const flags: Flag[] = [];

  if (token.honeypotFlag)
    flags.push({
      icon: <Flame className="w-4 h-4" />,
      message: "Honeypot detected — you may not be able to sell this token",
      severity: "critical",
    });

  if (!token.verified)
    flags.push({
      icon: <ShieldAlert className="w-4 h-4" />,
      message: "Contract is not verified on-chain",
      severity: "critical",
    });

  if (token.sellTax > 10)
    flags.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `High sell tax: ${token.sellTax}% — significantly reduces exit value`,
      severity: "critical",
    });

  if (token.topHolderPct > 50)
    flags.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `Top 10 wallets hold ${token.topHolderPct}% — high dump risk`,
      severity: "warning",
    });

  if (token.liquidity < 50_000)
    flags.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `Low liquidity ($${(token.liquidity / 1000).toFixed(0)}K) — easy to manipulate`,
      severity: "warning",
    });

  if (!token.ownershipRenounced)
    flags.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      message: "Ownership not renounced — deployer can still modify contract",
      severity: "warning",
    });

  if (token.ageInDays < 7)
    flags.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `Token is only ${token.ageInDays} day(s) old — very early stage`,
      severity: "warning",
    });

  return flags;
}

export default function RiskFlags({ token }: Props) {
  const flags = getFlags(token);
  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{
            borderColor: f.severity === "critical" ? "rgba(239,68,68,0.4)" : "rgba(249,115,22,0.4)",
            background: f.severity === "critical" ? "rgba(239,68,68,0.08)" : "rgba(249,115,22,0.08)",
            color: f.severity === "critical" ? "var(--red)" : "var(--orange)",
          }}
        >
          {f.icon}
          <span>{f.message}</span>
        </div>
      ))}
    </div>
  );
}