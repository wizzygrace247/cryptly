import { create } from "zustand";
import type { WatchlistEntry, AlertItem } from "~/types/tokens";

interface WatchlistStore {
  items: WatchlistEntry[];
  alerts: AlertItem[];
  add: (entry: WatchlistEntry) => void;
  remove: (address: string) => void;
  has: (address: string) => boolean;
  updateScore: (address: string, newScore: number) => void;
  addAlert: (alert: AlertItem) => void;
  clearAlerts: () => void;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  items: [],
  alerts: [],
  add: (entry) =>
    set((s) => ({
      items: s.items.find((i) => i.address === entry.address)
        ? s.items
        : [...s.items, entry],
    })),
  remove: (address) =>
    set((s) => ({ items: s.items.filter((i) => i.address !== address) })),
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