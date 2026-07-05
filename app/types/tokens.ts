export type Chain = "ethereum" | "solana" | "bsc" | "base" | "arbitrum" | "xlayer"; 

export interface TokenMetrics {
  name: string;
  symbol: string;
  address: string;
  logoUrl?: string;
  chain: Chain;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  ageInDays: number;
  topHolderPct: number;
  verified: boolean;
  ownershipRenounced: boolean;
  honeypotFlag: boolean;
  buyTax: number;
  sellTax: number;
  liquidityRatio: number;
  riskScore: number;
  riskLabel: "Low Risk" | "Medium Risk" | "High Risk" | "Extreme Risk";
  timeframe?: TimeframeEstimate;
}

export interface AlertItem {
  id: string;
  tokenSymbol: string;
  message: string;
  timestamp: Date;
  severity: "info" | "warning" | "danger";
}

export interface WatchlistEntry {
  address: string;
  chain: Chain;
  symbol: string;
  name: string;
  addedAt: Date;
  lastScore: number;
}

export type TimeframeCategory =
  | "quick_pump"
  | "momentum_play"
  | "accumulation"
  | "long_term";

export interface TimeframeEstimate {
  category: TimeframeCategory;
  label: string;
  window: string;       // human readable e.g. "Days to 2 weeks"
  confidence: "low" | "medium" | "high";
  signals: string[];    // what drove this classification
}
export interface TokenMetrics {
  // ... all existing fields
  pairAddress: string; // add this 
  
}

export interface CompareResult {
  tokenA: TokenMetrics;
  tokenB: TokenMetrics;
  winner: "A" | "B" | "tie";
  verdict: string; // AI streamed text
}