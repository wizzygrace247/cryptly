import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { action } from "./api.token";

const DEX_URL_FRAGMENT = "api.dexscreener.com";
const GOPLUS_URL_FRAGMENT = "api.gopluslabs.io";
const TOKEN_ADDRESS = "0xtoken00000000000000000000000000000000";

/** A realistic DexScreener /tokens/v1 response shape, trimmed to what fetchTokenByAddress reads. */
function mockDexScreenerResponse() {
  return {
    pairs: [
      {
        chainId: "ethereum",
        dexId: "uniswap",
        pairAddress: "0xpair000000000000000000000000000000000",
        baseToken: { address: TOKEN_ADDRESS, name: "Test Token", symbol: "TEST" },
        quoteToken: { address: "0xweth", name: "Wrapped Ether", symbol: "WETH" },
        priceUsd: "1.25",
        priceChange: { h24: 12.5, h6: 0, h1: 0, m5: 0 },
        volume: { h24: 500_000, h6: 0 },
        liquidity: { usd: 200_000 },
        marketCap: 2_000_000,
        fdv: 2_000_000,
        pairCreatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // ~30 days old
        info: { imageUrl: "https://example.com/logo.png" },
      },
    ],
  };
}

/** A realistic GoPlus token_security response, trimmed to what fetchTokenSecurity reads. */
function mockGoPlusResponse() {
  return {
    code: 1,
    message: "OK",
    result: {
      [TOKEN_ADDRESS]: {
        is_honeypot: "0",
        is_open_source: "1",
        owner_address: "0x0000000000000000000000000000000000000000",
        buy_tax: "0.02",
        sell_tax: "0.03",
        holders: [{ percent: "0.05" }, { percent: "0.04" }, { percent: "0.03" }], // top10 -> 12%
        cannot_sell_all: "0",
        is_mintable: "0",
        is_proxy: "0",
        is_blacklisted: "0",
      },
    },
  };
}

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/token", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function stubHappyPathFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes(DEX_URL_FRAGMENT)) {
        return new Response(JSON.stringify(mockDexScreenerResponse()), { status: 200 });
      }
      if (url.includes(GOPLUS_URL_FRAGMENT)) {
        return new Response(JSON.stringify(mockGoPlusResponse()), { status: 200 });
      }
      throw new Error(`Unexpected fetch call to ${url}`);
    })
  );
}

describe("POST /api/token action", () => {
  beforeEach(() => {
    stubHappyPathFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("combines DexScreener + GoPlus data and runs it through the real scoring pipeline", async () => {
    const res = await action({
      request: buildRequest({ address: TOKEN_ADDRESS, chain: "ethereum" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    // data merged correctly from the two upstream sources
    expect(body.name).toBe("Test Token");
    expect(body.symbol).toBe("TEST");
    expect(body.price).toBeCloseTo(1.25);
    expect(body.liquidity).toBe(200_000);
    expect(body.marketCap).toBe(2_000_000);
    expect(body.liquidityRatio).toBeCloseTo(0.1); // 200k / 2M

    // GoPlus fields flowed through and were parsed (string -> number/bool) correctly
    expect(body.verified).toBe(true);
    expect(body.ownershipRenounced).toBe(true);
    expect(body.honeypotFlag).toBe(false);
    expect(body.sellTax).toBeCloseTo(3); // "0.03" -> 3%
    expect(body.topHolderPct).toBe(12);

    // and the real computeRiskScore / classifyTimeframe ran on the combined result —
    // this is the part a mocked unit test of the route alone could never prove
    expect(typeof body.riskScore).toBe("number");
    expect(body.riskLabel).toBe("Low Risk");
    expect(body.timeframe?.category).toBeDefined();
  });

  it("returns 400 when address or chain is missing, without calling either upstream API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await action({ request: buildRequest({ address: "", chain: "ethereum" }) });

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 500 with the upstream error message when the token has no DexScreener pairs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(DEX_URL_FRAGMENT)) {
          return new Response(JSON.stringify({ pairs: [] }), { status: 200 });
        }
        return new Response(JSON.stringify(mockGoPlusResponse()), { status: 200 });
      })
    );

    const res = await action({
      request: buildRequest({ address: "0xmissing", chain: "ethereum" }),
    });

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain("Token not found on DexScreener");
  });

  it("still returns 200 with safe defaults when GoPlus is down (route shouldn't hard-fail on a partner outage)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(DEX_URL_FRAGMENT)) {
          return new Response(JSON.stringify(mockDexScreenerResponse()), { status: 200 });
        }
        if (url.includes(GOPLUS_URL_FRAGMENT)) {
          return new Response("Service Unavailable", { status: 503 });
        }
        throw new Error(`Unexpected fetch call to ${url}`);
      })
    );

    const res = await action({
      request: buildRequest({ address: TOKEN_ADDRESS, chain: "ethereum" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Test Token"); // DexScreener side still worked
    expect(body.verified).toBe(false); // GoPlus fell back to its safe defaults
    expect(body.honeypotFlag).toBe(false);
  });

  it("scores a genuinely dangerous token as Extreme Risk, not just passing flags through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(DEX_URL_FRAGMENT)) {
          return new Response(
            JSON.stringify({
              pairs: [
                {
                  chainId: "ethereum",
                  dexId: "uniswap",
                  pairAddress: "0xpair000000000000000000000000000000000",
                  baseToken: { address: TOKEN_ADDRESS, name: "Rug Token", symbol: "RUG" },
                  quoteToken: { address: "0xweth", name: "Wrapped Ether", symbol: "WETH" },
                  priceUsd: "0.0001",
                  priceChange: { h24: 40, h6: 0, h1: 0, m5: 0 },
                  volume: { h24: 900_000, h6: 0 },
                  liquidity: { usd: 40_000 }, // thin liquidity
                  marketCap: 4_000_000, // liquidityRatio = 0.01 → worst bracket
                  fdv: 4_000_000,
                  pairCreatedAt: Date.now(), // brand new → worst age bracket
                },
              ],
            }),
            { status: 200 }
          );
        }
        if (url.includes(GOPLUS_URL_FRAGMENT)) {
          return new Response(
            JSON.stringify({
              code: 1,
              result: {
                [TOKEN_ADDRESS]: {
                  is_honeypot: "1",
                  is_open_source: "0",
                  owner_address: "0xStillOwnedByDeployer0000000000000000",
                  buy_tax: "0",
                  sell_tax: "0.15",
                  holders: [{ percent: "0.85" }], // top10 -> 85%
                },
              },
            }),
            { status: 200 }
          );
        }
        throw new Error(`Unexpected fetch call to ${url}`);
      })
    );

    const res = await action({
      request: buildRequest({ address: TOKEN_ADDRESS, chain: "ethereum" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    // every individual signal is bad...
    expect(body.honeypotFlag).toBe(true);
    expect(body.verified).toBe(false);
    expect(body.topHolderPct).toBe(85);
    // ...and the real computeRiskScore, running on the merged result, reflects it —
    // this is what an integration test proves that isolated unit tests can't.
    expect(body.riskScore).toBe(100); // sums past 100, capped by computeRiskScore
    expect(body.riskLabel).toBe("Extreme Risk");
  });
});