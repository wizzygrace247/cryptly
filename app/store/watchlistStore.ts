import { create } from "zustand";
import type { WatchlistEntry, AlertItem } from "~/types/tokens";

interface WatchlistStore {
  items: WatchlistEntry[];
  walletAddress: string | null;

  // wallet
  setWallet: (address: string | null) => void;

  // watchlist
  add: (entry: WatchlistEntry) => void;
  remove: (address: string, chain: string) => void;
  has: (address: string) => boolean;
  loadFromDb: (walletAddress: string) => Promise<void>;
  updateScore: (address: string, newScore: number) => void;

  // alerts
  alerts: AlertItem[];
  addAlert: (alert: AlertItem) => void;
  clearAlerts: () => void;
  loadAlertsFromDb: (walletAddress: string) => Promise<void>;
}

async function persistAdd(
  walletAddress: string,
  entry: WatchlistEntry
) {
  await fetch("/api/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      op: "add_watchlist",
      walletAddress,
      entry,
    }),
  });
}

async function persistRemove(
  walletAddress: string,
  tokenAddress: string,
  chain: string
) {
  await fetch("/api/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      op: "remove_watchlist",
      walletAddress,
      tokenAddress,
      chain,
    }),
  });
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  items: [],
  alerts: [],
  walletAddress: null,

  setWallet: async (address) => {
    set({ walletAddress: address });
    if (address) {
      await get().loadFromDb(address);
      await get().loadAlertsFromDb(address);
    } else {
      // wallet disconnected — clear to session only
      set({ items: [], alerts: [] });
    }
  },

  loadFromDb: async (walletAddress) => {
    try {
      const res = await fetch("/api/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "get_watchlist", walletAddress }),
      });
      const data = await res.json();
      const items: WatchlistEntry[] = (data.watchlist ?? []).map(
        (row: any) => ({
          address: row.token_address,
          chain: row.chain,
          symbol: row.symbol,
          name: row.name,
          addedAt: new Date(row.added_at),
          lastScore: row.last_score ?? 0,
        })
      );
      set({ items });
    } catch (err) {
      console.warn("Failed to load watchlist from DB:", err);
    }
  },

  loadAlertsFromDb: async (walletAddress) => {
    try {
      const res = await fetch("/api/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "get_alerts", walletAddress }),
      });
      const data = await res.json();
      const alerts: AlertItem[] = (data.alerts ?? []).map((row: any) => ({
        id: row.id,
        tokenSymbol: row.token_symbol,
        message: row.message,
        timestamp: new Date(row.created_at),
        severity: row.severity,
      }));
      set({ alerts });
    } catch (err) {
      console.warn("Failed to load alerts from DB:", err);
    }
  },

  add: async (entry) => {
    const { items, walletAddress } = get();
    if (items.find((i) => i.address === entry.address)) return;
    set({ items: [...items, entry] });
    if (walletAddress) await persistAdd(walletAddress, entry);
  },

  remove: async (address, chain) => {
    const { walletAddress } = get();
    set((s) => ({
      items: s.items.filter(
        (i) => !(i.address === address && i.chain === chain)
      ),
    }));
    if (walletAddress) await persistRemove(walletAddress, address, chain);
  },

  has: (address) => !!get().items.find((i) => i.address === address),

  updateScore: (address, newScore) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.address === address ? { ...i, lastScore: newScore } : i
      ),
    })),

  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 20) })),

  clearAlerts: () => set({ alerts: [] }),
}));