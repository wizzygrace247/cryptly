import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Chain, TokenMetrics } from "~/types/tokens";
import { computeRiskScore, scoreToLabel } from "~/lib/utils";

const CHAINS: { value: Chain; label: string }[] = [
    { value: "ethereum", label: "Ethereum" },
    { value: "solana", label: "Solana" },
    { value: "bsc", label: "BSC" },
    { value: "base", label: "Base" },
    { value: "arbitrum", label: "Arbitrum" },
    { value: "xlayer", label: "X Layer" },
];

interface Props {
    onResult: (token: TokenMetrics) => void;
}

export default function TokenSearch({ onResult }: Props) {
    const [query, setQuery] = useState("");
    const [chain, setChain] = useState<Chain>("ethereum");
    const [showChains, setShowChains] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const analyze = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: query.trim(), chain }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to fetch token data");
            }

            const token: TokenMetrics = await res.json();
            onResult(token);
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 flex-1 max-w-2xl mx-6">
            <div className="flex items-center gap-2">
                {/* chain selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowChains(!showChains)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm whitespace-nowrap"
                        style={{
                            background: "var(--bg-card)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    >
                        {CHAINS.find((c) => c.value === chain)?.label}
                        <span style={{ color: "var(--text-muted)" }}>▾</span>
                    </button>

                    {showChains && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowChains(false)} />
                            <div
                                className="absolute top-full mt-1 left-0 rounded-lg border z-50 py-1 min-w-36"
                                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                            >
                                {CHAINS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => { setChain(c.value); setShowChains(false); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                                        style={{
                                            color: chain === c.value ? "var(--accent)" : "var(--text-primary)",
                                            background: chain === c.value ? "var(--accent-glow)" : "transparent",
                                        }}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* input */}
                <div className="flex-1 relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "var(--text-muted)" }}
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && analyze()}
                        placeholder="Token contract address or coin ID..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none"
                        style={{
                            background: "var(--bg-card)",
                            borderColor: error ? "var(--red)" : "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>

                {/* button */}
                <button
                    onClick={analyze}
                    disabled={loading || !query.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 whitespace-nowrap"
                    style={{ background: "var(--accent)" }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                        </>
                    ) : (
                        "Analyze"
                    )}
                </button>
            </div>

            {error && (
                <p className="text-xs pl-1" style={{ color: "var(--red)" }}>
                    {error}
                </p>
            )}
        </div>
    );
}