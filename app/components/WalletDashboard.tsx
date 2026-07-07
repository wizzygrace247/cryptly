import { useState, useEffect } from "react";
import { Loader2, ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";
import { fmt, scoreToColor } from "~/lib/utils";

interface Props {
  walletAddress: string;
}

export default function WalletDashboard({ walletAddress }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Wallet scan failed");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
        <span style={{ color: "var(--text-muted)" }}>Scanning wallet holdings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: "var(--red)" }}>
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* total value */}
      <div
        className="scan-corners rounded-md border p-6 text-center"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Total Portfolio Value
        </p>
        <p className="text-3xl font-bold font-data mt-1" style={{ color: "var(--accent)" }}>
          {fmt(data.totalValue)}
        </p>
      </div>

      {/* skipped chains notice */}
      {data.skippedChains?.length > 0 && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Note: {data.skippedChains.join(", ")} not yet supported for wallet scanning
        </p>
      )}

      {/* approval risks */}
      {data.approvalRisks?.length > 0 && (
        <div
          className="rounded-md border p-4"
          style={{ borderColor: "var(--red)", background: "var(--red-glow)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4" style={{ color: "var(--red)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--red)" }}>
              {data.approvalRisks.length} Risky Approval{data.approvalRisks.length > 1 ? "s" : ""} Detected
            </h3>
          </div>
          {data.approvalRisks.map((r: any, i: number) => (
            <p key={i} className="text-xs mt-1" style={{ color: "var(--text-primary)" }}>
              {r.spenderAddress.slice(0, 10)}... — {r.riskNote}
            </p>
          ))}
        </div>
      )}

      {/* deep scanned holdings */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold px-1">Holdings (Risk Scanned)</h3>
        {data.deepScanned.map((t: any) => (
          <div
            key={`${t.chain}-${t.tokenAddress}`}
            className="flex items-center justify-between p-3 rounded-md border"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "#0A0B0A" }}
              >
                {t.symbol.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{t.symbol}</p>
                <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                  {t.chain}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-data">{fmt(t.usdValue)}</p>
                <p
                  className="text-xs flex items-center gap-1 justify-end"
                  style={{ color: t.priceChange24h >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {t.priceChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(t.priceChange24h).toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: scoreToColor(t.riskScore) }}>
                  {t.riskScore}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  risk
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* remaining unscanned */}
      {data.remaining?.length > 0 && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          +{data.remaining.length} more token(s) held — showing top {data.deepScanned.length} by value only
        </p>
      )}
    </div>
  );
}