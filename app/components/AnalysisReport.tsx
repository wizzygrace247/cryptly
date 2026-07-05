import { useState, useImperativeHandle, forwardRef } from "react";
import { streamInsight } from "~/lib/ai/groqClient";
import { buildAnalysisPrompt } from "~/lib/ai/promptBuilder";
import type { TokenMetrics } from "~/types/tokens";

export interface AnalysisReportHandle {
  run: () => void;
}

interface Props { token: TokenMetrics }

const AnalysisReport = forwardRef<AnalysisReportHandle, Props>(
  ({ token }, ref) => {
    const [insight, setInsight] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const run = async () => {
      setInsight("");
      setError("");
      setLoading(true);
      try {
        await streamInsight(
          buildAnalysisPrompt(token),
          (t) => setInsight((p) => p + t)
        );
      } catch {
        setError("Analysis failed. Check your API key and try again.");
      } finally {
        setLoading(false);
      }
    };

    // expose run() to parent
    useImperativeHandle(ref, () => ({ run }));

    return (
      <div
        className="rounded-2xl p-6 border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: loading ? "var(--orange)" : insight ? "var(--green)" : "var(--text-muted)",
                boxShadow: loading ? "0 0 6px var(--orange)" : insight ? "0 0 6px var(--green)" : "none",
              }}
            />
            <h3 className="font-semibold text-sm">AI Insights</h3>
            {loading && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                analyzing...
              </span>
            )}
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Analyzing..." : insight ? "Re-analyze" : "Run Analysis"}
          </button>
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
        )}

        {insight ? (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-primary)" }}
          >
            {insight}
            {loading && (
              <span className="animate-pulse" style={{ color: "var(--accent)" }}>▊</span>
            )}
          </p>
        ) : !error ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {loading ? "Agent is analyzing this token..." : "Click Run Analysis to get AI-powered risk insights."}
          </p>
        ) : null}
      </div>
    );
  }
);

AnalysisReport.displayName = "AnalysisReport";
export default AnalysisReport;