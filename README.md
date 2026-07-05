Cryptly: AI Crypto Risk Analysis Agent

Cryptly is an always-on AI agent that analyzes any cryptocurrency token and gives you a clear, data-driven risk assessment. Paste a contract address, pick your chain, and Cryptly fetches real-time on-chain data, scores the token across 8 risk signals, streams an AI explanation, and monitors your watchlist in the background — alerting you when risk changes.


What problem does Cryptly solve?

The crypto market is full of rug pulls, honeypots, and pump-and-dump schemes — especially in small and mid-cap tokens where most retail investors lose money. Existing tools either:
- Show raw data with no interpretation (DexScreener, Etherscan)
- Give vague "safety scores" with no explanation (basic scanners)
- Only cover large, well-known tokens (CoinGecko, CoinMarketCap)

Cryptly bridges that gap. It combines real-time on-chain data with AI reasoning to tell you why a token is risky, what pattern it fits (quick pump vs long-term hold), and how it compares to alternatives — in plain language, in seconds.


Who is it for?

- Retail crypto investors evaluating small/mid-cap tokens before investing
- Traders who need fast risk context on trending tokens
- Anyone who has ever been rugged and wants a second opinion before aping in


 Features

| Feature | Description |
|---|---|
|  Token Analysis | Paste any contract address or coin ID across 6 chains |
|  Risk Scoring | Deterministic 0–100 score across 8 on-chain signals |
|  Instant Red Flags | Honeypot detection, unverified contracts, high sell tax flagged immediately |
|  AI Insights | Groq-powered streaming explanation of exactly what is driving the score |
|  Price History | 24H / 7D / 30D price chart via GeckoTerminal |
|  Timeframe Classifier | Classifies token as Quick Pump / Momentum / Accumulation / Long-Term |
|  Compare Mode | Side-by-side comparison of two tokens with AI verdict on which is better risk/reward |
|  Watchlist Agent | Always-on background agent that polls your saved tokens every 5 minutes and alerts on risk changes |
|  Alert Feed | Live agent notifications when watchlisted token risk shifts significantly |
|  X Layer Support | Native support for OKX's X Layer EVM L2 (chain ID 196) |

---

 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + React Router v8 (SSR) |
| Styling | Tailwind CSS v4 |
| AI | Groq Cloud — llama-3.3-70b-versatile (streamed) |
| Price Data | DexScreener API (free, no key needed) |
| Security Data | GoPlus Security API (free tier) |
| Chart Data | GeckoTerminal OHLCV API (free, no key needed) |
| Deployment | Vercel (serverless SSR) |
| State | Zustand |
| Charts | Recharts |

---

Supported Chains

- Ethereum
- Solana
- BNB Smart Chain (BSC)
- Base
- Arbitrum
- X Layer (OKX's EVM L2 — chain ID 196)

---

 Risk Scoring Methodology

Cryptly's risk engine scores tokens deterministically across 8 signals before any AI is involved. The AI explains the score — it does not determine it.

| Signal | Max Points | Why it matters |
|---|---|---|
| Liquidity / Market Cap ratio | 25 | Low ratio = easy to manipulate or rug |
| Top 10 holder concentration | 25 | High concentration = coordinated dump risk |
| Honeypot detection | 30 | If flagged, you literally cannot sell |
| Contract not verified | 15 | Unverified = hidden code, no audit possible |
| Ownership not renounced | 10 | Owner can still modify contract |
| High sell tax (>10%) | 15 | Significantly reduces exit value |
| Token age (<7 days) | 15 | New tokens have no track record |
| Raw liquidity floor (<$50K) | 15 | Too easy to move price with small capital |

Scores stack up to 100. Lower is safer.

---

How to Run Locally




User Input (contract address + chain)
↓
Data Layer — DexScreener + GoPlus fetched in parallel (server-side)
↓
Risk Engine — deterministic scoring across 8 signals (no AI, fully auditable)
↓
Timeframe Classifier — behavioral pattern recognition from volume/age/volatility
↓
AI Layer — Groq streams explanation of score + patterns in natural language
↓
Dashboard — gauge, chart, flags, metrics rendered simultaneously
↓
Watchlist Agent — background loop re-runs data layer every 5 min per saved token
↓
Alert System — fires when risk score shifts 10+ points or new flags appear

The key design decision: AI explains the score, data determines it.** This makes the risk number auditable and trustworthy, while the AI adds the "why" that raw numbers can't communicate.

---

Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` |  Yes | Groq Cloud API key for AI analysis |
| `GOPLUS_API_KEY` | Optional | GoPlus API key for higher rate limits |

---

Limitations & Honest Caveats

- Not financial advice- Risk scores reflect observable on-chain patterns, not guarantees of future performance.
- Timeframe classification- is pattern-based, not predictive. Crypto markets are inherently unpredictable.
- Very new tokens- (<hours old) may have sparse price history on GeckoTerminal — the chart shows an empty state in this case.
- Solana tokens- have limited GoPlus security coverage compared to EVM chains — security fields may show neutral defaults.
- Watchlist polling- runs client-side while the browser tab is open. A production version would use server-side cron jobs for true always-on monitoring.
