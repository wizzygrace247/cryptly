import { useState, useCallback, useEffect } from "react";
import { useWatchlistStore } from "~/store/watchlistStore";

interface WalletState {
  address: string | null;
  chainId: string | null;
  connecting: boolean;
  error: string;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && !!(window as any).ethereum;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    connecting: false,
    error: "",
  });

  const { setWallet } = useWatchlistStore();
  const isMobile = isMobileDevice();
  const needsMobileRedirect = isMobile && !hasInjectedWallet();

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;

    if (!eth) {
      if (isMobileDevice()) {
        // deep link into MetaMask's built-in browser — window.ethereum
        // will be injected once the page reloads inside the app
        const hostAndPath =
          window.location.host + window.location.pathname + window.location.search;
        window.location.href = `https://metamask.app.link/dapp/${hostAndPath}`;
        return;
      }
      setState((s) => ({
        ...s,
        error: "No wallet found. Install MetaMask or a compatible EVM wallet.",
      }));
      return;
    }

    setState((s) => ({ ...s, connecting: true, error: "" }));
    try {
      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });
      const chainId: string = await eth.request({ method: "eth_chainId" });
      setState({
        address: accounts[0],
        chainId,
        connecting: false,
        error: "",
      });
      await setWallet(accounts[0]);
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err.message ?? "Connection rejected",
      }));
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, connecting: false, error: "" });
    setWallet(null);
  }, [setWallet]);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else {
        setState((s) => ({ ...s, address: accounts[0] }));
        setWallet(accounts[0]);
      }
    };
    eth.on?.("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener?.("accountsChanged", handleAccountsChanged);
  }, [disconnect, setWallet]);

  return { ...state, connect, disconnect, needsMobileRedirect };
}