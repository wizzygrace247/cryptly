import {
  X,
  Wallet,
  BarChart3,
  Eye,
  GitCompare,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useWallet } from "~/lib/wallet/useWallet";
import { useWatchlistStore } from "~/store/watchlistStore";
import Watchlist from "./Watchlist";
import WalletDashboard from "./WalletDashboard";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  open: boolean;
  onClose: () => void;
  token: TokenMetrics | null;
  onOpenPortfolio: () => void;
  onOpenCompare: () => void;
}

type PanelView = "main" | "wallet";

export default function SidePanel({
  open,
  onClose,
  token,
  onOpenPortfolio,
  onOpenCompare,
}: Props) {
  const { address, connecting, error, connect, disconnect, needsMobileRedirect } = useWallet();
  const { alerts, clearAlerts } = useWatchlistStore();
  const [panelView, setPanelView] = useState<PanelView>("main");

  if (!open) return null;

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const severityColor = (s: string) =>
    s === "danger" ? "var(--red)" : s === "warning" ? "var(--orange)" : "var(--accent)";

  return (
    <>
      {/* opaque blurred backdrop — fixes the see-through issue */}
      <div className="fixed inset-0 z-40 overlay-backdrop" onClick={onClose} />

      {/* fully solid panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-96 z-50 flex flex-col solid-panel"
        style={{
          borderLeft: "1px solid var(--border-bright)",
          boxShadow: "-24px 0 60px -20px rgba(0,0,0,0.85)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-panel)",
          }}
        >
          {panelView === "wallet" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPanelView("main")}
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back
              </button>
              <h2
                className="font-bold text-sm tracking-widest uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Wallet Overview
              </h2>
            </div>
          ) : (
            <h2
              className="font-bold text-sm tracking-widest uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
            >
              Control Panel
            </h2>
          )}
          <button onClick={onClose}>
            <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {panelView === "wallet" && address ? (
            <WalletDashboard walletAddress={address} />
          ) : (
            <>
              {/* wallet card */}
              <div className="glow-card scan-corners rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent-glow)" }}
                  >
                    <Wallet className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-sm font-semibold">Wallet</h3>
                </div>

                {address ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Connected
                        </p>
                        <p className="text-sm font-data" style={{ color: "var(--accent)" }}>
                          {short}
                        </p>
                      </div>
                      <button
                        onClick={disconnect}
                        className="p-2 rounded-md border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <LogOut className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>
                    <button
                      onClick={() => setPanelView("wallet")}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm"
                      style={{
                        border: "1px solid var(--accent-dim)",
                        background: "var(--accent-glow)",
                        color: "var(--accent)",
                      }}
                    >
                      <span>View Holdings & Risk Scan</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={connect}
                      disabled={connecting}
                      className="w-full py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, var(--accent) 0%, #cc8b00 100%)",
                        color: "#0A0B0A",
                      }}
                    >
                      {connecting
                        ? "Connecting..."
                        : needsMobileRedirect
                        ? "Open in MetaMask App"
                        : "Connect Wallet"}
                    </button>
                    {error && (
                      <p className="text-xs mt-2" style={{ color: "var(--red)" }}>
                        {error}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      Connect to unlock persistent watchlist, portfolio history, and
                      wallet risk scan
                    </p>
                  </>
                )}
              </div>

              {/* nav actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenPortfolio();
                    onClose();
                  }}
                  className="glow-card w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Portfolio Analyzer
                </button>

                <button
                  onClick={() => {
                    onOpenCompare();
                    onClose();
                  }}
                  disabled={!token}
                  className="glow-card w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium disabled:opacity-40"
                  style={{ color: "var(--text-primary)" }}
                >
                  <GitCompare className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Compare Tokens
                  {!token && (
                    <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                      analyze first
                    </span>
                  )}
                </button>
              </div>

              {/* alerts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    <h3 className="text-sm font-semibold">Agent Alerts</h3>
                    {alerts.length > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "var(--red)", color: "white" }}
                      >
                        {alerts.length}
                      </span>
                    )}
                  </div>
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
                  <div className="glow-card rounded-md p-4 text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {address
                        ? "No alerts yet. Agent monitors your watchlist every 5 minutes."
                        : "Connect wallet to receive persistent alerts."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-md text-xs"
                        style={{
                          border: `1px solid ${severityColor(a.severity)}`,
                          background: `${severityColor(a.severity)}15`,
                        }}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold" style={{ color: severityColor(a.severity) }}>
                            {a.tokenSymbol}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p style={{ color: "var(--text-primary)" }}>{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* watchlist */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  <h3 className="text-sm font-semibold">Watchlist</h3>
                  {!address && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      — session only
                    </span>
                  )}
                  {address && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--green-glow)", color: "var(--green)" }}
                    >
                      synced
                    </span>
                  )}
                </div>
                <Watchlist currentToken={token} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}