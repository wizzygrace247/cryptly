import type { Chain } from "~/types/tokens";

// GoPlus chain IDs differ from DexScreener
const CHAIN_ID_MAP: Record<Chain, string> = {
    ethereum: "1",
    bsc: "56",
    base: "8453",
    arbitrum: "42161",
    solana: "solana", // GoPlus uses "solana" string for Solana
    xlayer: "196",
};

export interface GoPlusResult {
    honeypotFlag: boolean;
    verified: boolean;
    ownershipRenounced: boolean;
    buyTax: number;
    sellTax: number;
    topHolderPct: number;
    cannotSell: boolean;
    isMintable: boolean;
    isProxy: boolean;
    blacklistFunction: boolean;
}

interface GoPlusTokenData {
    is_honeypot?: string;
    is_open_source?: string;
    owner_address?: string;
    buy_tax?: string;
    sell_tax?: string;
    holder_count?: string;
    holders?: Array<{ percent: string; is_locked?: number }>;
    cannot_sell_all?: string;
    is_mintable?: string;
    is_proxy?: string;
    is_blacklisted?: string;
}

export async function fetchTokenSecurity(
    address: string,
    chain: Chain
): Promise<GoPlusResult> {
    // Solana has a separate endpoint
    const isSolana = chain === "solana";
    const chainId = CHAIN_ID_MAP[chain];

    const url = isSolana
        ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`
        : `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;

    try {
        const res = await fetch(url, {
            headers: process.env.GOPLUS_API_KEY
                ? { "Authorization": process.env.GOPLUS_API_KEY }
                : {},
        });

        if (!res.ok) throw new Error(`GoPlus error: ${res.status}`);

        const data = await res.json();

        if (data.code !== 1) {
            throw new Error(`GoPlus returned code ${data.code}: ${data.message}`);
        }

        const tokenKey = Object.keys(data.result ?? {})[0];
        const t: GoPlusTokenData = data.result?.[tokenKey] ?? {};

        // top 10 holder concentration
        const holders = t.holders ?? [];
        const topHolderPct = holders
            .slice(0, 10)
            .reduce((sum: number, h) => sum + parseFloat(h.percent ?? "0") * 100, 0);

        return {
            honeypotFlag: t.is_honeypot === "1",
            verified: t.is_open_source === "1",
            ownershipRenounced:
                !t.owner_address || t.owner_address === "0x0000000000000000000000000000000000000000",
            buyTax: parseFloat(t.buy_tax ?? "0") * 100,
            sellTax: parseFloat(t.sell_tax ?? "0") * 100,
            topHolderPct: Math.min(Math.round(topHolderPct), 100),
            cannotSell: t.cannot_sell_all === "1",
            isMintable: t.is_mintable === "1",
            isProxy: t.is_proxy === "1",
            blacklistFunction: t.is_blacklisted === "1",
        };
    } catch (err) {
        console.warn("GoPlus fetch failed, using safe defaults:", err);
        // return neutral defaults so the app doesn't break if GoPlus is down
        return {
            honeypotFlag: false,
            verified: false,
            ownershipRenounced: false,
            buyTax: 0,
            sellTax: 0,
            topHolderPct: 0,
            cannotSell: false,
            isMintable: false,
            isProxy: false,
            blacklistFunction: false,
        };
    }
}

export interface ApprovalRisk {
  spenderAddress: string;
  tokenAddress: string;
  isMaliciousSpender: boolean;
  approvedAmount: string;
  riskNote: string;
}

export async function fetchApprovalSecurity(
  walletAddress: string,
  chain: Chain
): Promise<ApprovalRisk[]> {
  const chainId = CHAIN_ID_MAP[chain];
  if (!chainId || chain === "solana") return [];

  const url = `https://api.gopluslabs.io/api/v1/approval_security/${chainId}?addresses=${walletAddress}`;

  try {
    const res = await fetch(url, {
      headers: process.env.GOPLUS_API_KEY
        ? { Authorization: process.env.GOPLUS_API_KEY }
        : {},
    });

    if (!res.ok) return [];
    const data = await res.json();

    // NOTE: verify exact field names against https://docs.gopluslabs.io
    // before demo — response schema below is best-effort from public docs
    const approvals = data?.result?.[walletAddress.toLowerCase()] ?? [];

    const risks: ApprovalRisk[] = [];
    for (const a of approvals) {
      const isMalicious =
        a.malicious_address === "1" || a.malicious_behavior?.length > 0;
      if (!isMalicious) continue;

      risks.push({
        spenderAddress: a.approved_contract ?? "unknown",
        tokenAddress: a.token_address ?? "unknown",
        isMaliciousSpender: true,
        approvedAmount: a.approved_amount ?? "unlimited",
        riskNote:
          a.malicious_behavior?.join(", ") ?? "Flagged as malicious spender",
      });
    }
    return risks;
  } catch (err) {
    console.warn("GoPlus approval security fetch failed:", err);
    return [];
  }
}