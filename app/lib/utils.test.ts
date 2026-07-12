import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  scoreToLabel,
  scoreToColor,
  classifyTimeframe,
} from "./utils";
import type { TokenMetrics } from "~/types/tokens";

type ScoreInput = Omit<TokenMetrics, "riskScore" | "riskLabel">;

/**
 * Baseline "safe" token — every signal on the good side of every threshold.
 * Individual tests override only the field(s) they're probing, so each
 * test failure points at exactly one boundary in computeRiskScore.
 */
function safeMetrics(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    name: "Test Token",
    symbol: "TEST",
    address: "0x0000000000000000000000000000000000dEaD",
    pairAddress: "0x0000000000000000000000000000000000bEEf",
    chain: "ethereum",
    price: 1,
    priceChange24h: 0,
    marketCap: 10_000_000,
    volume24h: 100_000,
    liquidity: 100_000,
    ageInDays: 120,
    topHolderPct: 10,
    verified: true,
    ownershipRenounced: true,
    honeypotFlag: false,
    buyTax: 0,
    sellTax: 0,
    liquidityRatio: 0.4,
    ...overrides,
  };
}

describe("computeRiskScore", () => {
  it("scores a fully safe token as 0", () => {
    expect(computeRiskScore(safeMetrics())).toBe(0);
  });

  it("caps the score at 100 even when every signal is maximally bad", () => {
    const worst = safeMetrics({
      liquidityRatio: 0.01,
      topHolderPct: 95,
      verified: false,
      ownershipRenounced: false,
      honeypotFlag: true,
      sellTax: 50,
      ageInDays: 1,
      liquidity: 500,
    });
    // raw sum would be 25+25+15+10+30+15+15+15 = 150
    expect(computeRiskScore(worst)).toBe(100);
  });

  describe("liquidity ratio thresholds", () => {
    it("adds 25 when ratio is just under 0.05", () => {
      expect(computeRiskScore(safeMetrics({ liquidityRatio: 0.049 }))).toBe(25);
    });
    it("adds 15 at exactly 0.05 (boundary is exclusive)", () => {
      expect(computeRiskScore(safeMetrics({ liquidityRatio: 0.05 }))).toBe(15);
    });
    it("adds 8 at exactly 0.15", () => {
      expect(computeRiskScore(safeMetrics({ liquidityRatio: 0.15 }))).toBe(8);
    });
    it("adds 0 at exactly 0.3", () => {
      expect(computeRiskScore(safeMetrics({ liquidityRatio: 0.3 }))).toBe(0);
    });
  });

  describe("top holder concentration thresholds", () => {
    it("adds 25 when holder pct is above 80", () => {
      expect(computeRiskScore(safeMetrics({ topHolderPct: 81 }))).toBe(25);
    });
    it("adds 15 at exactly 80 (boundary is exclusive)", () => {
      expect(computeRiskScore(safeMetrics({ topHolderPct: 80 }))).toBe(15);
    });
    it("adds 8 at exactly 50", () => {
      expect(computeRiskScore(safeMetrics({ topHolderPct: 50 }))).toBe(8);
    });
    it("adds 0 at exactly 30", () => {
      expect(computeRiskScore(safeMetrics({ topHolderPct: 30 }))).toBe(0);
    });
  });

  describe("contract safety flags", () => {
    it("adds 15 for an unverified contract", () => {
      expect(computeRiskScore(safeMetrics({ verified: false }))).toBe(15);
    });
    it("adds 10 when ownership is not renounced", () => {
      expect(computeRiskScore(safeMetrics({ ownershipRenounced: false }))).toBe(10);
    });
    it("adds 30 for a flagged honeypot, independent of every other signal", () => {
      expect(computeRiskScore(safeMetrics({ honeypotFlag: true }))).toBe(30);
    });
  });

  describe("sell tax thresholds", () => {
    it("adds 15 above 20%", () => {
      expect(computeRiskScore(safeMetrics({ sellTax: 21 }))).toBe(15);
    });
    it("adds 8 at exactly 20% (boundary is exclusive)", () => {
      expect(computeRiskScore(safeMetrics({ sellTax: 20 }))).toBe(8);
    });
    it("adds 3 at exactly 10%", () => {
      expect(computeRiskScore(safeMetrics({ sellTax: 10 }))).toBe(3);
    });
    it("adds 0 at exactly 5%", () => {
      expect(computeRiskScore(safeMetrics({ sellTax: 5 }))).toBe(0);
    });
  });

  describe("token age thresholds", () => {
    it("adds 15 under 7 days old", () => {
      expect(computeRiskScore(safeMetrics({ ageInDays: 6 }))).toBe(15);
    });
    it("adds 8 at exactly 7 days (boundary is exclusive)", () => {
      expect(computeRiskScore(safeMetrics({ ageInDays: 7 }))).toBe(8);
    });
    it("adds 3 at exactly 30 days", () => {
      expect(computeRiskScore(safeMetrics({ ageInDays: 30 }))).toBe(3);
    });
    it("adds 0 at exactly 90 days", () => {
      expect(computeRiskScore(safeMetrics({ ageInDays: 90 }))).toBe(0);
    });
  });

  describe("raw liquidity floor", () => {
    it("adds 15 under $10K liquidity", () => {
      expect(computeRiskScore(safeMetrics({ liquidity: 9_999 }))).toBe(15);
    });
    it("adds 8 at exactly $10K (boundary is exclusive)", () => {
      expect(computeRiskScore(safeMetrics({ liquidity: 10_000 }))).toBe(8);
    });
    it("adds 0 at exactly $50K", () => {
      expect(computeRiskScore(safeMetrics({ liquidity: 50_000 }))).toBe(0);
    });
  });
});

describe("scoreToLabel", () => {
  it("labels 0-30 as Low Risk, inclusive of the boundary", () => {
    expect(scoreToLabel(0)).toBe("Low Risk");
    expect(scoreToLabel(30)).toBe("Low Risk");
  });
  it("labels 31-55 as Medium Risk", () => {
    expect(scoreToLabel(31)).toBe("Medium Risk");
    expect(scoreToLabel(55)).toBe("Medium Risk");
  });
  it("labels 56-75 as High Risk", () => {
    expect(scoreToLabel(56)).toBe("High Risk");
    expect(scoreToLabel(75)).toBe("High Risk");
  });
  it("labels anything above 75 as Extreme Risk", () => {
    expect(scoreToLabel(76)).toBe("Extreme Risk");
    expect(scoreToLabel(100)).toBe("Extreme Risk");
  });
});

describe("scoreToColor", () => {
  it("matches the same thresholds as scoreToLabel", () => {
    expect(scoreToColor(30)).toBe("var(--green)");
    expect(scoreToColor(31)).toBe("var(--orange)");
    expect(scoreToColor(55)).toBe("var(--orange)");
    expect(scoreToColor(56)).toBe("var(--red)");
    expect(scoreToColor(75)).toBe("var(--red)");
    expect(scoreToColor(76)).toBe("#dc2626");
  });
});

describe("classifyTimeframe", () => {
  it("classifies a young, high-turnover, volatile token as quick_pump", () => {
    const result = classifyTimeframe({
      ageInDays: 5,
      volume24h: 600_000,
      marketCap: 1_000_000,
      liquidity: 100_000,
      priceChange24h: 45,
      topHolderPct: 20,
      riskScore: 60,
    });
    expect(result.category).toBe("quick_pump");
    expect(result.confidence).toBe("high"); // riskScore > 55
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it("classifies a moderately aged token with sustained volume as momentum_play", () => {
    const result = classifyTimeframe({
      ageInDays: 40,
      volume24h: 200_000,
      marketCap: 1_000_000,
      liquidity: 150_000,
      priceChange24h: 5,
      topHolderPct: 35,
      riskScore: 40,
    });
    expect(result.category).toBe("momentum_play");
    expect(result.confidence).toBe("medium");
  });

  it("classifies low volume, healthy liquidity, spread-out holders as accumulation", () => {
    const result = classifyTimeframe({
      ageInDays: 40,
      volume24h: 50_000,
      marketCap: 2_000_000,
      liquidity: 300_000,
      priceChange24h: 1,
      topHolderPct: 25,
      riskScore: 20,
    });
    expect(result.category).toBe("accumulation");
    // accumulation is explicitly always "low" confidence, even with a great risk score
    expect(result.confidence).toBe("low");
  });

  it("falls back to long_term for an old, low-volatility token", () => {
    const result = classifyTimeframe({
      ageInDays: 400,
      volume24h: 80_000,
      marketCap: 5_000_000,
      liquidity: 200_000,
      priceChange24h: 2,
      topHolderPct: 45,
      riskScore: 30,
    });
    expect(result.category).toBe("long_term");
    expect(result.confidence).toBe("high"); // riskScore < 40
  });

  it("drops long_term confidence to medium once risk score crosses 40", () => {
    const result = classifyTimeframe({
      ageInDays: 400,
      volume24h: 80_000,
      marketCap: 5_000_000,
      liquidity: 200_000,
      priceChange24h: 2,
      topHolderPct: 45,
      riskScore: 41,
    });
    expect(result.category).toBe("long_term");
    expect(result.confidence).toBe("medium");
  });
});